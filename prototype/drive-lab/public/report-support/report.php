<?php
declare(strict_types=1);

require_once __DIR__ . '/fpdf/fpdf.php';

final class SessionReportProblem extends RuntimeException
{
    public $status;
    public function __construct(string $reason, int $status = 422) { parent::__construct($reason); $this->status = $status; }
}

function reportKeys($input, array $required, array $optional = []): array
{
    if (!is_array($input) || array_diff($required, array_keys($input))
        || array_diff(array_keys($input), array_merge($required, $optional))) throw new SessionReportProblem('schema_rejected');
    return $input;
}

function reportNumber($value, float $minimum, float $maximum, bool $nullable = false)
{
    if ($nullable && $value === null) return null;
    if ((!is_int($value) && !is_float($value)) || !is_finite((float) $value)
        || $value < $minimum || $value > $maximum) throw new SessionReportProblem('value_rejected');
    return $value;
}

function reportNormalize($input): array
{
    $s = reportKeys($input, ['schema', 'createdAt', 'app', 'source', 'includeRoute', 'summary', 'speedBandsMs', 'headingMs', 'samples', 'system'], ['route', 'routeMap']);
    if ($s['schema'] !== 'sedicivalvole.session-report.v1' || $s['source'] !== 'GPS' || !is_bool($s['includeRoute'])
        || !is_string($s['createdAt']) || !preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/D', $s['createdAt'])
        || strtotime($s['createdAt']) === false) throw new SessionReportProblem('schema_rejected');
    $app = reportKeys($s['app'], ['version', 'build', 'commit']);
    foreach (['version' => '/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/D', 'build' => '/^\d{8}-\d{4}$/D', 'commit' => '/^[a-f0-9]{7,40}$/D'] as $key => $pattern) {
        if (!is_string($app[$key]) || strlen($app[$key]) > 64 || !preg_match($pattern, $app[$key])) throw new SessionReportProblem('identity_rejected');
    }
    $summaryKeys = ['elapsedMs', 'observedMs', 'movingMs', 'stoppedMs', 'unknownMs', 'distanceM', 'averageKmh', 'movingAverageKmh', 'peakKmh', 'stops', 'elevationGainM', 'elevationLossM', 'elevationObservedMs'];
    $summary = reportKeys($s['summary'], $summaryKeys);
    $out = [];
    foreach ($summaryKeys as $key) {
        $maximum = substr($key, -2) === 'Ms' ? 86400000 : (strpos($key, 'Kmh') !== false ? 250 : 10000000);
        $out[$key] = reportNumber($summary[$key], 0, $maximum, in_array($key, ['averageKmh', 'movingAverageKmh', 'peakKmh'], true));
    }
    if (!is_int($out['stops']) || $out['stops'] > 86400 || $out['observedMs'] > $out['elapsedMs'] + 1
        || abs($out['movingMs'] + $out['stoppedMs'] - $out['observedMs']) > 1
        || abs($out['unknownMs'] + $out['observedMs'] - $out['elapsedMs']) > 1
        || $out['elevationObservedMs'] > $out['observedMs'] + 1) throw new SessionReportProblem('totals_rejected');
    $vectors = [];
    foreach (['speedBandsMs' => 5, 'headingMs' => 8] as $key => $length) {
        if (!is_array($s[$key]) || array_keys($s[$key]) !== range(0, $length - 1)) throw new SessionReportProblem('vector_rejected');
        $vectors[$key] = array_map(function ($n) { return reportNumber($n, 0, 86400000); }, $s[$key]);
        if (array_sum($vectors[$key]) > $out[$key === 'headingMs' ? 'movingMs' : 'observedMs'] + 1) throw new SessionReportProblem('totals_rejected');
    }
    if (!is_array($s['samples']) || count($s['samples']) > 720 || ($s['samples'] && array_keys($s['samples']) !== range(0, count($s['samples']) - 1))) throw new SessionReportProblem('samples_rejected');
    $samples = []; $last = -1;
    foreach ($s['samples'] as $sample) {
        $sample = reportKeys($sample, ['t', 'speedKmh', 'altitudeM', 'gap'], ['groundElevationM']);
        $t = reportNumber($sample['t'], 0, 86400);
        if ($t < $last || !is_bool($sample['gap'])) throw new SessionReportProblem('samples_rejected');
        $altitude = reportNumber($sample['altitudeM'], -500, 10000, true);
        $ground = reportNumber($sample['groundElevationM'] ?? null, -500, 10000, true);
        $samples[] = ['t' => $t, 'speedKmh' => reportNumber($sample['speedKmh'], 0, 250, true), 'altitudeM' => $altitude, 'groundElevationM' => $altitude === null ? $ground : null, 'gap' => $sample['gap']];
        $last = $t;
    }
    $route = $s['route'] ?? [];
    if (!is_array($route) || count($route) > 1024 || (!$s['includeRoute'] && $route)
        || ($route && array_keys($route) !== range(0, count($route) - 1))) throw new SessionReportProblem('route_rejected');
    $points = [];
    foreach ($route as $point) {
        $point = reportKeys($point, ['latitude', 'longitude']);
        $points[] = ['latitude' => reportNumber($point['latitude'], -90, 90), 'longitude' => reportNumber($point['longitude'], -180, 180)];
    }
    $routeMap = null;
    if (isset($s['routeMap'])) {
        $image = $s['routeMap'];
        if (!$s['includeRoute'] || count($points) < 2 || !is_string($image) || strlen($image) > 800000
            || !preg_match('#^data:image/jpeg;base64,([A-Za-z0-9+/]+={0,2})$#D', $image, $matches)) throw new SessionReportProblem('map_rejected');
        $bytes = base64_decode($matches[1], true);
        $size = $bytes === false ? false : @getimagesizefromstring($bytes);
        if (!$size || $size[0] !== 1000 || $size[1] !== 900 || $size[2] !== IMAGETYPE_JPEG || strlen($bytes) > 600000) throw new SessionReportProblem('map_rejected');
        $routeMap = 'data:image/jpeg;base64,' . base64_encode($bytes);
    }
    $systemKeys = ['audio', 'averageFps', 'p95FrameMs', 'longTaskCount', 'downloadBytes', 'uploadBytes', 'engineRpm', 'engineGear', 'engineLoad'];
    $system = reportKeys($s['system'], $systemKeys);
    if (!in_array($system['audio'], ['running', 'suspended', 'interrupted', 'closed', 'unavailable'], true)) throw new SessionReportProblem('system_rejected');
    $health = ['audio' => $system['audio']];
    foreach (['averageFps' => 1000, 'p95FrameMs' => 86400000, 'longTaskCount' => 10000000, 'downloadBytes' => 1e12, 'uploadBytes' => 1e12, 'engineRpm' => 30000, 'engineGear' => 12, 'engineLoad' => 1] as $key => $maximum) {
        $health[$key] = reportNumber($system[$key], 0, $maximum, true);
    }
    foreach (['longTaskCount', 'engineGear'] as $key) if ($health[$key] !== null && !is_int($health[$key])) throw new SessionReportProblem('system_rejected');
    return ['schema' => $s['schema'], 'createdAt' => $s['createdAt'], 'app' => $app, 'source' => 'GPS', 'includeRoute' => $s['includeRoute'], 'summary' => $out, 'speedBandsMs' => $vectors['speedBandsMs'], 'headingMs' => $vectors['headingMs'], 'samples' => $samples, 'route' => $points, 'system' => $health] + ($routeMap === null ? [] : ['routeMap' => $routeMap]);
}

