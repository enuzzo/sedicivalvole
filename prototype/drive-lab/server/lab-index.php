<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');

$configurationError = null;
try {
    $labConfig = labLoadConfig();
    labStartSession($labConfig);
} catch (RuntimeException $error) {
    $configurationError = $error->getMessage();
    $labConfig = null;
}

if (isset($_GET['logout']) && session_status() === PHP_SESSION_ACTIVE) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], '', true, true);
    }
    session_destroy();
    header('Location: /lab/');
    exit;
}

$loginError = null;
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && $labConfig !== null && !labAuthenticated()) {
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $fetchSite = strtolower((string) ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
    $crossSite = ($origin !== '' && $origin !== LAB_EXPECTED_ORIGIN)
        || ($fetchSite !== '' && !in_array($fetchSite, ['same-origin', 'none'], true));
    if ($crossSite) {
        $loginError = 'Request not accepted.';
    }

    $clientKey = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '|sedicivalvole-lab-login');
    $ratePath = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sv-lab-login-' . $clientKey;
    $attempts = is_file($ratePath) ? json_decode((string) @file_get_contents($ratePath), true) : null;
    $now = time();
    $windowStart = is_array($attempts) ? (int) ($attempts['window'] ?? 0) : 0;
    $count = is_array($attempts) && ($now - $windowStart) < 300 ? (int) ($attempts['count'] ?? 0) : 0;
    if ($loginError !== null) {
        // Reject cross-site submissions without consuming the password-attempt budget.
    } elseif ($count >= 8) {
        $loginError = 'Too many attempts. Wait a few minutes.';
    } else {
        $password = (string) ($_POST['password'] ?? '');
        $salt = hex2bin((string) $labConfig['salt_hex']);
        $candidate = is_string($salt)
            ? hash_pbkdf2('sha256', $password, $salt, (int) $labConfig['iterations'], 64, false)
            : '';
        if ($candidate !== '' && hash_equals((string) $labConfig['password_hash_hex'], $candidate)) {
            @unlink($ratePath);
            session_regenerate_id(true);
            $_SESSION['lab_authenticated'] = true;
            $_SESSION['lab_last_seen'] = $now;
            $_SESSION['lab_csrf'] = bin2hex(random_bytes(24));
            header('Location: /lab/');
            exit;
        }
        @file_put_contents($ratePath, json_encode(['window' => $windowStart > 0 ? $windowStart : $now, 'count' => $count + 1]), LOCK_EX);
        usleep(250000);
        $loginError = 'Access code not accepted.';
    }
}

$authenticated = $labConfig !== null && labAuthenticated();
$nonce = base64_encode(random_bytes(18));
header("Content-Security-Policy: default-src 'none'; script-src 'nonce-{$nonce}' 'self'; worker-src 'self'; style-src 'nonce-{$nonce}'; connect-src 'self'; font-src data:; media-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#050607">
  <title>sedicivalvole / LAB</title>
  <style nonce="<?= htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') ?>">
/*__LAB_CSS__*/
  .lab-login-page { min-height: 100%; display: grid; place-items: center; padding: 24px; background: #050607; }
  .lab-login { width: min(420px, 100%); border: 1px solid rgba(244,243,238,.22); background: #090b0c; }
  .lab-login header { padding: 24px; border-bottom: 1px solid rgba(244,243,238,.18); font-size: 22px; font-weight: 650; letter-spacing: -.03em; }
  .lab-login header span { color: #ef4136; }
  .lab-login form, .lab-login .lab-config-error { display: grid; gap: 16px; padding: 24px; }
  .lab-login label { color: rgba(244,243,238,.62); font-size: 10px; font-weight: 700; letter-spacing: .08em; }
  .lab-login input { width: 100%; min-height: 52px; margin-top: 10px; padding: 0 14px; color: #f4f3ee; border: 1px solid rgba(244,243,238,.28); border-radius: 4px; background: #050607; }
  .lab-login button { min-height: 52px; color: #fff; border: 0; border-radius: 4px; background: #ef4136; font-weight: 700; letter-spacing: .08em; }
  .lab-login p { margin: 0; color: rgba(244,243,238,.58); font: 12px/1.5 ui-monospace, monospace; }
  .lab-login .is-error { color: #ff8a80; }
  </style>
</head>
<body>
<?php if (!$authenticated): ?>
  <main class="lab-login-page">
    <section class="lab-login" aria-labelledby="lab-login-title">
      <header id="lab-login-title">sedicivalvole <span>/ LAB</span></header>
      <?php if ($configurationError !== null): ?>
        <div class="lab-config-error"><p class="is-error">LAB configuration is unavailable.</p></div>
      <?php else: ?>
        <form method="post" action="/lab/" autocomplete="off">
          <label>OWNER ACCESS CODE
            <input type="password" name="password" required autofocus autocomplete="current-password">
          </label>
          <?php if ($loginError !== null): ?><p class="is-error" role="alert"><?= htmlspecialchars($loginError, ENT_QUOTES, 'UTF-8') ?></p><?php endif; ?>
          <button type="submit">ENTER LAB</button>
          <p>Private calibration surface. No coordinates or credentials enter exported presets.</p>
        </form>
      <?php endif; ?>
    </section>
  </main>
<?php else: ?>
  <div id="lab-root"></div>
  <script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') ?>">
    window.__SEDICIVALVOLE_LAB_BOOT__ = Object.freeze({
      authenticated: true,
      csrfToken: <?= json_encode((string) $_SESSION['lab_csrf'], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>,
      sendPath: "/lab/send.php",
      logoutPath: "/lab/?logout=1"
    });
  </script>
  <script nonce="<?= htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8') ?>">
/*__LAB_JS__*/
  </script>
<?php endif; ?>
</body>
</html>
