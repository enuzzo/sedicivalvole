/**
 * Host texture pitch follows RPM ratios, bounded to two octaves either way.
 * Donor reference RPMs are nominal, not independently calibrated recordings.
 * Mono's common 3400 anchor is authored tuning: its four donor 1000 labels
 * cannot establish recording RPM. The separate firing voice owns crank timing.
 */
export function engineSampleCents(rpm, asset, profile) {
  const reference = profile?.id === "mono" ? 3400 : asset.rpm;
  if (!Number.isFinite(rpm) || !Number.isFinite(reference) || reference <= 0) return 0;
  return Math.max(-2400, Math.min(2400, 1200 * Math.log2(Math.max(600, rpm) / reference)));
}
