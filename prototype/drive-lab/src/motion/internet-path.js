// Public discovery service only. STUN sees the connecting IP, not sensor values.
// An authenticated TURN service is a separate deployment concern.
export const MOTION_INTERNET_ICE = Object.freeze([{ urls: 'stun:stun.cloudflare.com:3478' }]);

// Diagnostics describe only the selected candidate category, never its address.
export function selectedCandidateKind(stats) {
  let pair = null;
  stats.forEach(report => {
    if (report.type === 'transport' && report.selectedCandidatePairId) pair = stats.get(report.selectedCandidatePairId) ?? pair;
  });
  if (!pair) stats.forEach(report => {
    if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) pair = report;
  });
  if (!pair) return 'unknown';
  const types = [stats.get(pair.localCandidateId)?.candidateType, stats.get(pair.remoteCandidateId)?.candidateType];
  return types.includes('relay') ? 'relay' : types.includes('srflx') || types.includes('prflx') ? 'internet' : types.every(type => type === 'host') ? 'local' : 'unknown';
}
