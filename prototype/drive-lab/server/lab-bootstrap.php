<?php
declare(strict_types=1);

const LAB_EXPECTED_ORIGIN = 'https://sedicivalvole.app';
const LAB_CONFIG_PATH = __DIR__ . '/auth.local.php';

function labRespondJson(int $status, string $code, bool $ok = false): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => $ok, 'status' => $code], JSON_UNESCAPED_SLASHES);
    exit;
}

function labLoadConfig(): array
{
    if (!is_file(LAB_CONFIG_PATH)) {
        throw new RuntimeException('lab_configuration_unavailable');
    }
    $config = require LAB_CONFIG_PATH;
    if (!is_array($config)
        || !preg_match('/^[a-f0-9]{32,128}$/', (string) ($config['salt_hex'] ?? ''))
        || !preg_match('/^[a-f0-9]{64}$/', (string) ($config['password_hash_hex'] ?? ''))
        || (int) ($config['iterations'] ?? 0) < 100000
        || (int) ($config['session_ttl_seconds'] ?? 0) < 300) {
        throw new RuntimeException('lab_configuration_invalid');
    }
    return $config;
}

function labStartSession(array $config): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('sedicivalvole_lab');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/lab/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    if (!session_start()) throw new RuntimeException('session_unavailable');
    $now = time();
    $lastSeen = (int) ($_SESSION['lab_last_seen'] ?? 0);
    if ($lastSeen > 0 && ($now - $lastSeen) > (int) $config['session_ttl_seconds']) {
        $_SESSION = [];
        session_regenerate_id(true);
    }
    if (!empty($_SESSION['lab_authenticated'])) $_SESSION['lab_last_seen'] = $now;
}

function labAuthenticated(): bool
{
    return !empty($_SESSION['lab_authenticated']);
}

function labRequireAuthenticatedJson(array $config): void
{
    labStartSession($config);
    if (!labAuthenticated()) labRespondJson(401, 'authentication_required');
}

function labRequireSameOrigin(): void
{
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== LAB_EXPECTED_ORIGIN) {
        labRespondJson(403, 'origin_rejected');
    }
    $fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
    if ($fetchSite !== '' && $fetchSite !== 'same-origin') {
        labRespondJson(403, 'fetch_site_rejected');
    }
}

function labRequireCsrf(): void
{
    $expected = (string) ($_SESSION['lab_csrf'] ?? '');
    $received = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if ($expected === '' || $received === '' || !hash_equals($expected, $received)) {
        labRespondJson(403, 'csrf_rejected');
    }
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) {
    http_response_code(404);
    exit;
}
