<?php
declare(strict_types=1);

// Short-lived signaling only. Sensor samples never pass through this endpoint.
function motionPairRequest(array $input, string $directory, int $now): array
{
    $action = $input['action'] ?? '';
    if (!in_array($action, ['create', 'join', 'poll', 'answer', 'finish', 'delete'], true)) return [400, ['status' => 'invalid_action']];
    if (is_link($directory) || (!is_dir($directory) && !@mkdir($directory, 0700, true))) return [503, ['status' => 'storage_unavailable']];
    @chmod($directory, 0700);
    $lockPath = $directory . '/lock';
    if (is_link($lockPath)) return [503, ['status' => 'storage_unavailable']];
    $lock = @fopen($lockPath, 'c');
    if (!$lock || !flock($lock, LOCK_EX)) { if ($lock) fclose($lock); return [503, ['status' => 'storage_unavailable']]; }
    try {
        $files = glob($directory . '/session-*.json') ?: [];
        foreach ($files as $file) {
            if (!is_link($file) && is_file($file) && filemtime($file) < $now - 180) @unlink($file);
        }
        if ($action === 'create') {
            $offer = $input['sdp'] ?? null;
            if (!is_string($offer) || strlen($offer) < 20 || strlen($offer) > 24576 || substr($offer, 0, 3) !== 'v=0') return [400, ['status' => 'invalid_description']];
            if (count(glob($directory . '/session-*.json') ?: []) >= 64) return [429, ['status' => 'busy']];
            $id = bin2hex(random_bytes(16));
            $receiver = bin2hex(random_bytes(32));
            $join = bin2hex(random_bytes(32));
            $record = ['expires' => $now + 180, 'receiver' => hash('sha256', $receiver), 'join' => hash('sha256', $join), 'phone' => null,
                'offer' => $offer, 'answer' => null, 'joined' => false];
            $path = $directory . '/session-' . $id . '.json';
            if (@file_put_contents($path, json_encode($record), LOCK_EX) === false) return [503, ['status' => 'storage_unavailable']];
            @chmod($path, 0600);
            return [200, ['status' => 'pairing', 'id' => $id, 'token' => $receiver, 'join' => $join, 'expiresIn' => 180]];
        }
        $id = $input['id'] ?? '';
        $token = $input['token'] ?? '';
        if (!is_string($id) || !preg_match('/\A[a-f0-9]{32}\z/', $id) || !is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/', $token)) return [403, ['status' => 'pairing_unavailable']];
        $path = $directory . '/session-' . $id . '.json';
        if (is_link($path) || !is_file($path)) return [410, ['status' => 'pairing_unavailable']];
        $record = json_decode((string) @file_get_contents($path), true);
        if (!is_array($record) || !is_int($record['expires'] ?? null)) return [503, ['status' => 'storage_unavailable']];
        if ($now >= $record['expires']) { @unlink($path); return [410, ['status' => 'expired']]; }
        $hash = hash('sha256', $token);
        $isReceiver = hash_equals($record['receiver'], $hash);
        $isPhone = is_string($record['phone']) && hash_equals($record['phone'], $hash);
        if ($action === 'join') {
            if ($record['joined'] || !hash_equals($record['join'], $hash)) return [403, ['status' => 'pairing_unavailable']];
            $phone = bin2hex(random_bytes(32));
            $record['phone'] = hash('sha256', $phone);
            $record['joined'] = true;
            $record['join'] = '';
            if (@file_put_contents($path, json_encode($record), LOCK_EX) === false) return [503, ['status' => 'storage_unavailable']];
            return [200, ['status' => 'joined', 'token' => $phone, 'sdp' => $record['offer']]];
        }
        if (!$isReceiver && !$isPhone) return [403, ['status' => 'pairing_unavailable']];
        if ($action === 'delete' || ($action === 'finish' && $isReceiver)) {
            if (!@unlink($path)) return [503, ['status' => 'storage_unavailable']];
            return [200, ['status' => 'deleted']];
        }
        if ($action === 'answer' && $isPhone && $record['answer'] === null) {
            $answer = $input['sdp'] ?? null;
            if (!is_string($answer) || strlen($answer) < 20 || strlen($answer) > 24576 || substr($answer, 0, 3) !== 'v=0') return [400, ['status' => 'invalid_description']];
            $record['answer'] = $answer;
            $record['offer'] = null;
            if (@file_put_contents($path, json_encode($record), LOCK_EX) === false) return [503, ['status' => 'storage_unavailable']];
            return [200, ['status' => 'answered']];
        }
        if ($action === 'poll' && $isReceiver) return [200, ['status' => $record['answer'] !== null ? 'answered' : ($record['joined'] ? 'joined' : 'pairing'), 'sdp' => $record['answer']]];
        return [403, ['status' => 'action_rejected']];
    } finally { flock($lock, LOCK_UN); fclose($lock); }
}

if (defined('SEDICIVALVOLE_MOTION_PAIR_TEST')) return;
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
$status = 400;
$response = ['status' => 'invalid_request'];
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST'); $status = 405;
} elseif (($_SERVER['HTTP_ORIGIN'] ?? '') !== 'https://sedicivalvole.app'
    || !in_array($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '', ['', 'same-origin'], true)) {
    $status = 403; $response = ['status' => 'origin_rejected'];
} elseif (strpos(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json') !== 0) {
    $status = 415;
} elseif ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768) {
    $status = 413;
} else {
    $body = file_get_contents('php://input', false, null, 0, 32769);
    $input = is_string($body) && strlen($body) <= 32768 ? json_decode($body, true) : null;
    if (is_array($input)) {
        try { [$status, $response] = motionPairRequest($input, sys_get_temp_dir() . '/sedicivalvole-motion-pair-v1', time()); }
        catch (Throwable $error) { $status = 503; $response = ['status' => 'storage_unavailable']; }
    }
}
http_response_code($status);
echo json_encode($response, JSON_UNESCAPED_SLASHES);
