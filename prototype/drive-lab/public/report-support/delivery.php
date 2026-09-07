<?php
declare(strict_types=1);

require_once __DIR__ . '/report.php';

function reportRecipient($input): string
{
    if (!is_string($input) || strlen($input) > 254 || preg_match('/[\x00-\x1f\x7f]/', $input)) throw new SessionReportProblem('recipient_rejected');
    $address = trim($input);
    if (filter_var($address, FILTER_VALIDATE_EMAIL) === false) throw new SessionReportProblem('recipient_rejected');
    $at = strrpos($address, '@');
    return substr($address, 0, $at + 1) . strtolower(substr($address, $at + 1));
}

function reportBuildMail(string $pdf, array $snapshot, string $recipient): array
{
    $boundary = '=_sv_report_' . bin2hex(random_bytes(12));
    $filename = 'sedicivalvole-travel-' . substr($snapshot['createdAt'], 0, 10) . '-' . $snapshot['app']['build'] . '.pdf';
    $message = implode("\r\n", [
        '--' . $boundary, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '',
        'Your sedicivalvole Travel Report is attached.',
        'Created: ' . $snapshot['createdAt'],
        'Route: ' . ($snapshot['includeRoute'] ? 'included by request' : 'not included'),
        'PDF SHA-256: ' . hash('sha256', $pdf), '',
        '--' . $boundary, 'Content-Type: application/pdf; name="' . $filename . '"',
        'Content-Transfer-Encoding: base64', 'Content-Disposition: attachment; filename="' . $filename . '"', '',
        rtrim(chunk_split(base64_encode($pdf), 76, "\r\n")), '--' . $boundary . '--', '',
    ]);
    $headers = implode("\r\n", ['From: sedicivalvole <diagnostics@sedicivalvole.app>', 'MIME-Version: 1.0', 'Content-Type: multipart/mixed; boundary="' . $boundary . '"', 'X-Mailer: sedicivalvole-session-report-v1']);
    return ['recipient' => $recipient, 'subject' => 'Your sedicivalvole Travel Report', 'message' => $message, 'headers' => $headers];
}