final class TravelReportPdf extends FPDF
{
    private $reportDate;
    public function __construct(int $createdAt) { parent::__construct('P', 'mm', 'A4'); $this->reportDate = $createdAt; }
    protected function _putinfo() { $zone = date_default_timezone_get(); date_default_timezone_set('UTC'); $this->CreationDate = $this->reportDate; parent::_putinfo(); date_default_timezone_set($zone); }
    public function Footer() {
        $this->SetY(-14); $this->SetDrawColor(206, 207, 200); $this->Line(16, $this->GetY(), 194, $this->GetY());
        $this->SetFont('Helvetica', '', 8); $this->SetTextColor(90, 96, 92);
        $this->Cell(145, 9, 'sedicivalvole / Travel Report / Experimental'); $this->Cell(33, 9, $this->PageNo() . ' / {nb}', 0, 0, 'R');
    }
    public function section(string $title, float $y): void {
        $this->SetXY(16, $y); $this->SetTextColor(40, 48, 43); $this->SetFont('Helvetica', 'B', 11); $this->Cell(178, 8, $title);
    }
    public function note(string $text, float $y): void {
        $this->SetXY(16, $y); $this->SetTextColor(86, 93, 87); $this->SetFont('Helvetica', '', 9); $this->MultiCell(178, 4.8, $text);
    }
    public function traceDash(bool $dashed): void {
        $this->_out($dashed ? sprintf('[%.2F %.2F] 0 d', 2 * $this->k, 1.4 * $this->k) : '[] 0 d');
    }
    public function traceSegment(array $points, bool $dashed): void {
        if (count($points) < 2) return;
        $this->traceDash($dashed); $path = [];
        foreach ($points as $index => $point) $path[] = sprintf('%.2F %.2F %s', $point[0] * $this->k, ($this->h - $point[1]) * $this->k, $index === 0 ? 'm' : 'l');
        // One stroke keeps the dash pattern visible even with densely sampled points.
        $this->_out(implode(' ', $path) . ' S'); $this->traceDash(false);
    }
}

