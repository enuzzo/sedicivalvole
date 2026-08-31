<?php
declare(strict_types=1);

const SOUNDTRACK_CATALOG_SCHEMA = 'sedicivalvole.soundtrack-catalog-api.v1';
const JAMENDO_CONFIG_FILE = __DIR__ . '/jamendo.local.php';

function soundtrackJson(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    soundtrackJson(405, ['ok' => false, 'status' => 'method_not_allowed']);
}
if (!is_file(JAMENDO_CONFIG_FILE)) {
    soundtrackJson(503, ['ok' => false, 'status' => 'configuration_unavailable']);
}
$config = require JAMENDO_CONFIG_FILE;
$clientId = is_array($config) ? trim((string)($config['client_id'] ?? '')) : '';
if (!preg_match('/^[A-Za-z0-9_-]{4,128}$/D', $clientId) || !function_exists('curl_init')) {
    soundtrackJson(503, ['ok' => false, 'status' => 'configuration_unavailable']);
}

$limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT, [
    'options' => ['default' => 24, 'min_range' => 3, 'max_range' => 50],
]);
$offset = filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT, [
    'options' => ['default' => 0, 'min_range' => 0, 'max_range' => 10000],
]);
$allowedSpeeds = ['verylow', 'low', 'medium', 'high', 'veryhigh'];
$requestedSpeeds = preg_split('/[\s,+]+/', strtolower(trim((string)($_GET['speed'] ?? '')))) ?: [];
$speeds = array_values(array_unique(array_filter(
    $requestedSpeeds,
    static fn($value): bool => in_array($value, $allowedSpeeds, true)
)));
$genre = strtolower(trim((string)($_GET['genre'] ?? '')));
if (!preg_match('/^[a-z0-9-]{2,32}$/D', $genre)) {
    $genre = '';
}
$queryParameters = [
    'client_id' => $clientId,
    'format' => 'json',
    'limit' => $limit,
    'offset' => $offset,
    'include' => 'musicinfo',
    'audioformat' => 'mp32',
    'groupby' => 'artist_id',
];
if (count($speeds) > 0) {
    $queryParameters['speed'] = implode(' ', $speeds);
}
if ($genre !== '') {
    $queryParameters['tags'] = $genre;
}
if (count($speeds) > 0 || $genre !== '') {
    $queryParameters['boost'] = 'popularity_total';
} else {
    $queryParameters['order'] = 'popularity_total';
}
$query = http_build_query($queryParameters, '', '&', PHP_QUERY_RFC3986);

$upstream = null;
for ($attempt = 0; $attempt < 4; $attempt += 1) {
    $curl = curl_init('https://api.jamendo.com/v3.0/tracks/?' . $query);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERAGENT => 'sedicivalvole/' . SOUNDTRACK_CATALOG_SCHEMA,
    ]);
    $raw = curl_exec($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);
    $candidate = is_string($raw) && $status === 200 ? json_decode($raw, true) : null;
    if (is_array($candidate)
        && strtolower((string)($candidate['headers']['status'] ?? '')) === 'success'
        && is_array($candidate['results'] ?? null)) {
        $upstream = $candidate;
        if ($offset > 0 || count($candidate['results']) > 0) {
            break;
        }
    }
    if ($attempt < 3) {
        usleep(120000);
    }
}
if (!is_array($upstream)) {
    soundtrackJson(502, ['ok' => false, 'status' => 'upstream_payload_invalid']);
}

$tracks = [];
foreach ($upstream['results'] as $track) {
    if (!is_array($track)) {
        continue;
    }
    $sanitized = [
        'id' => trim((string)($track['id'] ?? '')),
        'name' => trim((string)($track['name'] ?? '')),
        'artist_id' => trim((string)($track['artist_id'] ?? '')),
        'artist_name' => trim((string)($track['artist_name'] ?? '')),
        'album_name' => trim((string)($track['album_name'] ?? '')),
        'license_ccurl' => trim((string)($track['license_ccurl'] ?? '')),
        'audio' => trim((string)($track['audio'] ?? '')),
        'shareurl' => trim((string)($track['shareurl'] ?? '')),
        'image' => trim((string)($track['image'] ?? '')),
        'musicinfo' => [
            'speed' => in_array(strtolower(trim((string)($track['musicinfo']['speed'] ?? ''))), $allowedSpeeds, true)
                ? strtolower(trim((string)$track['musicinfo']['speed']))
                : null,
            'tags' => [
                'genres' => array_values(array_slice(array_filter(array_map(
                    static fn($value): string => strtolower(trim((string)$value)),
                    is_array($track['musicinfo']['tags']['genres'] ?? null)
                        ? $track['musicinfo']['tags']['genres']
                        : []
                )), 0, 24)),
            ],
        ],
    ];
    if ($sanitized['id'] === '' || $sanitized['name'] === '' || $sanitized['artist_name'] === ''
        || $sanitized['license_ccurl'] === '' || $sanitized['audio'] === '' || $sanitized['shareurl'] === '') {
        continue;
    }
    $tracks[] = $sanitized;
}

soundtrackJson(200, [
    'schema' => SOUNDTRACK_CATALOG_SCHEMA,
    'fetchedAt' => gmdate('c'),
    'source' => 'jamendo',
    'providerCredit' => 'Provided by Jamendo',
    'tracks' => $tracks,
    'returned' => count($tracks),
    'selection' => [
        'speed' => $speeds,
        'genre' => $genre !== '' ? $genre : null,
    ],
    'persistentAudioStorage' => false,
    'automaticPlayback' => false,
]);
