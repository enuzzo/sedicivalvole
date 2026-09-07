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
    $s = reportKeys($input, ['schema', 'createdAt', 'app', 'source', 'includeRoute', 'summary', 'speedBandsMs', 'headingMs', 'samples', 'system'], ['route']);
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
    $systemKeys = ['audio', 'averageFps', 'p95FrameMs', 'longTaskCount', 'downloadBytes', 'uploadBytes', 'engineRpm', 'engineGear', 'engineLoad'];
    $system = reportKeys($s['system'], $systemKeys);
    if (!in_array($system['audio'], ['running', 'suspended', 'interrupted', 'closed', 'unavailable'], true)) throw new SessionReportProblem('system_rejected');
    $health = ['audio' => $system['audio']];
    foreach (['averageFps' => 1000, 'p95FrameMs' => 86400000, 'longTaskCount' => 10000000, 'downloadBytes' => 1e12, 'uploadBytes' => 1e12, 'engineRpm' => 30000, 'engineGear' => 12, 'engineLoad' => 1] as $key => $maximum) {
        $health[$key] = reportNumber($system[$key], 0, $maximum, true);
    }
    foreach (['longTaskCount', 'engineGear'] as $key) if ($health[$key] !== null && !is_int($health[$key])) throw new SessionReportProblem('system_rejected');
    return ['schema' => $s['schema'], 'createdAt' => $s['createdAt'], 'app' => $app, 'source' => 'GPS', 'includeRoute' => $s['includeRoute'], 'summary' => $out, 'speedBandsMs' => $vectors['speedBandsMs'], 'headingMs' => $vectors['headingMs'], 'samples' => $samples, 'route' => $points, 'system' => $health];
}

