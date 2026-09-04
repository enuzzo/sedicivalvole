<?php
declare(strict_types=1);

const EXPECTED_ORIGIN = 'https://sedicivalvole.app';
const MAX_BODY_BYTES = 1966080;
const RATE_LIMIT_SECONDS = 20;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

function respond(int $status, string $code, bool $ok = false): void
{
    http_response_code($status);
    echo json_encode([
        'ok' => $ok,
        'status' => $code,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

function containsForbiddenCoordinateKey($value): bool
{
    if (!is_array($value)) {
        return false;
    }
    foreach ($value as $key => $child) {
        if (is_string($key)) {
            $normalized = strtolower($key);
            if (in_array($normalized, ['latitude', 'longitude', 'lat', 'lon', 'lng', 'coordinates', 'coords'], true)) {
                return true;
            }
        }
        if (containsForbiddenCoordinateKey($child)) {
            return true;
        }
    }
    return false;
}

function buildDiagnosticMail(array $report, string $receivedAt, string $recipient, ?string $fixedBoundary = null): array
{
    if (!function_exists('gzencode') || !defined('FORCE_GZIP')) {
        throw new RuntimeException('compression_unavailable');
    }
    $attachmentJson = json_encode([
        'schema' => 'sedicivalvole.tesla-diagnostic.v4',
        'serverAcceptedAt' => $receivedAt,
        'report' => $report,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if (!is_string($attachmentJson)) {
        throw new RuntimeException('attachment_encoding_unavailable');
    }
    $attachmentGzip = gzencode($attachmentJson, 9, FORCE_GZIP);
    if (!is_string($attachmentGzip)) {
        throw new RuntimeException('compression_unavailable');
    }

    $build = preg_replace('/[^A-Za-z0-9._-]/', '-', (string) ($report['app']['build'] ?? 'unknown'));
    if (!is_string($build) || $build === '') {
        $build = 'unknown';
    }
    $acceptedTimestamp = strtotime($receivedAt);
    $filenameTimestamp = $acceptedTimestamp === false ? gmdate('Ymd\THis\Z') : gmdate('Ymd\THis\Z', $acceptedTimestamp);
    $attachmentName = 'sedicivalvole-diagnostic-' . $filenameTimestamp . '-build-' . $build . '.json.gz';
    $attachmentSha256 = hash('sha256', $attachmentJson);
    $compressedSha256 = hash('sha256', $attachmentGzip);
    $boundary = $fixedBoundary ?? ('=_sedicivalvole_' . bin2hex(random_bytes(12)));
    $summary = implode("\r\n", [
        'sedicivalvole Tesla diagnostic',
        'Server accepted at: ' . $receivedAt,
        'Schema: sedicivalvole.tesla-diagnostic.v4',
        'Privacy: the endpoint rejects coordinate fields and stores no report.',
        'Complete report: attached as gzip-compressed JSON.',
        'Attachment: ' . $attachmentName,
        'JSON bytes: ' . strlen($attachmentJson),
        'GZIP bytes: ' . strlen($attachmentGzip),
        'JSON SHA-256: ' . $attachmentSha256,
        'GZIP SHA-256: ' . $compressedSha256,
    ]);
    $encodedAttachment = rtrim(chunk_split(base64_encode($attachmentGzip), 76, "\r\n"));
    $message = implode("\r\n", [
        '--' . $boundary,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $summary,
        '--' . $boundary,
        'Content-Type: application/gzip; name="' . $attachmentName . '"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="' . $attachmentName . '"',
        '',
        $encodedAttachment,
        '--' . $boundary . '--',
        '',
    ]);
    $headers = implode("\r\n", [
        'From: sedicivalvole diagnostics <diagnostics@sedicivalvole.app>',
        'Reply-To: ' . $recipient,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
        'X-Mailer: sedicivalvole-diagnostic-v3',
    ]);

    return [
        'message' => $message,
        'headers' => $headers,
        'attachmentName' => $attachmentName,
        'attachmentJson' => $attachmentJson,
        'attachmentGzip' => $attachmentGzip,
    ];
}

if (defined('SEDICIVALVOLE_DIAGNOSTIC_LIBRARY_ONLY')) {
    return;
}

if (ini_set('serialize_precision', '-1') === false) {
    respond(503, 'serialization_precision_unavailable');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, 'method_not_allowed');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== EXPECTED_ORIGIN) {
    respond(403, 'origin_rejected');
}

$fetchSite = strtolower($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');
if ($fetchSite !== '' && $fetchSite !== 'same-origin') {
    respond(403, 'fetch_site_rejected');
}

$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (strpos($contentType, 'application/json') !== 0) {
    respond(415, 'json_required');
}

$declaredLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($declaredLength <= 0 || $declaredLength > MAX_BODY_BYTES) {
    respond(413, 'payload_size_rejected');
}

$rawBody = file_get_contents('php://input', false, null, 0, MAX_BODY_BYTES + 1);
if (!is_string($rawBody) || $rawBody === '' || strlen($rawBody) > MAX_BODY_BYTES) {
    respond(413, 'payload_size_rejected');
}

$payload = json_decode($rawBody, true);
if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
    respond(400, 'invalid_json');
}

if (($payload['schema'] ?? '') !== 'sedicivalvole.tesla-diagnostic.v4' || !is_array($payload['report'] ?? null)) {
    respond(422, 'schema_rejected');
}

if (containsForbiddenCoordinateKey($payload['report'])) {
    respond(422, 'coordinates_rejected');
}

$reportJson = json_encode(
    $payload['report'],
    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
);
if (!is_string($reportJson) || strlen($reportJson) > MAX_BODY_BYTES) {
    respond(422, 'report_rejected');
}

$recipientPath = __DIR__ . '/recipient.local.php';
if (!is_file($recipientPath)) {
    respond(503, 'recipient_unavailable');
}
$diagnosticRecipient = require $recipientPath;
if (!is_string($diagnosticRecipient) || filter_var($diagnosticRecipient, FILTER_VALIDATE_EMAIL) === false) {
    respond(503, 'recipient_unavailable');
}

$clientKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|sedicivalvole-diagnostic-v3');
$ratePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sv-diag-' . $clientKey;
$rateHandle = @fopen($ratePath, 'c+');
if ($rateHandle === false || !flock($rateHandle, LOCK_EX)) {
    if (is_resource($rateHandle)) {
        fclose($rateHandle);
    }
    respond(503, 'rate_limit_unavailable');
}

$previousTimestamp = (int) trim((string) stream_get_contents($rateHandle));
$currentTimestamp = time();
if ($previousTimestamp > 0 && ($currentTimestamp - $previousTimestamp) < RATE_LIMIT_SECONDS) {
    flock($rateHandle, LOCK_UN);
    fclose($rateHandle);
    respond(429, 'rate_limited');
}
rewind($rateHandle);
ftruncate($rateHandle, 0);
fwrite($rateHandle, (string) $currentTimestamp);
fflush($rateHandle);
flock($rateHandle, LOCK_UN);
fclose($rateHandle);

$receivedAt = gmdate('c');
$subject = '[sedicivalvole] Tesla diagnostic ' . gmdate('Y-m-d H:i:s') . ' UTC';
try {
    $mailContent = buildDiagnosticMail($payload['report'], $receivedAt, $diagnosticRecipient);
} catch (RuntimeException $error) {
    respond(503, $error->getMessage());
} catch (Throwable $error) {
    respond(503, 'mail_packaging_unavailable');
}

if (!mail($diagnosticRecipient, $subject, $mailContent['message'], $mailContent['headers'])) {
    respond(502, 'mail_transport_rejected');
}

respond(202, 'accepted_by_mail_transport', true);
