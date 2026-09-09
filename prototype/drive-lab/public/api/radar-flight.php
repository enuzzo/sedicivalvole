<?php
// sedicivalvole.radar-flight.v1 — optional AirLabs schedule adapter.
// Original code: PolyForm-Noncommercial-1.0.0. Never reads a .env file.
declare(strict_types=1);
const RADAR_EXPECTED_ORIGIN = 'https://sedicivalvole.app';
function radar_flight_schedule(array $data, string $hex): ?array {
    if (strtolower((string)($data['hex'] ?? '')) !== $hex) return null;
    $result = ['source' => 'AirLabs', 'hex' => $hex];
    foreach (['dep' => 'departure', 'arr' => 'arrival'] as $prefix => $label) {
        $code = (string)($data[$prefix . '_iata'] ?? '');
        if (!preg_match('/^[A-Z0-9]{3,4}$/D', $code)) return null;
        $result[$label . 'Airport'] = $code;
        $time = $data[$prefix . '_estimated'] ?? $data[$prefix . '_time'] ?? null;
        $kind = !empty($data[$prefix . '_estimated']) ? 'estimated' : 'scheduled';
        if (is_string($time) && preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/D', $time)) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d H:i', $time, new DateTimeZone('UTC'));
            // Airport-local values are displayed as supplied, not converted into UTC.
            if ($date && $date->format('Y-m-d H:i') === $time && abs($date->getTimestamp() - time()) < 172800) {
                $result[$label] = ['time' => $time, 'kind' => $kind, 'zone' => 'airport local'];
                continue;
            }
        }
        $result[$label] = null;
    }
    return $result;
}
if (defined('RADAR_FLIGHT_LIBRARY_ONLY')) return;
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function radar_reply(array $value, int $status = 200): never {
    http_response_code($status); echo json_encode($value, JSON_UNESCAPED_SLASHES); exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || ($_SERVER['HTTP_X_AIR_ATLAS'] ?? '') !== '1') radar_reply(['status' => 'invalid_request'], 400);
$origin = $_SERVER['HTTP_ORIGIN'] ?? RADAR_EXPECTED_ORIGIN;
if ($origin !== RADAR_EXPECTED_ORIGIN) radar_reply(['status' => 'invalid_origin'], 403);
$hex = strtolower((string)($_GET['hex'] ?? ''));
if (!preg_match('/^[0-9a-f]{6}$/D', $hex) || count($_GET) !== 1) radar_reply(['status' => 'invalid_aircraft'], 400);
$key = getenv('SEDICIVALVOLE_AIRLABS_API_KEY');
if (!$key) radar_reply(['status' => 'not_configured', 'schedule' => null]);
if (!function_exists('curl_init')) radar_reply(['status' => 'unavailable', 'schedule' => null], 503);
$directory = sys_get_temp_dir() . '/sedicivalvole-radar-' . substr(hash('sha256', __FILE__), 0, 16);
if (!is_dir($directory) && !mkdir($directory, 0700, true)) radar_reply(['status' => 'unavailable'], 503);
$handle = fopen($directory . '/state.json', 'c+');
if (!$handle || !flock($handle, LOCK_EX | LOCK_NB)) { header('Retry-After: 30'); radar_reply(['status' => 'busy'], 503); }
chmod($directory . '/state.json', 0600);
$state = json_decode(stream_get_contents($handle, 262144) ?: '{}', true) ?: [];
$now = time(); $month = gmdate('Y-m'); $hour = gmdate('Y-m-d-H');
if (($state['month'] ?? '') !== $month) $state = ['month' => $month, 'calls' => 0, 'cache' => []];
if (($state['hour'] ?? '') !== $hour) { $state['hour'] = $hour; $state['hourCalls'] = 0; }
$cached = $state['cache'][$hex] ?? null;
if ($cached && $cached['expires'] > $now) { flock($handle, LOCK_UN); fclose($handle); radar_reply($cached['data']); }
// Hard local ceilings bound shared public use; they are not a provider-plan guarantee.
if (($state['calls'] ?? 0) > 498 || ($state['hourCalls'] ?? 0) > 18) { header('Retry-After: 3600'); radar_reply(['status' => 'quota_paused'], 429); }
$state['calls'] += 2; $state['hourCalls'] += 2;
function radar_airlabs(string $path, array $query, string $key): array {
    $query['api_key'] = $key;
    $curl = curl_init('https://airlabs.co/api/v9/' . $path . '?' . http_build_query($query));
    $body = '';
    curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 6,
        CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_USERAGENT => 'sedicivalvole (+https://github.com/enuzzo/sedicivalvole)',
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > 65536) return 0;
            $body .= $chunk; return strlen($chunk);
        }]);
    $ok = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_HTTP_CODE); unset($curl);
    if (!$ok || $status !== 200) throw new RuntimeException('Source unavailable');
    $payload = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
    if (isset($payload['error']) || !is_array($payload['response'] ?? null)) throw new RuntimeException('Source unavailable');
    return $payload['response'];
}
try {
    $flights = radar_airlabs('flights', ['hex' => $hex], $key); $flight = null;
    foreach (array_slice($flights, 0, 8) as $candidate) if (strtolower((string)($candidate['hex'] ?? '')) === $hex) { $flight = $candidate; break; }
    $number = (string)($flight['flight_icao'] ?? '');
    if (!preg_match('/^[A-Z0-9]{3,12}$/D', $number)) $schedule = null;
    else $schedule = radar_flight_schedule(radar_airlabs('flight', ['flight_icao' => $number], $key), $hex);
    $result = ['status' => $schedule ? 'ready' : 'not_available', 'schedule' => $schedule];
    $ttl = 300;
} catch (Throwable $error) { $result = ['status' => 'unavailable', 'schedule' => null]; $ttl = 60; }
$state['cache'][$hex] = ['expires' => $now + $ttl, 'data' => $result];
while (count($state['cache']) > 64) array_shift($state['cache']);
rewind($handle); ftruncate($handle, 0); fwrite($handle, json_encode($state)); fflush($handle); flock($handle, LOCK_UN); fclose($handle);
radar_reply($result);
