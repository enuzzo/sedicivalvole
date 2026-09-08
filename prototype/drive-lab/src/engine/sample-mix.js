/** Smooth, constant-power selection with less overlap of independent recordings.
 * Squaring the sine/cosine weights favors the dominant loop away from the
 * midpoint; normalization preserves expected energy, without a gain dip.
 * This reduces competing layers, not reverberation already in a recording.
 */
export function focusedCrossfade(value, start, end) {
  const position = Math.max(0, Math.min(1, (value - start) / (end - start)));
  const high = Math.sin(position * Math.PI / 2) ** 2;
  const low = Math.cos(position * Math.PI / 2) ** 2;
  const energy = Math.hypot(high, low);
  return { gain1: high / energy, gain2: low / energy };
}

// Exact earlier host weights, available only through a protected LAB profile.
export function referenceCrossfade(value, start, end) {
  const position = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return { gain1: Math.cos((1 - position) * .5 * Math.PI), gain2: Math.cos(position * .5 * Math.PI) };
}
