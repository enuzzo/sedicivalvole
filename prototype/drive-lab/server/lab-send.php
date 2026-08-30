<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

const LAB_MAX_BODY_BYTES = 262144;
const LAB_RATE_LIMIT_SECONDS = 10;

function labContainsForbiddenKey($value): bool
{
    if (!is_array($value)) return false;
    foreach ($value as $key => $child) {
        if (is_string($key)) {
            $normalized = strtolower($key);
            if (in_array($normalized, ['latitude', 'longitude', 'lat', 'lon', 'lng', 'coordinates', 'coords', 'password', 'secret', 'credential', 'token'], true)) return true;
        }
        if (labContainsForbiddenKey($child)) return true;
    }
    return false;
}

function buildLabPresetMail(array $preset, string $acceptedAt, string $recipient, ?string $fixedBoundary = null): array
{
    $json = json_encode($preset, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    if (!is_string($json)) throw new RuntimeException('preset_encoding_unavailable');
    $boundary = $fixedBoundary ?? ('=_sedicivalvole_lab_' . bin2hex(random_bytes(12)));
    $variant = preg_replace('/[^A-Za-z0-9._-]/', '-', (string) ($preset['selection']['visualVariant'] ?? 'unknown')) ?: 'unknown';
    $stamp = gmdate('Ymd\THis\Z', strtotime($acceptedAt) ?: time());
    $filename = 'sedicivalvole-lab-' . $stamp . '-' . $variant . '.json';
    $digest = hash('sha256', $json);
    $summary = implode("\r\n", [
        'sedicivalvole LAB preset',
        'Server accepted at: ' . $acceptedAt,
        'Visual: ' . (string) ($preset['selection']['visual'] ?? 'unknown'),
        'Variant: ' . (string) ($preset['selection']['visualVariant'] ?? 'unknown'),
        'Music context: ' . (string) ($preset['selection']['music'] ?? 'unknown'),
        'Build: ' . (string) ($preset['app']['build'] ?? 'unknown'),
        'Privacy: coordinate-free; no credentials or persistent storage.',
        'JSON bytes: ' . strlen($json),
        'JSON SHA-256: ' . $digest,
    ]);
    $message = implode("\r\n", [
        '--' . $boundary,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        $summary,
        '--' . $boundary,
        'Content-Type: application/json; name="' . $filename . '"',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="' . $filename . '"',
        '',
        rtrim(chunk_split(base64_encode($json), 76, "\r\n")),
        '--' . $boundary . '--',
        '',
    ]);
    $headers = implode("\r\n", [
        'From: sedicivalvole LAB <diagnostics@sedicivalvole.app>',
        'Reply-To: ' . $recipient,
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
        'X-Mailer: sedicivalvole-lab-v1',
    ]);
    return compact('message', 'headers', 'filename', 'json', 'digest');
}

if (defined('SEDICIVALVOLE_LAB_MAIL_LIBRARY_ONLY')) return;

try {
    $config = labLoadConfig();
} catch (RuntimeException $error) {
    labRespondJson(503, $error->getMessage());
}
labRequireAuthenticatedJson($config);
labRequireSameOrigin();
labRequireCsrf();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    labRespondJson(405, 'method_not_allowed');
}
if (strpos(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json') !== 0) labRespondJson(415, 'json_required');
$declaredLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($declaredLength <= 0 || $declaredLength > LAB_MAX_BODY_BYTES) labRespondJson(413, 'payload_size_rejected');
$raw = file_get_contents('php://input', false, null, 0, LAB_MAX_BODY_BYTES + 1);
if (!is_string($raw) || $raw === '' || strlen($raw) > LAB_MAX_BODY_BYTES) labRespondJson(413, 'payload_size_rejected');
$payload = json_decode($raw, true);
if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) labRespondJson(400, 'invalid_json');
$preset = $payload['preset'] ?? null;
if (($payload['schema'] ?? '') !== 'sedicivalvole.lab-mail.v1'
    || !is_array($preset)
    || ($preset['schema'] ?? '') !== 'sedicivalvole.lab-preset.v1'
    || ($preset['control']['schema'] ?? '') !== 'sedicivalvole.control.v1'
    || ($preset['privacy']['coordinateFree'] ?? null) !== true
    || ($preset['privacy']['secretsIncluded'] ?? null) !== false
    || !is_array($preset['groups'] ?? null)
    || labContainsForbiddenKey($preset)) {
    labRespondJson(422, 'preset_rejected');
}

$recipientPath = dirname(__DIR__) . '/api/recipient.local.php';
if (!is_file($recipientPath)) labRespondJson(503, 'recipient_unavailable');
$recipient = require $recipientPath;
if (!is_string($recipient) || filter_var($recipient, FILTER_VALIDATE_EMAIL) === false) labRespondJson(503, 'recipient_unavailable');

$clientKey = hash('sha256', session_id() . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|lab-mail');
$ratePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sv-lab-mail-' . $clientKey;
$previous = is_file($ratePath) ? (int) @file_get_contents($ratePath) : 0;
$now = time();
if ($previous > 0 && ($now - $previous) < LAB_RATE_LIMIT_SECONDS) labRespondJson(429, 'rate_limited');
if (@file_put_contents($ratePath, (string) $now, LOCK_EX) === false) labRespondJson(503, 'rate_limit_unavailable');

$acceptedAt = gmdate('c');
try {
    $mail = buildLabPresetMail($preset, $acceptedAt, $recipient);
} catch (Throwable $error) {
    labRespondJson(503, 'mail_packaging_unavailable');
}
$subject = '[sedicivalvole LAB] ' . (string) ($preset['selection']['visualVariant'] ?? 'preset') . ' · ' . gmdate('Y-m-d H:i:s') . ' UTC';
if (!mail($recipient, $subject, $mail['message'], $mail['headers'])) labRespondJson(502, 'mail_transport_rejected');
labRespondJson(202, 'accepted_by_mail_transport', true);