final class SessionReportDelivery
{
    private $path;
    private $now;
    private $mailer;
    private $client;
    private $sessionId;
    public function __construct(string $directory, string $client, string $sessionId, int $now, callable $mailer)
    {
        if (!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory)) throw new SessionReportProblem('delivery_storage_unavailable', 503);
        $this->path = $directory . '/ledger.json'; $this->client = hash('sha256', $client); $this->sessionId = hash('sha256', $sessionId); $this->now = $now; $this->mailer = $mailer;
    }
    private function locked(callable $operation)
    {
        $handle = @fopen($this->path, 'c+');
        if ($handle === false || !flock($handle, LOCK_EX)) { if (is_resource($handle)) fclose($handle); throw new SessionReportProblem('delivery_storage_unavailable', 503); }
        @chmod($this->path, 0600);
        try {
            $bytes = stream_get_contents($handle, 2097153);
            if (!is_string($bytes) || strlen($bytes) > 2097152) throw new SessionReportProblem('delivery_storage_unavailable', 503);
            $data = $bytes === '' ? ['rates' => [], 'sends' => []] : json_decode($bytes, true);
            if (!is_array($data) || !isset($data['rates'], $data['sends']) || !is_array($data['rates']) || !is_array($data['sends'])) throw new SessionReportProblem('delivery_storage_unavailable', 503);
            foreach (array_merge(array_values($data['rates']), array_values($data['sends'])) as $row) if (!is_array($row) || !is_int($row['expires'] ?? null)) throw new SessionReportProblem('delivery_storage_unavailable', 503);
            foreach ($data['rates'] as $key => $row) if (($row['expires'] ?? 0) <= $this->now) unset($data['rates'][$key]);
            foreach ($data['sends'] as $key => $row) if (($row['expires'] ?? 0) <= $this->now) unset($data['sends'][$key]);
            $save = function () use ($handle, &$data) {
                $json = json_encode($data, JSON_UNESCAPED_SLASHES);
                if (!is_string($json) || strlen($json) > 2097152) throw new SessionReportProblem('delivery_storage_unavailable', 503);
                rewind($handle);
                if (!ftruncate($handle, 0) || fwrite($handle, $json) !== strlen($json) || !fflush($handle)) throw new SessionReportProblem('delivery_storage_unavailable', 503);
            };
            return $operation($data, $save);
        } finally { flock($handle, LOCK_UN); fclose($handle); }
    }
    private function reserve(array &$data, string $purpose, string $recipient, array $limits): void
    {
        $keys = ['global' => 'all', 'ip' => $this->client, 'recipient' => hash('sha256', $recipient)];
        foreach ($limits as $scope => $limit) {
            $key = $purpose . ':' . $scope . ':' . $keys[$scope]; $row = $data['rates'][$key] ?? null;
            if ($row && $row['count'] >= $limit[0]) throw new SessionReportProblem('rate_limited', 429);
        }
        foreach ($limits as $scope => $limit) {
            $key = $purpose . ':' . $scope . ':' . $keys[$scope];
            if (!isset($data['rates'][$key])) $data['rates'][$key] = ['count' => 0, 'expires' => $this->now + $limit[1]];
            $data['rates'][$key]['count']++;
        }
    }
    public function allowPreview(): void
    {
        $this->locked(function (&$data, $save) { $this->reserve($data, 'preview', '', ['global' => [500, 3600], 'ip' => [60, 3600]]); $save(); });
    }
    public function verificationStatus(array &$session): array
    {
        $proof = $session['report_verified'] ?? null;
        if (!is_array($proof) || !is_int($proof['expires'] ?? null) || $proof['expires'] <= $this->now) {
            unset($session['report_verified']);
            return ['ok' => true, 'status' => 'verification_status', 'recipient' => null, 'expiresInSeconds' => 0];
        }
        try { $recipient = reportRecipient($proof['recipient'] ?? null); }
        catch (SessionReportProblem $error) {
            unset($session['report_verified']);
            return ['ok' => true, 'status' => 'verification_status', 'recipient' => null, 'expiresInSeconds' => 0];
        }
        return ['ok' => true, 'status' => 'verification_status', 'recipient' => $recipient, 'expiresInSeconds' => $proof['expires'] - $this->now];
    }
    public function requestCode(string $recipient, array &$session): array
    {
        $recipient = reportRecipient($recipient);
        if (($session['report_code_requested_at'] ?? 0) + 60 > $this->now) throw new SessionReportProblem('rate_limited', 429);
        $code = (string) random_int(100000, 999999);
        $this->locked(function (&$data, $save) use ($recipient) { $this->reserve($data, 'code', $recipient, ['global' => [40, 86400], 'ip' => [8, 86400], 'recipient' => [2, 3600]]); $save(); });
        $session['report_code_requested_at'] = $this->now;
        $session['report_challenge'] = ['recipient' => $recipient, 'digest' => hash('sha256', $this->sessionId . '|' . $code), 'expires' => $this->now + 900, 'attempts' => 0];
        unset($session['report_verified']);
        $message = "Your sedicivalvole email verification code is: " . $code . "\r\n\r\nThis code expires in 15 minutes and allows this browser to send your Travel Report to this address.\r\nIf you did not request it, ignore this message. No report has been sent.\r\n";
        $accepted = ($this->mailer)($recipient, 'Your sedicivalvole verification code', $message, "From: sedicivalvole <diagnostics@sedicivalvole.app>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8");
        if (!$accepted) { unset($session['report_challenge']); throw new SessionReportProblem('mail_transport_rejected', 503); }
        return ['ok' => true, 'status' => 'verification_code_accepted', 'expiresInSeconds' => 900];
    }
    public function verifyCode($code, array &$session): array
    {
        $challenge = $session['report_challenge'] ?? null;
        if (!is_array($challenge) || $challenge['expires'] <= $this->now) { unset($session['report_challenge']); throw new SessionReportProblem('verification_expired', 409); }
        if ($challenge['attempts'] >= 5) throw new SessionReportProblem('verification_locked', 429);
        $session['report_challenge']['attempts']++;
        if (!is_string($code) || !preg_match('/^\d{6}$/D', $code) || !hash_equals($challenge['digest'], hash('sha256', $this->sessionId . '|' . $code))) throw new SessionReportProblem('verification_rejected', 422);
        $session['report_verified'] = ['recipient' => $challenge['recipient'], 'expires' => $this->now + 28800];
        unset($session['report_challenge']);
        return ['ok' => true, 'status' => 'recipient_verified', 'recipient' => $challenge['recipient'], 'expiresInSeconds' => 28800];
    }
    public function send(string $recipient, array $snapshot, string $key, string $expectedPdfSha256, array &$session): array
    {
        $recipient = reportRecipient($recipient);
        if (!preg_match('/^[a-zA-Z0-9_-]{16,80}$/D', $key) || !preg_match('/^[a-f0-9]{64}$/D', $expectedPdfSha256)) throw new SessionReportProblem('delivery_rejected');
        $proof = $session['report_verified'] ?? null;
        if (!is_array($proof) || $proof['expires'] <= $this->now || $proof['recipient'] !== $recipient) throw new SessionReportProblem('recipient_verification_required', 403);
        $pdf = reportBuildPdf($snapshot); $pdfHash = hash('sha256', $pdf);
        if (!hash_equals($expectedPdfSha256, $pdfHash)) throw new SessionReportProblem('preview_changed', 409);
        $sendId = hash('sha256', $this->sessionId . '|' . $key);
        $identity = hash('sha256', $recipient . '|' . $pdfHash);
        return $this->locked(function (&$data, $save) use ($sendId, $identity, $pdf, $snapshot, $recipient) {
            $attempts = 0;
            if (isset($data['sends'][$sendId])) {
                $previous = $data['sends'][$sendId];
                if (!hash_equals($previous['identity'], $identity)) throw new SessionReportProblem('idempotency_conflict', 409);
                if ($previous['status'] === 'accepted') return ['ok' => true, 'status' => 'accepted_by_mail_transport', 'replayed' => true];
                if ($previous['status'] === 'pending') throw new SessionReportProblem('delivery_unknown', 409);
                $attempts = $previous['attempts'] ?? 1;
                if ($attempts >= 3) throw new SessionReportProblem('delivery_retry_exhausted', 409);
                if (($previous['retryAt'] ?? 0) > $this->now) throw new SessionReportProblem('retry_later', 429);
            }
            $this->reserve($data, 'report', $recipient, ['global' => [100, 86400], 'ip' => [20, 86400], 'recipient' => [6, 3600]]);
            // Persist the uncertain state before mail: a crashed request must never resend blindly.
            $data['sends'][$sendId] = ['identity' => $identity, 'status' => 'pending', 'attempts' => $attempts + 1, 'retryAt' => $this->now + 30 * ($attempts + 1), 'expires' => $this->now + 86400]; $save();
            $mail = reportBuildMail($pdf, $snapshot, $recipient);
            $accepted = ($this->mailer)($mail['recipient'], $mail['subject'], $mail['message'], $mail['headers']);
            $data['sends'][$sendId]['status'] = $accepted ? 'accepted' : 'rejected'; $save();
            if (!$accepted) throw new SessionReportProblem('mail_transport_rejected', 503);
            return ['ok' => true, 'status' => 'accepted_by_mail_transport', 'replayed' => false];
        });
    }
}

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(404); exit; }