function reportDuration($ms): string { return sprintf('%d:%02d:%02d', floor($ms / 3600000), floor($ms / 60000) % 60, floor($ms / 1000) % 60); }
function reportValue($value, string $suffix = '', int $decimals = 0): string { return $value === null ? 'Unavailable' : number_format((float) $value, $decimals, '.', ',') . $suffix; }

function reportTrace(TravelReportPdf $pdf, array $samples, string $field, float $x, float $y, float $w, float $h, array $color, bool $grid): void
{
    $values = []; $hasGps = false; $hasMap = false;
    foreach ($samples as $sample) {
        $value = $sample[$field];
        if ($field === 'altitudeM') {
            if ($value !== null) $hasGps = true;
            elseif (($sample['groundElevationM'] ?? null) !== null) { $value = $sample['groundElevationM']; $hasMap = true; }
        }
        if ($value !== null) $values[] = $value;
    }
    $low = $field === 'altitudeM' && $values ? floor(min($values) / 25) * 25 : 0;
    $high = max($field === 'speedKmh' ? 30 : 1, $values ? max($values) : 1);
    if ($high <= $low) $high = $low + 1;
    $first = $samples ? $samples[0]['t'] : 0; $last = $samples ? $samples[count($samples) - 1]['t'] : 1;
    if ($grid) {
        $pdf->SetDrawColor(215, 218, 210); $pdf->SetLineWidth(0.2);
        for ($i = 0; $i < 4; $i++) $pdf->Line($x, $y + $h * $i / 3, $x + $w, $y + $h * $i / 3);
    }
    $pdf->SetDrawColor(...$color); $pdf->SetLineWidth(0.65); $pdf->traceDash(false); $segment = []; $segmentSource = null;
    foreach ($samples as $sample) {
        $value = $sample[$field]; $source = $field;
        if ($field === 'altitudeM' && $value === null) { $value = $sample['groundElevationM'] ?? null; $source = 'groundElevationM'; }
        if ($value === null || $sample['gap'] || ($segmentSource !== null && $segmentSource !== $source)) {
            $pdf->traceSegment($segment, $segmentSource === 'groundElevationM'); $segment = []; $segmentSource = null;
        }
        if ($value === null || $sample['gap']) continue;
        $segment[] = [$x + ($sample['t'] - $first) / max(1, $last - $first) * $w, $y + $h - ($value - $low) / ($high - $low) * $h];
        $segmentSource = $source;
    }
    $pdf->traceSegment($segment, $segmentSource === 'groundElevationM');
    $pdf->traceDash(false);
    $pdf->SetTextColor(...$color); $pdf->SetFont('Helvetica', '', 8);
    $label = $field === 'speedKmh' ? 'Speed ' : ($hasMap ? ($hasGps ? 'GPS / map elevation ' : 'Map elevation estimate ') : 'GPS altitude ');
    $pdf->SetXY($x, $y - 6); $pdf->Cell($w, 5, $label . reportValue($low) . '-' . reportValue($high) . ($field === 'speedKmh' ? ' km/h' : ' m'), 0, 0, $grid ? 'L' : 'R');
    if ($grid) {
        $pdf->SetTextColor(86, 93, 87); $pdf->SetFont('Helvetica', '', 8); $pdf->SetXY($x, $y + $h + 1);
        $pdf->Cell($w / 2, 4, '0:00:00'); $pdf->Cell($w / 2, 4, reportDuration(max(0, $last - $first) * 1000), 0, 0, 'R');
    }
}

