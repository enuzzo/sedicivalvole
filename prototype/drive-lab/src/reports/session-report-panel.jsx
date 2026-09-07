import { useEffect, useMemo, useRef, useState } from 'react';
import { createSessionReportSnapshot, normalizeReportRecipient, readReportRecipient, REPORT_RECIPIENT_KEY, sessionReportFilename } from './session-report-model.js';
import './session-report.css';

const ENDPOINT = '/api/session-report.php';
const errors = {
  recipient_verification_required: 'Verify this email address before sending the report.',
  verification_rejected: 'That code is invalid. Check the six digits and try again.',
  verification_expired: 'The code expired. Request a new one.',
  verification_locked: 'Too many incorrect codes. Wait, then request a new one.',
  rate_limited: 'Please wait before trying again. Your prepared PDF is still available.',
  preview_changed: 'The report renderer changed. Prepare and review the PDF again.',
  mail_transport_rejected: 'The mail service did not accept this request. You can retry or download the PDF.',
  retry_later: 'Wait at least 30 seconds before retrying this delivery. The PDF remains available.',
  delivery_unknown: 'This delivery has an uncertain result. Check your inbox; it will not be sent again automatically.',
  delivery_retry_exhausted: 'The delivery retry limit has been reached. Download the PDF instead.',
};

export default function SessionReportPanel({ source, onClose }) {
  const [includeRoute, setIncludeRoute] = useState(false);
  const [recipient, setRecipient] = useState(() => { try { return readReportRecipient(window.localStorage); } catch { return ''; } });
  const [code, setCode] = useState('');
  const [verification, setVerification] = useState(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [prepared, setPrepared] = useState(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [accepted, setAccepted] = useState(false);
  const operationRef = useRef(null);
  const mountedRef = useRef(true);
  const preparedRef = useRef(null);
  const sendKeyRef = useRef(null);
  const backRef = useRef(null);
  const isVerified = Boolean(verification && verification.recipient === normalizeReportRecipient(recipient)
    && verification.expiresAt > Date.now());
  const selection = useMemo(() => {
    try { return { snapshot: createSessionReportSnapshot({ ...source, includeRoute }) }; }
    catch (error) { return { error: error.message }; }
  }, [source, includeRoute]);
  const { snapshot } = selection;
  const clearPreview = () => {
    if (preparedRef.current) URL.revokeObjectURL(preparedRef.current.url);
    preparedRef.current = null; setPrepared(null); setAccepted(false); sendKeyRef.current = null;
  };
  const perform = async (action, data = {}) => {
    if (operationRef.current) return;
    const controller = new AbortController(); operationRef.current = controller;
    const current = () => mountedRef.current && operationRef.current === controller && !controller.signal.aborted;
    setBusy(action); setNotice(action === 'verification-status' ? 'Checking email verification…' : '');
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', credentials: 'same-origin', signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...data }) });
      if (!response.ok || (action !== 'preview' && !response.headers.get('Content-Type')?.includes('application/json'))) {
        const result = await response.json().catch(() => ({}));
        if (!current()) return;
        if (result.status === 'recipient_verification_required') { setVerification(null); setCodeRequested(false); }
        if (['verification_expired', 'verification_locked'].includes(result.status)) setCodeRequested(false);
        throw new Error(errors[result.status] || `The request failed (${response.status}). Please retry.`);
      }
      if (action === 'preview') {
        if (!response.headers.get('Content-Type')?.includes('application/pdf')) throw new Error('The server did not return a PDF.');
        const blob = await response.blob();
        if (blob.size > 2000000) throw new Error('The report exceeds its size limit.');
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()))].map(v => v.toString(16).padStart(2, '0')).join('');
        if (!current()) return;
        if (hash !== response.headers.get('X-Report-SHA256')) throw new Error('The downloaded report could not be verified. Please retry.');
        clearPreview();
        const result = { blob, hash, url: URL.createObjectURL(blob), snapshot: data.snapshot };
        preparedRef.current = result; setPrepared(result);
        setNotice('Ready. Review the PDF before downloading or sending.');
      } else {
        const result = await response.json();
        if (!current()) return;
        if (!result.ok) throw new Error(errors[result.status] || 'The request was not accepted.');
        if (action === 'request-code') { setCodeRequested(true); setVerification(null); setNotice('Verification code requested. Check your email.'); }
        if (action === 'verification-status' || action === 'verify-code') {
          const restored = typeof result.recipient === 'string' && result.recipient && Number.isFinite(result.expiresInSeconds)
            && result.expiresInSeconds > 0 ? { recipient: normalizeReportRecipient(result.recipient),
              expiresAt: Date.now() + Math.min(result.expiresInSeconds, 28800) * 1000 } : null;
          setVerification(restored); setCode(''); setCodeRequested(false);
          setNotice(restored ? 'Email address verified for this browser session.' : '');
        }
        if (action === 'send') { setAccepted(true); setNotice('Accepted by mail transport. Inbox delivery is not yet confirmed.'); }
      }
    } catch (error) {
      if (mountedRef.current && operationRef.current === controller) setNotice(action === 'verification-status'
        ? 'Email verification could not be restored. Verify the address again before sending.'
        : error.name === 'AbortError' ? 'The request timed out. A send may already have been accepted; Retry uses the same delivery key.' : error.message || 'Connection unavailable. Please retry.');
    } finally { clearTimeout(timeout); if (operationRef.current === controller) { operationRef.current = null; if (mountedRef.current) setBusy(''); } }
  };
  useEffect(() => {
    mountedRef.current = true;
    backRef.current?.focus({ preventScroll: true });
    void perform('verification-status');
    return () => { mountedRef.current = false; operationRef.current?.abort(); operationRef.current = null;
      if (preparedRef.current) URL.revokeObjectURL(preparedRef.current.url); preparedRef.current = null; };
  }, []);
  useEffect(() => {
    if (!verification) return;
    const timeout = setTimeout(() => setVerification(current => current === verification ? null : current),
      Math.max(0, verification.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [verification]);
  const updateRecipient = value => {
    setRecipient(value); setCodeRequested(false); setAccepted(false); sendKeyRef.current = null;
    try { window.localStorage.setItem(REPORT_RECIPIENT_KEY, value.slice(0, 254)); } catch { /* Sending does not require persistent storage. */ }
  };
  return <>
    <header className="stats-heading"><div><small>SESSION EXPORT</small><h2 id="stats-title">Travel Report</h2></div><button ref={backRef} onClick={onClose}>Back to Stats</button></header>
    <div className="report-scroll">
      <p>A frozen snapshot of this session: journey totals, graphs and a technical appendix. Preparing the first preview needs a connection; the prepared download stays available if email or connectivity fails.</p>
      <label className="report-route"><input type="checkbox" checked={includeRoute} disabled={Boolean(busy)} onChange={e => { setIncludeRoute(e.target.checked); clearPreview(); setNotice(''); }} />Include precise route</label>
      <p className="report-disclosure">{includeRoute ? 'The preview request and optional email will include the route coordinates. Technical diagnostics remain coordinate-free.' : 'Precise route coordinates are excluded from the preview and email.'} The report is generated on the server without a trip archive.</p>
      {selection.error ? <p role="alert">{selection.error}</p> : <button disabled={Boolean(busy)} onClick={() => void perform('preview', { snapshot })}>{busy === 'preview' ? 'Preparing PDF…' : prepared ? 'Prepare again' : 'Prepare PDF preview'}</button>}
      {prepared ? <>
        <div className="report-downloads"><a href={prepared.url} download={sessionReportFilename(prepared.snapshot)}>Download PDF</a><a href={prepared.url} target="_blank" rel="noopener">Open PDF</a><span>{Math.round(prepared.blob.size / 1024)} KB · {prepared.snapshot.includeRoute ? 'Route included' : 'No precise route'}</span></div>
        <object className="report-preview" data={prepared.url} type="application/pdf" aria-label="Travel Report PDF preview"><p>This browser cannot embed a PDF. Use Open PDF to review it.</p></object>
        <form className="report-email" onSubmit={event => { event.preventDefault(); if (!isVerified) return; sendKeyRef.current ??= crypto.randomUUID(); void perform('send', { recipient: recipient.trim(), snapshot: prepared.snapshot, expectedPdfSha256: prepared.hash, idempotencyKey: sendKeyRef.current }); }}>
          <h3>Email this report</h3>
          <label>Email address<input type="email" required maxLength={254} autoComplete="email" value={recipient} disabled={Boolean(busy)} onChange={e => updateRecipient(e.target.value)} /></label>
          <p>The address is remembered on this device until Reset Saved State. Verify it once for this browser session before sending.</p>
          {isVerified ? <button type="submit" disabled={Boolean(busy) || accepted}>{accepted ? 'Accepted by mail transport' : busy === 'send' ? 'Sending…' : 'Send reviewed PDF'}</button> : <button type="button" disabled={Boolean(busy) || !recipient.trim()} onClick={e => { if (e.currentTarget.form.reportValidity()) void perform('request-code', { recipient: recipient.trim() }); }}>{busy === 'request-code' ? 'Requesting code…' : 'Email verification code'}</button>}
          {codeRequested && !isVerified ? <div className="report-code"><label>Six-digit code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} disabled={Boolean(busy)} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label><button type="button" disabled={Boolean(busy) || code.length !== 6} onClick={() => void perform('verify-code', { code })}>{busy === 'verify-code' ? 'Verifying…' : 'Verify code'}</button></div> : null}
        </form>
      </> : null}
      <p role="status" aria-live="polite">{notice}</p>
    </div>
  </>;
}
