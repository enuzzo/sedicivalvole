/** Bounded non-trickle gathering. Never export addresses or SDP to diagnostics. */
export function waitForMotionIce(pc, { timeoutMs = 10000, cleanups = new Set(), onEvidence = () => {} } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const candidates = () => (pc.localDescription?.sdp?.match(/^a=candidate:/gm) ?? []).length;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer); clearInterval(poll);
      pc.removeEventListener('icegatheringstatechange', changed);
      pc.removeEventListener('icecandidate', candidate);
      cleanups.delete(cancel);
      onEvidence({ iceCandidates: candidates(), iceComplete: pc.iceGatheringState === 'complete' });
      if (error) reject(error); else resolve();
    };
    const changed = () => { if (pc.iceGatheringState === 'complete') finish(candidates() ? null : new Error('ice_no_candidates')); };
    const candidate = event => { if (event.candidate === null) changed(); };
    const cancel = () => finish(new Error('closed'));
    const timer = setTimeout(() => {
      // Some embedded browsers retain "gathering" after usable host candidates
      // exist. Their current SDP is usable; a candidate-free offer is not.
      finish(candidates() ? null : new Error('ice_no_candidates'));
    }, timeoutMs);
    const poll = setInterval(changed, Math.min(100, timeoutMs));
    cleanups.add(cancel);
    pc.addEventListener('icegatheringstatechange', changed);
    pc.addEventListener('icecandidate', candidate);
    changed();
  });
}