function reportText(TravelReportPdf $pdf, string $text, float $x, float $y, float $size = 10, bool $bold = false, array $color = [27,43,47]): void {
    $pdf->SetTextColor(...$color); $pdf->SetFont('Helvetica', $bold ? 'B' : '', $size); $pdf->SetXY($x,$y); $pdf->Cell(178,7,$text);
}
function reportChapter(TravelReportPdf $pdf, string $number, string $title, string $subtitle): void {
    $pdf->AddPage(); $pdf->SetFillColor(247,247,242); $pdf->Rect(0,0,210,297,'F');
    reportText($pdf,'SEDICIVALVOLE / TRAVEL REPORT',16,12,9,true); reportText($pdf,$number,179,12,13,true,[214,55,41]);
    $pdf->SetDrawColor(27,43,47); $pdf->SetLineWidth(.4); $pdf->Line(16,26,194,26);
    reportText($pdf,$title,16,33,30,true); reportText($pdf,$subtitle,16,48,10);
}
function reportMetric(TravelReportPdf $pdf, string $label, string $value, float $x, float $y, float $width = 85): void {
    $pdf->SetDrawColor(198,209,207); $pdf->SetLineWidth(.25); $pdf->Line($x,$y,$x+$width,$y);
    reportText($pdf,strtoupper($label),$x,$y+4,8,true,[83,101,104]);
    reportText($pdf,$value,$x,$y+14,23,true);
}
function reportOutline(TravelReportPdf $pdf, array $route, float $x, float $y, float $w, float $h): void {
    if(count($route)<2)return;
    $lat=array_sum(array_column($route,'latitude'))/count($route);$points=[];$last=null;
    foreach($route as $p){$lon=$p['longitude'];if($last!==null){while($lon-$last>180)$lon-=360;while($lon-$last< -180)$lon+=360;}$last=$lon;$points[]=[$lon*max(.087,cos(deg2rad($lat))),$p['latitude']];}
    $xs=array_column($points,0);$ys=array_column($points,1);$dx=max($xs)-min($xs);$dy=max($ys)-min($ys);
    $scale=min(($w-20)/max(.00001,$dx),($h-20)/max(.00001,$dy));$left=$x+($w-$dx*$scale)/2;$top=$y+($h-$dy*$scale)/2;
    $draw=array_map(function($p)use($left,$top,$xs,$ys,$scale){return [$left+($p[0]-min($xs))*$scale,$top+(max($ys)-$p[1])*$scale];},$points);
    $pdf->SetDrawColor(214,55,41);$pdf->SetLineWidth(.9);$pdf->traceSegment($draw,false);
    foreach([$draw[0],$draw[count($draw)-1]] as $i=>$p){$pdf->SetFillColor(27,43,47);$pdf->Rect($p[0]-1.2,$p[1]-1.2,2.4,2.4,'F');reportText($pdf,$i?'FINISH':'START',$p[0]+2,$p[1]-7,8,true);}
}
function reportBuildPdf(array $s): string
{
    $pdf=new TravelReportPdf(strtotime($s['createdAt']));$pdf->SetMargins(16,16,16);$pdf->SetAutoPageBreak(false);$pdf->SetCompression(true);$pdf->AliasNbPages();
    $pdf->SetTitle('sedicivalvole Travel Report');$pdf->SetAuthor('enuzzo');$pdf->SetCreator('sedicivalvole report / FPDF 1.9');
    $summary=$s['summary'];$coverage=$summary['elapsedMs']?$summary['observedMs']/$summary['elapsedMs']*100:0;
    $hasMapElevation=(bool)array_filter($s['samples'],function($p){return $p['altitudeM']===null&&($p['groundElevationM']??null)!==null;});
    $ink=[27,43,47];$red=[214,55,41];$blue=[35,115,151];
    $pdf->AddPage();$pdf->SetFillColor(247,247,242);$pdf->Rect(0,0,210,297,'F');
    $pdf->SetFillColor(...$ink);$pdf->Rect(0,0,210,65,'F');$pdf->Image(__DIR__.'/report-mark.png',16,13,24);
    reportText($pdf,'TRAVEL REPORT',50,15,11,true,[238,241,229]);reportText($pdf,'Every journey has a rhythm.',50,29,21,true,[255,255,250]);
    reportText($pdf,substr($s['createdAt'],0,10).' / GPS SESSION',50,46,10,false,[186,204,207]);
    reportText($pdf,'THE OBSERVED JOURNEY',16,77,9,true);
    $distance=$summary['observedMs']?reportValue($summary['distanceM']/1000,'',1):'--';
    reportText($pdf,$distance,13,102,76,true,$red);reportText($pdf,'KILOMETRES',16,125,10,true,$red);
    reportMetric($pdf,'Session duration',reportDuration($summary['elapsedMs']),112,81,82);
    reportMetric($pdf,'Moving average',reportValue($summary['movingAverageKmh'],' km/h'),112,118,82);
    reportText($pdf,'A journey at a glance',16,155,18,true);
    reportMetric($pdf,'Peak speed',reportValue($summary['peakKmh'],' km/h'),16,171,54);
    reportMetric($pdf,'Stops',(string)$summary['stops'],78,171,54);
    reportMetric($pdf,'GPS coverage',reportValue($coverage,'%'),140,171,54);
    $pdf->section('Where the time went',214);$x=16;$width=178;
    $parts=[['MOVING',$summary['movingMs'],[35,115,151]],['STOPPED',$summary['stoppedMs'],[214,55,41]],['UNOBSERVED',$summary['unknownMs'],[198,209,207]]];
    foreach($parts as $i=>$part){$w=$summary['elapsedMs']?$width*$part[1]/$summary['elapsedMs']:0;$pdf->SetFillColor(...$part[2]);$pdf->Rect($x,227,$w,5,'F');$x+=$w;reportText($pdf,$part[0],16+$i*61,238,8,true);reportText($pdf,reportDuration($part[1]),16+$i*61,246,15,true);}
    reportText($pdf,'01 / JOURNEY   '.($s['includeRoute']?'02 / MAP   03 / RHYTHM   04 / SESSION':'02 / RHYTHM   03 / SESSION'),16,263,8,true);
    if($s['includeRoute']){
        reportChapter($pdf,'02','Your route','Route included by request');
        $pdf->SetFillColor(229,236,230);$pdf->Rect(16,64,178,160.2,'F');
        if(!empty($s['routeMap'])){$pdf->Image($s['routeMap'],16,64,178,160.2,'JPG');reportText($pdf,'OpenFreeMap / OpenMapTiles / (c) OpenStreetMap contributors',16,227,8);}
        else{reportOutline($pdf,$s['route'],16,64,178,160.2);reportText($pdf,count($s['route'])>=2?'Map unavailable - observed route outline retained.':'Not enough location observations to draw a route.',16,229,10,true);}
        reportMetric($pdf,'Retained observations',(string)count($s['route']).' points',16,242,85);
        reportMetric($pdf,'Orientation','North up',109,242,85);
        $pdf->note('Observed positions, without road matching. Missing observations may leave incomplete coverage.',271);
    }
    reportChapter($pdf,$s['includeRoute']?'03':'02','The rhythm','Speed, elevation and time - each on its own scale.');
    reportTrace($pdf,$s['samples'],'speedKmh',16,76,178,44,$red,true);
    reportTrace($pdf,$s['samples'],'altitudeM',16,143,178,44,$blue,true);
    if(!$s['samples'])$pdf->note('No GPS observations were available. No journey has been inferred.',195);
    else $pdf->note($hasMapElevation?'Blue: GPS altitude (solid), map elevation estimate (dashed). Breaks mark missing observations or source changes.':'Breaks mark missing observations. Altitude alone cannot establish reliable ascent or descent.',195);
    if($hasMapElevation){reportText($pdf,'Map elevation estimate: Open-Meteo / Copernicus GLO-90 (CC BY 4.0)',16,208,8,false,$blue);$pdf->Link(16,208,178,7,'https://open-meteo.com/en/docs/elevation-api');}
    $pdf->section('Time at each speed',218);
    foreach(['0-30','30-60','60-90','90-130','130+'] as $i=>$label){$y=230+$i*8;$ratio=$summary['observedMs']?$s['speedBandsMs'][$i]/$summary['observedMs']:0;
        reportText($pdf,$label.' km/h',16,$y,9);$pdf->SetFillColor(222,231,227);$pdf->Rect(47,$y+2,96,3.5,'F');$pdf->SetFillColor(...$red);$pdf->Rect(47,$y+2,96*$ratio,3.5,'F');
        reportText($pdf,reportDuration($s['speedBandsMs'][$i]),150,$y,9,true);}
    reportChapter($pdf,$s['includeRoute']?'04':'03','Session details','Direction, observation quality and the system behind the journey.');
    $rows=[['Moving / stopped',reportDuration($summary['movingMs']).' / '.reportDuration($summary['stoppedMs'])],['Unobserved time',reportDuration($summary['unknownMs'])],['Stops',(string)$summary['stops']],['Average / peak speed',reportValue($summary['averageKmh'],' km/h').' / '.reportValue($summary['peakKmh'],' km/h')],['GPS elevation gain / loss',$summary['elevationObservedMs']?reportValue($summary['elevationGainM'],' m').' / '.reportValue($summary['elevationLossM'],' m'):'Unavailable']];
    foreach($rows as $i=>$row){$y=64+$i*9;reportText($pdf,$row[0],16,$y,10);$pdf->SetXY(112,$y);$pdf->SetFont('Helvetica','B',10);$pdf->Cell(82,7,$row[1],0,0,'R');}
    $pdf->section('Heading / time moving',117);
    $cx=58;$cy=158;$maximum=max(1,max($s['headingMs']));
    foreach(['N','NE','E','SE','S','SW','W','NW'] as $i=>$label){$angle=deg2rad($i*45-90);$end=25;$length=25*$s['headingMs'][$i]/$maximum;
        $pdf->SetDrawColor(214,224,220);$pdf->SetLineWidth(.5);$pdf->Line($cx,$cy,$cx+cos($angle)*$end,$cy+sin($angle)*$end);
        $pdf->SetDrawColor(...$blue);$pdf->SetLineWidth(2);$pdf->Line($cx,$cy,$cx+cos($angle)*$length,$cy+sin($angle)*$length);
        reportText($pdf,$label,$cx+cos($angle)*31-3,$cy+sin($angle)*31-3,8,true);
        reportText($pdf,$label.'   '.reportDuration($s['headingMs'][$i]),117,130+$i*7,9);}
    $pdf->section('System snapshot',199);$system=$s['system'];
    $technical=[['Audio context',$system['audio']],['Frame average / p95',reportValue($system['averageFps'],' FPS').' / '.reportValue($system['p95FrameMs'],' ms')],['Observed long tasks',reportValue($system['longTaskCount'])],['Observed download / upload',reportValue($system['downloadBytes']===null?null:$system['downloadBytes']/1048576,' MB',1).' / '.reportValue($system['uploadBytes']===null?null:$system['uploadBytes']/1048576,' MB',1)],['Engine simulated RPM / gear',reportValue($system['engineRpm']).' / '.reportValue($system['engineGear'])],['Engine simulated load',reportValue($system['engineLoad']===null?null:$system['engineLoad']*100,'%')]];
    foreach($technical as $i=>$row){$y=211+$i*7;reportText($pdf,$row[0],16,$y,9);$pdf->SetXY(112,$y);$pdf->SetFont('Helvetica','B',9);$pdf->Cell(82,7,$row[1],0,0,'R');}
    $pdf->SetXY(16,259);$pdf->SetFont('Helvetica','',8);$pdf->SetTextColor(83,101,104);$pdf->MultiCell(178,4,'Technical appendix. GPS distance uses observed speed; gaps remain unknown. Elevation gain/loss requires accuracy evidence. Network totals exclude opaque/cache traffic. Engine figures are simulation, not vehicle telemetry.');
    if($hasMapElevation){$pdf->SetXY(16,251);$pdf->SetFont('Helvetica','',8);$pdf->MultiCell(178,4,'Open-Meteo / EU Copernicus GLO-90: 90 m DEM near a rounded lookup cell. Map estimates do not enter GPS gain/loss.');}
    reportText($pdf,'v'.$s['app']['version'].' / BUILD '.$s['app']['build'].' / '.$s['app']['commit'],16,272,8,true);
    return $pdf->Output('S');
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }
