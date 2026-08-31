<?php
declare(strict_types=1);

const JAMENDO_AUDIO_CONFIG_FILE = __DIR__ . '/jamendo.local.php';

function soundtrackAudioError(int $status, string $code): never
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode(['ok' => false, 'status' => $code], JSON_UNESCAPED_SLASHES);
    exit;
}

function trustedJamendoAudioUrl(string $value): ?string
{
    $parts = parse_url($value);
    $host = strtolower((string)($parts['host'] ?? ''));
    if (($parts['scheme'] ?? '') !== 'https'
        || ($host !== 'jamendo.com' && !str_ends_with($host, '.jamendo.com'))) {
        return null;
    }
    return $value;
}

function licenceAllowsEffects(string $value): bool
{
    $path = strtolower((string)(parse_url($value, PHP_URL_PATH) ?? ''));
    if (!preg_match('#^/licenses/(by|by-sa|by-nc|by-nc-sa)/(\d+(?:\.\d+)?)/?$#D', $path)) {
        return false;
    }
    return true;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($method, ['GET', 'HEAD'], true)) {
    header('Allow: GET, HEAD');
    soundtrackAudioError(405, 'method_not_allowed');
}
$trackId = trim((string)($_GET['track'] ?? ''));
if (!preg_match('/^\d{1,20}$/D', $trackId)) {
    soundtrackAudioError(400, 'invalid_track');
}
if (!is_file(JAMENDO_AUDIO_CONFIG_FILE) || !function_exists('curl_init')) {
    soundtrackAudioError(503, 'configuration_unavailable');
}
$config = require JAMENDO_AUDIO_CONFIG_FILE;
$clientId = is_array($config) ? trim((string)($config['client_id'] ?? '')) : '';
if (!preg_match('/^[A-Za-z0-9_-]{4,128}$/D', $clientId)) {
    soundtrackAudioError(503, 'configuration_unavailable');
}

$track = null;
$metadataStatus = 0;
// Jamendo documents `id` as an integer array, but the live API can admit a
// track in the catalogue and then return an empty exact `id[]` lookup for that
// same identity. Try the documented form first, then its scalar compatibility
// form, always verifying the returned identity before the relay can stream it.
foreach ([['id[]' => $trackId], ['id' => $trackId]] as $identityFilter) {
    for ($attempt = 0; $attempt < 2; $attempt += 1) {
        $metadataQuery = http_build_query(array_merge([
            'client_id' => $clientId,
            'format' => 'json',
            'limit' => 1,
            'include' => 'musicinfo',
            'audioformat' => 'mp32',
        ], $identityFilter), '', '&', PHP_QUERY_RFC3986);
        $metadata = curl_init('https://api.jamendo.com/v3.0/tracks/?' . $metadataQuery);
        curl_setopt_array($metadata, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
            CURLOPT_USERAGENT => 'sedicivalvole/soundtrack-audio-relay',
        ]);
        $raw = curl_exec($metadata);
        $metadataStatus = (int)curl_getinfo($metadata, CURLINFO_RESPONSE_CODE);
        curl_close($metadata);
        $payload = is_string($raw) ? json_decode($raw, true) : null;
        $candidate = is_array($payload['results'][0] ?? null) ? $payload['results'][0] : null;
        if ($metadataStatus === 200
            && is_array($candidate)
            && trim((string)($candidate['id'] ?? '')) === $trackId) {
            $track = $candidate;
            break 2;
        }
        if ($attempt === 0) {
            usleep(120000);
        }
    }
}
if (!is_array($track)) {
    soundtrackAudioError(404, 'track_not_admitted');
}
$sourceUrl = trustedJamendoAudioUrl(trim((string)($track['audio'] ?? '')));
if ($sourceUrl === null || !licenceAllowsEffects(trim((string)($track['license_ccurl'] ?? '')))) {
    soundtrackAudioError(403, 'track_effects_not_admitted');
}

$range = trim((string)($_SERVER['HTTP_RANGE'] ?? ''));
if ($range !== '' && !preg_match('/^bytes=\d*-\d*$/Di', $range)) {
    soundtrackAudioError(416, 'invalid_range');
}

$stream = curl_init($sourceUrl);
$responseHeaders = [];
curl_setopt_array($stream, [
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 3,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
    CURLOPT_NOBODY => $method === 'HEAD',
    CURLOPT_HTTPHEADER => array_values(array_filter([
        'Accept: audio/mpeg,audio/*;q=0.9,*/*;q=0.1',
        $range === '' ? null : 'Range: ' . $range,
    ])),
    CURLOPT_HEADERFUNCTION => static function ($curl, string $line) use (&$responseHeaders): int {
        if (preg_match('#^HTTP/\S+\s+(\d{3})#i', $line, $match)) {
            $responseHeaders = ['status' => (int)$match[1]];
        } elseif (str_contains($line, ':')) {
            [$name, $value] = array_map('trim', explode(':', $line, 2));
            $responseHeaders[strtolower($name)] = $value;
        }
        return strlen($line);
    },
    CURLOPT_WRITEFUNCTION => static function ($curl, string $data) use (&$responseHeaders): int {
        if (!headers_sent()) {
            $status = ($responseHeaders['status'] ?? 200) === 206 ? 206 : 200;
            http_response_code($status);
            header('Content-Type: ' . (preg_match('#^audio/#i', (string)($responseHeaders['content-type'] ?? ''))
                ? $responseHeaders['content-type'] : 'audio/mpeg'));
            header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
            header('Accept-Ranges: bytes');
            header('Access-Control-Allow-Origin: *');
            header('Cross-Origin-Resource-Policy: same-origin');
            header('X-Content-Type-Options: nosniff');
            foreach (['content-length' => 'Content-Length', 'content-range' => 'Content-Range'] as $key => $name) {
                if (isset($responseHeaders[$key]) && preg_match('/^[\w\s\-\/.]+$/D', $responseHeaders[$key])) {
                    header($name . ': ' . $responseHeaders[$key]);
                }
            }
        }
        echo $data;
        return strlen($data);
    },
]);
$ok = curl_exec($stream);
$streamStatus = (int)curl_getinfo($stream, CURLINFO_RESPONSE_CODE);
$streamError = curl_errno($stream);
curl_close($stream);
if ($ok === false || $streamError !== 0 || !in_array($streamStatus, [200, 206], true)) {
    soundtrackAudioError(502, 'audio_upstream_unavailable');
}
if ($method === 'HEAD' && !headers_sent()) {
    http_response_code($streamStatus === 206 ? 206 : 200);
    header('Content-Type: audio/mpeg');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Accept-Ranges: bytes');
    header('Access-Control-Allow-Origin: *');
    header('Cross-Origin-Resource-Policy: same-origin');
    header('X-Content-Type-Options: nosniff');
}
