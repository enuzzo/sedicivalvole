<?php
declare(strict_types=1);

// sedicivalvole.session-report-api.v1: fixed snapshots, verified recipient, no PDF upload.
require_once dirname(__DIR__) . '/report-support/delivery.php';
const REPORT_EXPECTED_ORIGIN = 'https://sedicivalvole.app';
const REPORT_MAX_BODY_BYTES = 1250000;

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

function sessionReportRespond(int $status, array $result): void {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($result, JSON_UNESCAPED_SLASHES); exit;
}

try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); throw new SessionReportProblem('method_not_allowed', 405); }
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== REPORT_EXPECTED_ORIGIN
        || (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] !== 'same-origin')) throw new SessionReportProblem('origin_rejected', 403);
    if (strpos(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) throw new SessionReportProblem('json_required', 415);
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length <= 0 || $length > REPORT_MAX_BODY_BYTES) throw new SessionReportProblem('payload_size_rejected', 413);
    $raw = file_get_contents('php://input', false, null, 0, REPORT_MAX_BODY_BYTES + 1);
    if (!is_string($raw) || strlen($raw) > REPORT_MAX_BODY_BYTES) throw new SessionReportProblem('payload_size_rejected', 413);
    $payload = json_decode($raw, true);
    if (!is_array($payload) || json_last_error() !== JSON_ERROR_NONE) throw new SessionReportProblem('invalid_json', 400);
    $action = $payload['action'] ?? '';
    $allowed = ['preview' => ['action', 'snapshot'], 'request-code' => ['action', 'recipient'], 'verify-code' => ['action', 'code'], 'verification-status' => ['action'], 'send' => ['action', 'recipient', 'snapshot', 'idempotencyKey', 'expectedPdfSha256'], 'forget' => ['action']];
    if (!is_string($action) || !isset($allowed[$action])) throw new SessionReportProblem('action_rejected');
    reportKeys($payload, $allowed[$action]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    session_name('sedicivalvole_reports');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/api/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
    if (!session_start()) throw new SessionReportProblem('session_unavailable', 503);
    foreach (['report_verified', 'report_challenge'] as $field) if (isset($_SESSION[$field]) && ($_SESSION[$field]['expires'] ?? 0) <= time()) unset($_SESSION[$field]);
    $service = new SessionReportDelivery(rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . '/sv-session-report-v1', $_SERVER['REMOTE_ADDR'] ?? 'unknown', session_id(), time(), function ($to, $subject, $body, $headers) { return mail($to, $subject, $body, $headers); });
    if ($action === 'verification-status') sessionReportRespond(200, $service->verificationStatus($_SESSION));
    if ($action === 'forget') { $_SESSION = []; session_regenerate_id(true); sessionReportRespond(200, ['ok' => true, 'status' => 'recipient_forgotten']); }
    if ($action === 'request-code') sessionReportRespond(202, $service->requestCode(reportRecipient($payload['recipient']), $_SESSION));
    if ($action === 'verify-code') { $result = $service->verifyCode($payload['code'], $_SESSION); session_regenerate_id(true); sessionReportRespond(200, $result); }
    $snapshot = reportNormalize($payload['snapshot']);
    if ($action === 'send') {
        if (!is_string($payload['idempotencyKey']) || !is_string($payload['expectedPdfSha256'])) throw new SessionReportProblem('delivery_rejected');
        sessionReportRespond(202, $service->send(reportRecipient($payload['recipient']), $snapshot, $payload['idempotencyKey'], $payload['expectedPdfSha256'], $_SESSION));
    }
    $service->allowPreview(); $pdf = reportBuildPdf($snapshot);
    if (strlen($pdf) > 2097152) throw new SessionReportProblem('report_size_rejected', 422);
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="sedicivalvole-travel-' . substr($snapshot['createdAt'], 0, 10) . '.pdf"');
    header('X-Report-SHA256: ' . hash('sha256', $pdf));
    header('Content-Security-Policy: sandbox');
    echo $pdf;
} catch (SessionReportProblem $error) {
    sessionReportRespond($error->status, ['ok' => false, 'status' => $error->getMessage()]);
} catch (Throwable $error) {
    sessionReportRespond(503, ['ok' => false, 'status' => 'report_unavailable']);
}