final class TravelReportPdf extends FPDF
{
    private $reportDate;
    public function __construct(int $createdAt) { parent::__construct('P', 'mm', 'A4'); $this->reportDate = $createdAt; }
    protected function _putinfo() { $zone = date_default_timezone_get(); date_default_timezone_set('UTC'); $this->CreationDate = $this->reportDate; parent::_putinfo(); date_default_timezone_set($zone); }
    public function Footer() {
        $this->SetY(-14); $this->SetDrawColor(206, 207, 200); $this->Line(16, $this->GetY(), 194, $this->GetY());
        $this->SetFont('Helvetica', '', 8); $this->SetTextColor(90, 96, 92);
        $this->Cell(145, 9, 'sedicivalvole / Travel Report / Experimental'); $this->Cell(33, 9, (string) $this->PageNo(), 0, 0, 'R');
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

function reportBuildPdf(array $s): string
{
    $pdf = new TravelReportPdf(strtotime($s['createdAt']));
    $pdf->SetMargins(16, 16, 16); $pdf->SetAutoPageBreak(true, 22); $pdf->SetCompression(true);
    $pdf->SetTitle('sedicivalvole Travel Report'); $pdf->SetAuthor('enuzzo'); $pdf->SetCreator('sedicivalvole report v1 / FPDF 1.9');
    $pdf->AddPage(); $pdf->SetFillColor(28, 34, 30); $pdf->Rect(0, 0, 210, 52, 'F');
    $pdf->Image(__DIR__ . '/report-mark.png', 15, 10, 31);
    $pdf->SetTextColor(249, 248, 240); $pdf->SetXY(52, 14); $pdf->SetFont('Helvetica', 'B', 23); $pdf->Cell(140, 10, 'Travel Report');
    $pdf->SetXY(53, 27); $pdf->SetFont('Helvetica', '', 10); $pdf->Cell(140, 6, 'sedicivalvole / ' . substr($s['createdAt'], 0, 10) . ' / GPS session');
    $pdf->SetXY(53, 35); $pdf->SetFont('Helvetica', '', 8); $pdf->Cell(140, 5, 'Build ' . $s['app']['build'] . ' / ' . $s['app']['commit'] . ' / v' . $s['app']['version']);
    $summary = $s['summary']; $coverage = $summary['elapsedMs'] ? $summary['observedMs'] / $summary['elapsedMs'] * 100 : 0;
    $headlines = [['GPS distance', $summary['observedMs'] ? reportValue($summary['distanceM'] / 1000, ' km', 1) : 'Unavailable'], ['Session duration', reportDuration($summary['elapsedMs'])], ['Moving average', reportValue($summary['movingAverageKmh'], ' km/h')], ['GPS coverage', reportValue($coverage, '%')]];
    foreach ($headlines as $i => $row) {
        $x = 16 + ($i % 2) * 91; $y = 61 + floor($i / 2) * 27;
        $pdf->SetFillColor(241, 242, 235); $pdf->Rect($x, $y, 87, 23, 'F');
        $pdf->SetTextColor(72, 81, 73); $pdf->SetFont('Helvetica', '', 9); $pdf->SetXY($x + 4, $y + 3); $pdf->Cell(79, 5, $row[0]);
        $pdf->SetTextColor(26, 36, 29); $pdf->SetFont('Helvetica', 'B', 18); $pdf->SetXY($x + 4, $y + 10); $pdf->Cell(79, 10, $row[1]);
    }
    $pdf->section('The observed journey', 120);
    reportTrace($pdf, $s['samples'], 'speedKmh', 16, 139, 178, 48, [198, 47, 38], true);
    reportTrace($pdf, $s['samples'], 'altitudeM', 16, 139, 178, 48, [46, 102, 139], false);
    $hasMapElevation = (bool) array_filter($s['samples'], function ($sample) { return $sample['altitudeM'] === null && ($sample['groundElevationM'] ?? null) !== null; });
    $pdf->note($s['samples'] ? ($hasMapElevation ? 'Separate speed and elevation scales. Blue: GPS altitude (solid), map elevation estimate (dashed). Breaks mark missing observations or source changes.' : 'Speed and GPS altitude use separate scales. Empty breaks are unobserved intervals.') : 'No GPS observations were available. No journey has been inferred.', 192);
    if ($hasMapElevation) {
        $pdf->SetXY(16, 203); $pdf->SetFont('Helvetica', '', 8); $pdf->SetTextColor(46, 102, 139);
        $pdf->Cell(178, 4.5, 'Map elevation estimate: Open-Meteo / EU Copernicus GLO-90 (CC BY 4.0)', 0, 0, 'L', false, 'https://open-meteo.com/en/docs/elevation-api');
    }
    $bandsY = $hasMapElevation ? 224 : 217;
    $pdf->section('Time at each speed', $bandsY - 12);
    foreach (['0-30', '30-60', '60-90', '90-130', '130+'] as $i => $label) {
        $y = $bandsY + $i * 9; $pdf->SetXY(16, $y); $pdf->SetFont('Helvetica', '', 9); $pdf->SetTextColor(44, 53, 45); $pdf->Cell(30, 7, $label . ' km/h');
        $pdf->SetFillColor(231, 234, 225); $pdf->Rect(49, $y + 2, 105, 3.5, 'F');
        $pdf->SetFillColor(106, 140, 105); $pdf->Rect(49, $y + 2, $summary['observedMs'] ? 105 * $s['speedBandsMs'][$i] / $summary['observedMs'] : 0, 3.5, 'F');
        $pdf->SetXY(160, $y); $pdf->Cell(34, 7, reportDuration($s['speedBandsMs'][$i]), 0, 0, 'R');
    }
    if ($s['includeRoute']) {
        $pdf->AddPage(); $pdf->section('Route included by request', 16);
        $pdf->note('Observed route outline only. No map tiles, inferred road matching or turn-by-turn guidance. This PDF includes the selected route.', 29);
        $route = $s['route'];
        if (count($route) >= 2) {
            $latitudes = array_column($route, 'latitude'); $latitude = array_sum($latitudes) / count($latitudes); $points = []; $last = null;
            foreach ($route as $point) {
                $lon = $point['longitude'];
                if ($last !== null) { while ($lon - $last > 180) $lon -= 360; while ($lon - $last < -180) $lon += 360; }
                $points[] = [$lon * max(0.087, cos(deg2rad($latitude))), $point['latitude']]; $last = $lon;
            }
            $xs = array_column($points, 0); $ys = array_column($points, 1); $xmin = min($xs); $xmax = max($xs); $ymin = min($ys); $ymax = max($ys);
            $scale = min(164 / max(0.00001, $xmax - $xmin), 165 / max(0.00001, $ymax - $ymin));
            $left = 105 - ($xmax - $xmin) * $scale / 2; $top = 139 - ($ymax - $ymin) * $scale / 2;
            $pdf->SetDrawColor(194, 53, 38); $pdf->SetLineWidth(0.8); $previous = null;
            foreach ($points as $point) { $next = [$left + ($point[0] - $xmin) * $scale, $top + ($ymax - $point[1]) * $scale]; if ($previous !== null) $pdf->Line($previous[0], $previous[1], $next[0], $next[1]); $previous = $next; }
            $pdf->note(count($route) . ' retained route points. The outline is reduced for export; missing observations are not a complete route record.', 234);
        } else $pdf->note('Not enough location observations to draw a route.', 65);
    }
    $pdf->AddPage(); $pdf->section('Session details', 16);
    $rows = [['Moving / stopped', reportDuration($summary['movingMs']) . ' / ' . reportDuration($summary['stoppedMs'])], ['Unobserved time', reportDuration($summary['unknownMs'])], ['Stops', (string) $summary['stops']], ['Average / peak speed', reportValue($summary['averageKmh'], ' km/h') . ' / ' . reportValue($summary['peakKmh'], ' km/h')], ['GPS elevation gain / loss', $summary['elevationObservedMs'] ? reportValue($summary['elevationGainM'], ' m') . ' / ' . reportValue($summary['elevationLossM'], ' m') : 'Unavailable']];
    $system = $s['system'];
    $rows = array_merge($rows, [['Audio context', $system['audio']], ['Frame average / p95', reportValue($system['averageFps'], ' FPS') . ' / ' . reportValue($system['p95FrameMs'], ' ms')], ['Observed long tasks', reportValue($system['longTaskCount'])], ['Observed download / upload', reportValue($system['downloadBytes'] === null ? null : $system['downloadBytes'] / 1048576, ' MB', 1) . ' / ' . reportValue($system['uploadBytes'] === null ? null : $system['uploadBytes'] / 1048576, ' MB', 1)], ['Engine simulated RPM / gear', reportValue($system['engineRpm']) . ' / ' . reportValue($system['engineGear'])], ['Engine simulated load', reportValue($system['engineLoad'] === null ? null : $system['engineLoad'] * 100, '%')]]);
    foreach ($rows as $i => $row) { $y = 30 + $i * 10; $pdf->SetDrawColor(222, 225, 217); $pdf->Line(16, $y + 9, 194, $y + 9); $pdf->SetXY(16, $y); $pdf->SetFont('Helvetica', '', 10); $pdf->SetTextColor(56, 65, 57); $pdf->Cell(95, 9, $row[0]); $pdf->SetFont('Helvetica', 'B', 10); $pdf->Cell(83, 9, $row[1], 0, 0, 'R'); }
    $pdf->section('Heading / time moving', 151);
    $maximum = max(1, max($s['headingMs']));
    foreach (['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as $i => $label) { $y = 164 + $i * 8; $pdf->SetXY(16, $y); $pdf->SetFont('Helvetica', '', 9); $pdf->Cell(17, 6, $label); $pdf->SetFillColor(111, 142, 110); $pdf->Rect(35, $y + 1.5, 114 * $s['headingMs'][$i] / $maximum, 3, 'F'); $pdf->SetXY(157, $y); $pdf->Cell(37, 6, reportDuration($s['headingMs'][$i]), 0, 0, 'R'); }
    $pdf->note('Technical appendix. GPS distance is integrated from observed speed; gaps remain unknown. GPS elevation gain/loss uses accuracy and hysteresis. Network totals exclude opaque/cache traffic. Engine figures are simulation, not vehicle telemetry. ' . ($s['includeRoute'] ? 'A route is included by request.' : 'No route or precise location is included.') . ($hasMapElevation ? ' Map elevation estimates terrain from a 90 m DEM near a rounded (~1 km) lookup cell; it does not enter GPS gain/loss.' : ''), 235);
    return $pdf->Output('S');
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }
