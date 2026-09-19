import { useState } from 'react';
import { withReadinessTimeout } from '../promise-timeout.js';
import { resetApplicationCache } from './reset-cache.js';

export function CacheResetControl({ className = '' }) {
  const [state, setState] = useState('idle');
  async function reset() {
    if (state === 'busy') return;
    setState('busy');
    try {
      const result = await withReadinessTimeout(resetApplicationCache(), { label: 'Cache reset', timeoutMs: 10000 });
      setState(result.failed ? 'error' : result.supported ? 'done' : 'unavailable');
    } catch { setState('error'); }
  }
  return <div data-state={state} className={`cache-reset-control ${className}`}>
    <button type="button" disabled={state === 'busy'} onClick={reset}>{state === 'busy' ? 'RESETTING CACHE…' : state === 'error' ? 'RETRY CACHE RESET' : 'RESET APP CACHE'}</button>
    <small role="status">{state === 'done' ? 'App cache cleared. Reload to finish; saved choices stay.' : state === 'error' ? 'Some cache could not be cleared. Retry; saved choices stay.' : state === 'unavailable' ? 'Managed cache is unavailable in this browser.' : 'Static app files only. Saved choices stay.'}</small>
    {state === 'done' && <button type="button" onClick={() => window.location.reload()}>RELOAD APP</button>}
  </div>;
}
