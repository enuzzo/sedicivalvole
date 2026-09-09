<?php
// sedicivalvole.radar-photo.v1 — bounded, credited metadata only; no image proxy.
declare(strict_types=1);
const RADAR_PHOTO_ORIGIN = 'https://sedicivalvole.app';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function photo_reply(array $value, int $status = 200): never { http_response_code($status); echo json_encode($value, JSON_UNESCAPED_SLASHES); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' || ($_SERVER['HTTP_X_AIR_ATLAS'] ?? '') !== '1') photo_reply(['error' => 'invalid_request'], 400);
if (($_SERVER['HTTP_ORIGIN'] ?? RADAR_PHOTO_ORIGIN) !== RADAR_PHOTO_ORIGIN) photo_reply(['error' => 'invalid_origin'], 403);
$hex = strtolower((string)($_GET['hex'] ?? '')); $reg = (string)($_GET['reg'] ?? ''); $type = (string)($_GET['type'] ?? '');
if (!preg_match('/^[0-9a-f]{6}$/D', $hex) || !preg_match('/^[A-Z0-9-]{0,16}$/D', $reg) || !preg_match('/^[A-Z0-9]{0,8}$/D', $type) || array_diff(array_keys($_GET), ['hex', 'reg', 'type'])) photo_reply(['error' => 'invalid_aircraft'], 400);
if (!function_exists('curl_init')) photo_reply(['error' => 'unavailable'], 503);
$directory = sys_get_temp_dir() . '/sedicivalvole-photo-' . substr(hash('sha256', __FILE__), 0, 16);
if (!is_dir($directory) && !mkdir($directory, 0700, true)) photo_reply(['error' => 'unavailable'], 503);
$handle = fopen($directory . '/cache.json', 'c+');
if (!$handle || !flock($handle, LOCK_EX | LOCK_NB)) { header('Retry-After: 30'); photo_reply(['error' => 'busy'], 503); }
chmod($directory . '/cache.json', 0600);
$state = json_decode(stream_get_contents($handle, 1048576) ?: '{}', true) ?: []; $now = time(); $key = $hex . ':' . $reg . ':' . $type;
$cached = $state['cache'][$key] ?? null;
if ($cached && $cached['expires'] > $now) photo_reply($cached['data']);
if ($now < ($state['retryAt'] ?? 0)) { header('Retry-After: ' . ($state['retryAt'] - $now)); photo_reply(['error' => 'retrying'], 503); }
$url = 'https://api.planespotters.net/pub/photos/hex/' . $hex . '?' . http_build_query(['reg' => $reg, 'icaoType' => $type]);
$curl = curl_init($url); $body = ''; $retryAfter = 0;
curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 5, CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
    CURLOPT_USERAGENT => 'sedicivalvole (+https://github.com/enuzzo/sedicivalvole)',
    CURLOPT_HEADERFUNCTION => static function ($curl, string $header) use (&$retryAfter): int {
        if (stripos($header, 'Retry-After:') === 0) { $value = trim(substr($header, 12)); $retryAfter = ctype_digit($value) ? (int)$value : max(0, (strtotime($value) ?: 0) - time()); }
        return strlen($header);
    },
    CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$body): int { if (strlen($body) + strlen($chunk) > 32768) return 0; $body .= $chunk; return strlen($chunk); }]);
$ok = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_HTTP_CODE); curl_close($curl);
$result = ['photos' => []];
if ($ok && $status === 200) {
    $payload = json_decode($body, true, 16);
    foreach (array_slice(is_array($payload['photos'] ?? null) ? $payload['photos'] : [], 0, 5) as $photo) {
        $src = $photo['thumbnail']['src'] ?? ''; $link = $photo['link'] ?? ''; $author = $photo['photographer'] ?? '';
        if (!is_string($src) || !is_string($link) || !is_string($author) || !$author || strlen($author) > 240) continue;
        if (!preg_match('~^https://t\.plnspttrs\.net/[^\s]+$~D', $src) || !preg_match('~^https://www\.planespotters\.net/photo/[^\s]+$~D', $link)) continue;
        $result['photos'][] = ['thumbnail' => ['src' => $src], 'link' => $link, 'photographer' => $author]; break;
    }
    $state['cache'][$key] = ['expires' => $now + 600, 'data' => $result];
    $state['retryAt'] = $now + 2;
} else { $state['retryAt'] = $now + max(60, $retryAfter); $result = ['error' => 'unavailable']; }
while (count($state['cache'] ?? []) > 64) array_shift($state['cache']);
rewind($handle); ftruncate($handle, 0); fwrite($handle, json_encode($state)); fflush($handle); flock($handle, LOCK_UN); fclose($handle);
if (isset($result['error'])) { header('Retry-After: ' . max(60, $retryAfter)); photo_reply($result, 503); }
photo_reply($result);
