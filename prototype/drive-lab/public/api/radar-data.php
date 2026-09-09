<?php
// sedicivalvole.radar-data.v1 — fixed ADSB.lol destination, bounded shared cache.
declare(strict_types=1);
const RADAR_DATA_ORIGIN = 'https://sedicivalvole.app';
function radar_data_query(array $query): ?array {
    if (array_diff(array_keys($query), ['kind', 'lat', 'lon', 'callsign'])) return null;
    foreach ($query as $value) if (!is_string($value)) return null;
    $kind = $query['kind'] ?? '';
    if (!in_array($kind, ['nearby', 'route'], true)) return null;
    foreach (['lat' => 90, 'lon' => 180] as $key => $limit) {
        if (!preg_match('/^-?\d{1,3}(?:\.\d{1,3})?$/D', $query[$key] ?? '') || abs((float)$query[$key]) > $limit) return null;
    }
    $precision = $kind === 'nearby' ? 2 : 3;
    $lat = number_format((float)$query['lat'], $precision, '.', '');
    $lon = number_format((float)$query['lon'], $precision, '.', '');
    if ($kind === 'nearby') {
        if (isset($query['callsign'])) return null;
        $path = '/v2/point/' . $lat . '/' . $lon . '/27';
    } else {
        if (!preg_match('/^[A-Z0-9]{2,12}$/D', $query['callsign'] ?? '')) return null;
        $path = '/api/0/route/' . $query['callsign'] . '/' . $lat . '/' . $lon;
    }
    return ['kind' => $kind, 'path' => $path, 'key' => hash('sha256', $path)];
}
function radar_data_filter(array $payload, string $kind): ?array {
    if ($kind === 'nearby') {
        if (!is_numeric($payload['now'] ?? null) || !is_array($payload['ac'] ?? null)) return null;
        $fields = array_flip(['hex', 'flight', 'r', 't', 'category', 'lat', 'lon', 'seen_pos', 'track', 'alt_baro', 'gs', 'baro_rate', 'alt_geom', 'geom_rate', 'ias', 'tas', 'mach', 'mag_heading', 'true_heading', 'roll', 'nav_altitude_mcp', 'nav_qnh', 'wd', 'ws', 'oat', 'squawk', 'type']);
        $rows = [];
        foreach (array_slice($payload['ac'], 0, 512) as $row) {
            if (!is_array($row)) continue;
            $clean = array_intersect_key($row, $fields);
            foreach ($clean as $key => $value) if (!is_scalar($value) || (is_string($value) && strlen($value) > 40)) unset($clean[$key]);
            $rows[] = $clean;
        }
        return ['now' => (float)$payload['now'], 'ac' => $rows];
    }
    if (!is_string($payload['callsign'] ?? null)) return null;
    $airports = [];
    foreach (array_slice(is_array($payload['_airports'] ?? null) ? $payload['_airports'] : [], 0, 8) as $airport) {
        if (!is_array($airport)) continue;
        $clean = array_intersect_key($airport, array_flip(['iata', 'icao', 'name', 'location', 'lat', 'lon', 'countryiso2']));
        foreach ($clean as $key => $value) if (!is_scalar($value) || (is_string($value) && strlen($value) > 240)) unset($clean[$key]);
        if (isset($clean['countryiso2']) && (!is_string($clean['countryiso2']) || !preg_match('/^[A-Z]{2}$/D', $clean['countryiso2']))) unset($clean['countryiso2']);
        $airports[] = $clean;
    }
    return ['callsign' => substr($payload['callsign'], 0, 12), 'plausible' => ($payload['plausible'] ?? false) === true, '_airports' => $airports];
}
if (defined('RADAR_DATA_LIBRARY_ONLY')) return;
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function radar_data_reply(array $value, int $status = 200): never { http_response_code($status); echo json_encode($value, JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || ($_SERVER['HTTP_X_AIR_ATLAS'] ?? '') !== '1') radar_data_reply(['error' => 'invalid_request'], 400);
if (($_SERVER['HTTP_ORIGIN'] ?? RADAR_DATA_ORIGIN) !== RADAR_DATA_ORIGIN) radar_data_reply(['error' => 'invalid_origin'], 403);
$query = radar_data_query($_GET);
if (!$query) radar_data_reply(['error' => 'invalid_query'], 400);
if (!function_exists('curl_init')) radar_data_reply(['error' => 'unavailable'], 503);
$directory = sys_get_temp_dir() . '/sedicivalvole-radar-' . substr(hash('sha256', __FILE__), 0, 16);
if (!is_dir($directory) && !mkdir($directory, 0700, true)) radar_data_reply(['error' => 'unavailable'], 503);
$handle = fopen($directory . '/cache.json', 'c+');
if (!$handle || !flock($handle, LOCK_EX | LOCK_NB)) { header('Retry-After: 2'); radar_data_reply(['error' => 'busy'], 503); }
chmod($directory . '/cache.json', 0600);
$state = json_decode(stream_get_contents($handle, 8388608) ?: '{}', true) ?: [];
$now = time(); $cached = $state['cache'][$query['key']] ?? null;
if ($cached && $cached['expires'] > $now) radar_data_reply($cached['data']);
if ($now < ($state['retryAt'] ?? 0)) { header('Retry-After: ' . ($state['retryAt'] - $now)); radar_data_reply(['error' => 'retrying'], 503); }
$curl = curl_init('https://api.adsb.lol' . $query['path']); $body = ''; $retryAfter = 0;
curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT => 'sedicivalvole (+https://github.com/enuzzo/sedicivalvole)',
    CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$retryAfter): int {
        if (stripos($header, 'Retry-After:') === 0) { $value = trim(substr($header, 12)); $retryAfter = ctype_digit($value) ? min(86400, (int)$value) : max(0, min(86400, (strtotime($value) ?: 0) - time())); }
        return strlen($header);
    },
    CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$body): int { if (strlen($body) + strlen($chunk) > 131072) return 0; $body .= $chunk; return strlen($chunk); }]);
$ok = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_HTTP_CODE); unset($curl);
$payload = $ok && $status === 200 ? json_decode($body, true, 20) : null;
$result = is_array($payload) ? radar_data_filter($payload, $query['kind']) : null;
if ($result !== null) {
    $state['cache'][$query['key']] = ['expires' => $now + ($query['kind'] === 'nearby' ? 8 : 300), 'data' => $result];
} else { $state['retryAt'] = $now + max(15, $retryAfter); }
foreach ($state['cache'] ?? [] as $key => $entry) if ($entry['expires'] <= $now) unset($state['cache'][$key]);
while (count($state['cache'] ?? []) > 32) array_shift($state['cache']);
rewind($handle); ftruncate($handle, 0); fwrite($handle, json_encode($state)); fflush($handle); flock($handle, LOCK_UN); fclose($handle);
if ($result === null) { header('Retry-After: ' . max(15, $retryAfter)); radar_data_reply(['error' => 'unavailable'], 503); }
radar_data_reply($result);
