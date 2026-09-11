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
    $s = reportKeys($input, ['schema', 'createdAt', 'app', 'source', 'includeRoute', 'summary', 'speedBandsMs', 'headingMs', 'samples', 'system'], ['route', 'routeMap', 'experience']);
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
    $experience = isset($s['experience']) ? reportExperience($s['experience']) : null;
    return ['schema' => $s['schema'], 'createdAt' => $s['createdAt'], 'app' => $app, 'source' => 'GPS', 'includeRoute' => $s['includeRoute'], 'summary' => $out, 'speedBandsMs' => $vectors['speedBandsMs'], 'headingMs' => $vectors['headingMs'], 'samples' => $samples, 'route' => $points, 'system' => $health] + ($routeMap === null ? [] : ['routeMap' => $routeMap]) + ($experience === null ? [] : ['experience' => $experience]);
}

function reportExperience($input): array {
    $data = reportKeys($input, ['observedMs','listeningMs','unlistedTrackMs','tracks','genres','visuals','palettes']);
    foreach(['observedMs','listeningMs','unlistedTrackMs'] as $key) reportNumber($data[$key],0,86400000);
    if($data['listeningMs']>$data['observedMs']+1 || $data['unlistedTrackMs']>$data['listeningMs']+1) throw new SessionReportProblem('experience_rejected');
    foreach(['tracks'=>64,'genres'=>32,'visuals'=>32,'palettes'=>32] as $kind=>$limit){
        $rows=$data[$kind];$total=0;$ids=[];
        if(!is_array($rows)||count($rows)>$limit||($rows&&array_keys($rows)!==range(0,count($rows)-1))) throw new SessionReportProblem('experience_rejected');
        foreach($rows as $row){
            reportKeys($row,['id','label','ms'], $kind==='tracks'?['detail']:($kind==='palettes'?['colors']:[]));
            foreach(['id'=>100,'label'=>120,'detail'=>120] as $key=>$length){
                if(!isset($row[$key])&&$key==='detail')continue;
                if(!is_string($row[$key])||!preg_match('//u',$row[$key])||strlen($row[$key])>$length*4
                    ||preg_match('/[\x00-\x1f\x7f<>]/u',$row[$key])||($key!=='detail'&&trim($row[$key])==='')) throw new SessionReportProblem('experience_rejected');
            }
            if(!preg_match('/^[A-Za-z0-9._:-]+$/D',$row['id'])||isset($ids[$row['id']]))throw new SessionReportProblem('experience_rejected');
            $ids[$row['id']]=true;$total+=reportNumber($row['ms'],0,86400000);
            if($kind==='palettes'){
                $colors=$row['colors']??[];
                if(!is_array($colors)||count($colors)>3||($colors&&array_keys($colors)!==range(0,count($colors)-1)))throw new SessionReportProblem('experience_rejected');
                foreach($colors as $color)if(!is_string($color)||!preg_match('/^#[a-f0-9]{6}$/iD',$color))throw new SessionReportProblem('experience_rejected');
            }
        }
        $ceiling=in_array($kind,['tracks','genres'],true)?$data['listeningMs']:$data['observedMs'];
        if($kind==='tracks')$total+=$data['unlistedTrackMs'];
        if($total>$ceiling+1)throw new SessionReportProblem('experience_rejected');
        usort($data[$kind],function($a,$b){return $b['ms']<=>$a['ms'] ?: strcmp($a['id'],$b['id']);});
    }
    return $data;
}

final class TravelReportPdf extends FPDF
{
    private $reportDate;
    public function __construct(int $createdAt) {
        parent::__construct('P', 'mm', 'A4'); $this->reportDate = $createdAt;
        $this->AddFont('SpaceGrotesk','','space-grotesk-regular.json',__DIR__.'/fonts');
        $this->AddFont('SpaceGrotesk','B','space-grotesk-semibold.json',__DIR__.'/fonts');
    }
    protected function _putinfo() { $zone = date_default_timezone_get(); date_default_timezone_set('UTC'); $this->CreationDate = $this->reportDate; parent::_putinfo(); date_default_timezone_set($zone); }
    public function Footer() {
        $this->SetY(-14); $this->SetLineWidth(0.2); $this->SetDrawColor(206, 207, 200); $this->Line(16, $this->GetY(), 194, $this->GetY());
        $this->SetFont('SpaceGrotesk', '', 8); $this->SetTextColor(90, 96, 92);
        $this->Cell(145, 9, 'sedicivalvole / Travel Report / Experimental'); $this->Cell(33, 9, $this->PageNo() . ' / {nb}', 0, 0, 'R');
    }
    public function section(string $title, float $y): void {
        $this->SetXY(16, $y); $this->SetTextColor(40, 48, 43); $this->SetFont('SpaceGrotesk', 'B', 11); $this->Cell(178, 8, $title);
    }
    public function note(string $text, float $y): void {
        $this->SetXY(16, $y); $this->SetTextColor(86, 93, 87); $this->SetFont('SpaceGrotesk', '', 9); $this->MultiCell(178, 4.8, $text);
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
    public function arc(float $cx,float $cy,float $radius,float $start,float $end): void {
        $point=function($x,$y){return sprintf('%.3F %.3F',$x*$this->k,($this->h-$y)*$this->k);};
        $parts=max(1,(int)ceil(abs($end-$start)/(M_PI/2)));$step=($end-$start)/$parts;
        $path=$point($cx+cos($start)*$radius,$cy+sin($start)*$radius).' m';
        for($i=0;$i<$parts;$i++){
            $a=$start+$i*$step;$b=$a+$step;$k=4/3*tan($step/4);
            $path.=' '.$point($cx+$radius*(cos($a)-$k*sin($a)),$cy+$radius*(sin($a)+$k*cos($a)))
                .' '.$point($cx+$radius*(cos($b)+$k*sin($b)),$cy+$radius*(sin($b)-$k*cos($b)))
                .' '.$point($cx+$radius*cos($b),$cy+$radius*sin($b)).' c';
        }
        $this->_out('0 J '.$path.' S');
    }
    public function card(float $x,float $y,float $w,float $h,array $fill): void {
        $this->SetFillColor(...$fill);$r=3;$k=.55228475;
        $p=function($x,$y){return sprintf('%.3F %.3F',$x*$this->k,($this->h-$y)*$this->k);};
        $this->_out($p($x+$r,$y).' m '.$p($x+$w-$r,$y).' l '.$p($x+$w-$r+$r*$k,$y).' '.$p($x+$w,$y+$r-$r*$k).' '.$p($x+$w,$y+$r).' c '
            .$p($x+$w,$y+$h-$r).' l '.$p($x+$w,$y+$h-$r+$r*$k).' '.$p($x+$w-$r+$r*$k,$y+$h).' '.$p($x+$w-$r,$y+$h).' c '
            .$p($x+$r,$y+$h).' l '.$p($x+$r-$r*$k,$y+$h).' '.$p($x,$y+$h-$r+$r*$k).' '.$p($x,$y+$h-$r).' c '
            .$p($x,$y+$r).' l '.$p($x,$y+$r-$r*$k).' '.$p($x+$r-$r*$k,$y).' '.$p($x+$r,$y).' c f');
    }
}

function reportDuration($ms): string { return sprintf('%d:%02d:%02d', floor($ms / 3600000), floor($ms / 60000) % 60, floor($ms / 1000) % 60); }
function reportValue($value, string $suffix = '', int $decimals = 0): string { return $value === null ? 'Unavailable' : number_format((float) $value, $decimals, '.', ',') . $suffix; }

function reportTrace(TravelReportPdf $pdf, array $samples, string $field, float $x, float $y, float $w, float $h, array $color, bool $grid): array
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
    $padding = $values ? max(5, (max($values)-min($values))*.1) : 5;
    $low = $field === 'altitudeM' ? ($values ? floor((min($values)-$padding)/5)*5 : -5) : 0;
    $high = $field === 'altitudeM' ? ($values ? ceil((max($values)+$padding)/5)*5 : 5) : max(30, $values ? ceil(max($values)/10)*10 : 30);
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
    $pdf->SetTextColor(...$color); $pdf->SetFont('SpaceGrotesk', '', 8);
    $label = $field === 'speedKmh' ? 'Speed ' : ($hasMap ? ($hasGps ? 'GPS / map elevation ' : 'Map elevation estimate ') : 'GPS altitude ');
    $pdf->SetXY($x, $y - 6); $pdf->Cell($w, 5, $values ? $label . reportValue($low) . '-' . reportValue($high) . ($field === 'speedKmh' ? ' km/h' : ' m') : $label.'unavailable', 0, 0, $grid ? 'L' : 'R');
    if ($grid) {
        $pdf->SetTextColor(86, 93, 87); $pdf->SetFont('SpaceGrotesk', '', 8); $pdf->SetXY($x, $y + $h + 1);
        $pdf->Cell($w / 2, 4, '0:00:00'); $pdf->Cell($w / 2, 4, reportDuration(max(0, $last - $first) * 1000), 0, 0, 'R');
    }
    return ['low'=>$low,'high'=>$high,'available'=>(bool)$values];
}

function reportText(TravelReportPdf $pdf, string $text, float $x, float $y, float $size = 10, bool $bold = false, array $color = [27,43,47]): void {
    $pdf->SetTextColor(...$color); $pdf->SetFont('SpaceGrotesk', $bold ? 'B' : '', $size); $pdf->SetXY($x,$y); $pdf->Cell(178,7,reportEncoding($text));
}
function reportEncoding(string $text): string { return iconv('UTF-8','windows-1252//TRANSLIT',$text) ?: ''; }
function reportFit(TravelReportPdf $pdf,string $text,float $x,float $y,float $width,float $size=18,array $color=[27,43,47]): void {
    $encoded=reportEncoding($text);$pdf->SetFont('SpaceGrotesk','B',$size);
    $size=max(8,min($size,$size*$width/max(1,$pdf->GetStringWidth($encoded))));$pdf->SetFont('SpaceGrotesk','B',$size);
    while($pdf->GetStringWidth($encoded)>$width&&strlen($encoded)>1)$encoded=substr($encoded,0,-2).'~';
    $pdf->SetTextColor(...$color);$pdf->SetXY($x,$y);$pdf->Cell($width,7,$encoded);
}
function reportTile(TravelReportPdf $pdf,string $label,string $value,float $x,float $y,float $w,float $h,array $fill=[232,237,230],float $size=23): void {
    $pdf->card($x,$y,$w,$h,$fill);reportText($pdf,strtoupper($label),$x+5,$y+3,8,true,[83,101,104]);
    reportFit($pdf,$value,$x+5,$y+$h*.5,$w-10,$size);
}
function reportHeadingWaves(TravelReportPdf $pdf,array $headings,float $cx,float $cy): void {
    $maximum=max(1,max($headings));
    foreach(['N','NE','E','SE','S','SW','W','NW'] as $i=>$label){
        $angle=$i*M_PI/4-M_PI/2;$bands=$headings[$i]>0?max(1,(int)ceil(6*$headings[$i]/$maximum)):0;
        for($band=0;$band<6;$band++){
            $pdf->SetDrawColor(...($band<$bands?[214,55,41]:[213,221,214]));$pdf->SetLineWidth(2.2);
            $pdf->arc($cx,$cy,5.5+$band*4.3,$angle-M_PI/8+.055,$angle+M_PI/8-.055);
        }
        reportText($pdf,$label,$cx+cos($angle)*35-2.5,$cy+sin($angle)*35-3.5,8,true);
    }
    $pdf->SetLineWidth(.2);
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
    $ink=[27,43,47];$red=[214,55,41];$blue=[35,115,151];$paper=[247,247,242];$sage=[232,237,230];$rose=[250,226,219];$sky=[222,235,240];
    $chapter=$s['includeRoute']?3:2;

    $pdf->AddPage();$pdf->SetFillColor(...$paper);$pdf->Rect(0,0,210,297,'F');
    $pdf->card(16,12,27,31,$ink);$pdf->Image(__DIR__.'/report-mark.png',19,16,21);reportText($pdf,'TRAVEL REPORT',50,17,10,true);
    reportText($pdf,substr($s['createdAt'],0,10).' / GPS SESSION',50,28,9,false,[83,101,104]);
    reportText($pdf,'Every journey',16,50,32,true);reportText($pdf,'has a rhythm.',16,64,32,true);
    $pdf->card(16,90,112,91,$ink);reportText($pdf,'THE OBSERVED JOURNEY',22,97,9,true,[196,217,211]);
    $distance=$summary['observedMs']?reportValue($summary['distanceM']/1000,'',1):'--';
    reportFit($pdf,$distance,20,130,100,66,[251,245,221]);reportText($pdf,'KILOMETRES',23,159,10,true,[196,217,211]);
    reportTile($pdf,'Session duration',reportDuration($summary['elapsedMs']),134,90,60,43,$sage,24);
    reportTile($pdf,'Moving average',reportValue($summary['movingAverageKmh'],' km/h'),134,139,60,42,$sky,24);
    reportTile($pdf,'Peak speed',reportValue($summary['peakKmh'],' km/h'),16,187,56,38,$rose,22);
    reportTile($pdf,'Stops',(string)$summary['stops'],77,187,56,38,$sage,27);
    reportTile($pdf,'GPS coverage',reportValue($coverage,'%'),138,187,56,38,$sky,27);
    $pdf->card(16,231,178,41,$sage);reportText($pdf,'WHERE THE TIME WENT',22,234,8,true);
    $parts=[['MOVING',$summary['movingMs'],$blue],['STOPPED',$summary['stoppedMs'],$red],['UNOBSERVED',$summary['unknownMs'],[154,169,164]]];$x=22;
    foreach($parts as $i=>$part){$w=$summary['elapsedMs']?166*$part[1]/$summary['elapsedMs']:0;$pdf->SetFillColor(...$part[2]);if($w>0)$pdf->Rect($x,246,$w,3,'F');$x+=$w;
        reportText($pdf,$part[0],22+$i*57,251,7,true);reportText($pdf,reportDuration($part[1]),22+$i*57,259,13,true);}

    if($s['includeRoute']){
        reportChapter($pdf,'02','Your route','Route included by request');
        $pdf->card(16,64,178,160.2,$sage);
        if(!empty($s['routeMap'])){$pdf->Image($s['routeMap'],16,64,178,160.2,'JPG');reportText($pdf,'OpenFreeMap / OpenMapTiles / (c) OpenStreetMap contributors',16,227,8);}
        else{reportOutline($pdf,$s['route'],16,64,178,160.2);reportText($pdf,count($s['route'])>=2?'Map unavailable - observed route outline retained.':'Not enough location observations to draw a route.',16,229,10,true);}
        reportTile($pdf,'Retained observations',(string)count($s['route']).' points',16,242,86,27,$sage,18);
        reportTile($pdf,'Orientation','North up',108,242,86,27,$sky,18);
        $pdf->note('Observed positions, without road matching. Missing observations may leave incomplete coverage.',273);
    }

    reportChapter($pdf,sprintf('%02d',$chapter),'The rhythm','One timeline. Speed on the left, elevation on the right.');
    $pdf->card(16,64,178,132,$sage);
    $speedRange=reportTrace($pdf,$s['samples'],'speedKmh',32,85,146,92,$red,true);
    $heightRange=reportTrace($pdf,$s['samples'],'altitudeM',32,85,146,92,$blue,false);
    for($i=0;$i<4;$i++){
        $y=82+92*$i/3;
        if($speedRange['available'])reportText($pdf,reportValue($speedRange['high']-($speedRange['high']-$speedRange['low'])*$i/3),20,$y,7,false,$red);
        if($heightRange['available'])reportText($pdf,reportValue($heightRange['high']-($heightRange['high']-$heightRange['low'])*$i/3),180,$y,7,false,$blue);
    }
    reportText($pdf,'Speed / km/h',22,185,8,true,$red);reportText($pdf,'Elevation / metres',119,185,8,true,$blue);
    $pdf->note(!$s['samples']?'No GPS observations were available. No journey has been inferred.':
        'Red: speed. Blue: GPS altitude (solid), map elevation estimate (dashed). Breaks mark missing observations or source changes.',202);
    reportText($pdf,'Average speed  '.reportValue($summary['averageKmh'],' km/h'),16,216,10,true);
    if($hasMapElevation){reportText($pdf,'Open-Meteo / EU Copernicus GLO-90 (CC BY 4.0), 90 m DEM',16,225,7.5,false,$blue);$pdf->Link(16,225,178,7,'https://open-meteo.com/en/docs/elevation-api');}
    reportText($pdf,'TIME AT EACH SPEED',16,235,8,true);
    foreach(['0-30','30-60','60-90','90-130','130+'] as $i=>$label){
        $x=16+$i*36.5;$ratio=$summary['observedMs']?$s['speedBandsMs'][$i]/$summary['observedMs']:0;
        $pdf->card($x,246,32,29,$i%2?$rose:$sage);reportText($pdf,$label.' km/h',$x+3,248,8,true);
        reportFit($pdf,reportDuration($s['speedBandsMs'][$i]),$x+3,258,26,11);$pdf->SetFillColor(...$red);if($ratio>0)$pdf->Rect($x+3,270,26*$ratio,1.2,'F');
    }

    reportChapter($pdf,sprintf('%02d',$chapter+1),'The atmosphere','Music, visual worlds and the colours you stayed with.');
    $experience=$s['experience']??null;$heard=$experience['listeningMs']??0;$observed=$experience['observedMs']??0;
    $tracks=$experience['tracks']??[];$genres=$experience['genres']??[];$visuals=$experience['visuals']??[];$palettes=$experience['palettes']??[];
    $pdf->card(16,64,114,56,$ink);reportText($pdf,'LISTENING TIME',22,69,9,true,[196,217,211]);
    reportFit($pdf,$experience?reportDuration($heard):'Not observed',22,89,75,30,[251,245,221]);
    $pdf->SetDrawColor(111,162,156);$pdf->SetLineWidth(.55);for($r=4;$r<=15;$r+=3)$pdf->arc(109,93,$r,0,2*M_PI);
    reportTile($pdf,'Tracks / scores',$experience?(string)count($tracks).(($experience['unlistedTrackMs']??0)>0?'+':''):'--',136,64,58,56,$rose,36);
    $winners=[['TOP GENRE',$genres[0]??null,$heard,$rose],['TOP VISUAL',$visuals[0]??null,$observed,$sky],['PALETTE',$palettes[0]??null,$observed,$sage]];
    foreach($winners as $i=>$winner){
        [$label,$row,$total,$fill]=$winner;$x=16+$i*61;$pdf->card($x,126,56,65,$fill);reportText($pdf,$label,$x+5,130,8,true);
        reportFit($pdf,$row['label']??'Not observed',$x+5,145,46,18);
        if($row){
            reportText($pdf,reportDuration($row['ms']),$x+5,157,11,true);
            reportText($pdf,reportValue($total?$row['ms']/$total*100:0,$i===0?'% of listening time':'% of observed time'),$x+5,178,7);
            if($i===2){foreach(($row['colors']??[]) as $n=>$hex){$rgb=array_map('hexdec',str_split(substr($hex,1),2));$pdf->SetFillColor(...$rgb);$pdf->Rect($x+5+$n*15.3,169,14,4,'F');}}
            else{$pdf->SetDrawColor(...($i===0?$red:$blue));$pdf->SetLineWidth(1);for($n=0;$n<3;$n++)$pdf->arc($x+43,168,3+$n*2,-M_PI*.8,M_PI*.2);}
        }
    }
    $pdf->card(16,197,178,72,$sage);reportText($pdf,'MOST HEARD / THIS SESSION',22,201,9,true);
    foreach(array_slice($tracks,0,5) as $i=>$track){
        $y=213+$i*10.5;reportText($pdf,sprintf('%02d',$i+1),22,$y,9,true,$red);
        reportFit($pdf,$track['label'],32,$y-1,117,11);reportFit($pdf,$track['detail']??'',32,$y+3.5,117,8,[83,101,104]);
        reportFit($pdf,reportDuration($track['ms']),159,$y,29,10);
    }
    if(!$tracks)reportText($pdf,$experience?'No confirmed music playback was observed.':'Listening history was not recorded by this session.',22,223,10);
    $pdf->note('Most used by active, visible time; muted, paused and stalled audio is excluded. Rankings retain up to 64 tracks. No history is inferred for older sessions.',273);

    reportChapter($pdf,sprintf('%02d',$chapter+2),'Session details','Direction, observation quality and the system behind the journey.');
    reportTile($pdf,'Moving / stopped',reportDuration($summary['movingMs']).' / '.reportDuration($summary['stoppedMs']),16,64,62,28,$sage,12);
    reportTile($pdf,'Unobserved time',reportDuration($summary['unknownMs']),83,64,47,28,$sky,16);
    reportTile($pdf,'GPS elevation gain / loss',$summary['elevationObservedMs']?reportValue($summary['elevationGainM'],' m').' / '.reportValue($summary['elevationLossM'],' m'):'Unavailable',135,64,59,28,$rose,15);
    $pdf->card(16,98,96,107,$sage);reportText($pdf,'HEADING / TIME MOVING',22,102,9,true);reportHeadingWaves($pdf,$s['headingMs'],64,154);
    $pdf->card(118,98,76,107,$sky);reportText($pdf,'DIRECTIONAL TIME',124,102,9,true);
    foreach(['N','NE','E','SE','S','SW','W','NW'] as $i=>$label){reportText($pdf,$label,124,116+$i*10,9,true);reportText($pdf,reportDuration($s['headingMs'][$i]),151,116+$i*10,11);}
    $pdf->card(16,212,178,45,$sage);reportText($pdf,'SYSTEM SNAPSHOT',22,215,8,true);$system=$s['system'];
    $technical=[['Audio context',$system['audio']],['Frame average / p95',reportValue($system['averageFps'],' FPS').' / '.reportValue($system['p95FrameMs'],' ms')],['Observed long tasks',reportValue($system['longTaskCount'])],['Observed download / upload',reportValue($system['downloadBytes']===null?null:$system['downloadBytes']/1048576,' MB',1).' / '.reportValue($system['uploadBytes']===null?null:$system['uploadBytes']/1048576,' MB',1)],['Engine simulated RPM / gear',reportValue($system['engineRpm']).' / '.reportValue($system['engineGear'])],['Engine simulated load',reportValue($system['engineLoad']===null?null:$system['engineLoad']*100,'%')]];
    foreach($technical as $i=>$row){$x=$i%2?108:22;$y=225+floor($i/2)*10;reportText($pdf,$row[0],$x,$y,6.5);reportFit($pdf,$row[1],$x,$y+4,79,9);}
    $pdf->SetXY(16,263);$pdf->SetFont('SpaceGrotesk','',7.5);$pdf->SetTextColor(83,101,104);$pdf->MultiCell(178,4,'Technical appendix. GPS distance uses observed speed; gaps remain unknown. Elevation gain/loss requires accuracy evidence. Network totals exclude opaque/cache traffic. Engine figures are simulation, not vehicle telemetry.');
    reportText($pdf,'v'.$s['app']['version'].' / BUILD '.$s['app']['build'].' / '.$s['app']['commit'],16,274,8,true);
    return $pdf->Output('S');
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }
