const prepared = new WeakMap();
const HISTOGRAM_BINS = 4096;
// Browser resampling can overshoot full-scale PCM slightly; retain decoded headroom.
const MAX_SOURCE_PEAK = 2;
const MAX_STEP = MAX_SOURCE_PEAK * 2;
const BLEND_SECONDS = 0.01;
// Empirical outlier gate calibrated on the admitted bank at 48 and 44.1 kHz.
// Resampling changes edge/interior ratios; this is not an acoustic constant.
const OUTLIER_RATIO = 3.25;
const MIN_WRAP_STEP = 0.08;

/** Repair only exceptional decoded loop seams; original encoded assets are untouched. */
export function prepareEngineLoopSeam(buffer) {
  if (prepared.has(buffer)) return prepared.get(buffer);
  const { length, sampleRate, numberOfChannels } = buffer;
  const blendFrames = Math.round(sampleRate * BLEND_SECONDS);
  const result = { applied: false, loopStart: 0, loopEnd: length / sampleRate, blendFrames: 0, channels: [] };
  const finish = reason => {
    result.reason = reason;
    prepared.set(buffer, result);
    return result;
  };
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000
    || !Number.isInteger(length) || length < blendFrames * 4
    || !Number.isInteger(numberOfChannels) || numberOfChannels < 1 || numberOfChannels > 8) return finish("unsupported-buffer");
  const hist = new Uint32Array(HISTOGRAM_BINS);
  const measured = [];
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    if (data.length !== length) return finish("invalid-channel-length");
    hist.fill(0);
    let squares = 0, headSquares = 0, peak = 0;
    for (let index = 0; index < length; index++) {
      const value = data[index];
      if (!Number.isFinite(value) || Math.abs(value) > MAX_SOURCE_PEAK) return finish("unbounded-source");
      squares += value * value;
      if (index < blendFrames) headSquares += value * value;
      peak = Math.max(peak, Math.abs(value));
      if (index) {
        const step = Math.abs(value - data[index - 1]);
        hist[Math.min(HISTOGRAM_BINS - 1, Math.floor(step / MAX_STEP * HISTOGRAM_BINS))]++;
      }
    }
    const rank = Math.ceil((length - 1) * .999);
    let count = 0, bin = 0;
    while (bin < HISTOGRAM_BINS - 1 && count + hist[bin] < rank) count += hist[bin++];
    // Use the bin's upper edge so quantization cannot make the gate more permissive.
    const p999Upper = (bin + 1) / HISTOGRAM_BINS * MAX_STEP;
    const wrapStep = Math.abs(data[0] - data[length - 1]);
    const outlier = wrapStep > MIN_WRAP_STEP && wrapStep > OUTLIER_RATIO * p999Upper;
    measured.push({ data, squares, headSquares, peak, p999Upper, wrapStep, outlier });
  }
  result.channels = measured.map(({ peak, p999Upper, wrapStep, outlier, squares }) => ({
    originalPeak: peak, interiorStepP999Upper: p999Upper, originalWrapStep: wrapStep, outlier,
    originalRms: Math.sqrt(squares / length),
  }));
  if (!measured.some(channel => channel.outlier)) return finish("ordinary-boundary");
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const { data, squares, headSquares, peak } = measured[channel];
    let changedEnergy = 0, blendPeak = 0;
    for (let index = 0; index < blendFrames; index++) {
      const offset = length - blendFrames + index;
      const original = data[offset];
      const weight = .5 - .5 * Math.cos(Math.PI * index / (blendFrames - 1));
      // Head and tail never overlap; complementary gains prevent an equal-power boost.
      data[offset] = original * (1 - weight) + data[index] * weight;
      changedEnergy += data[offset] ** 2 - original ** 2;
      blendPeak = Math.max(blendPeak, Math.abs(data[offset]));
    }
    Object.assign(result.channels[channel], {
      preparedWrapStep: Math.abs(data[blendFrames] - data[length - 1]),
      steadyLoopRms: Math.sqrt(Math.max(0, squares + changedEnergy - headSquares) / (length - blendFrames)),
      peakDidNotIncrease: blendPeak <= peak,
    });
  }
  result.applied = true;
  result.blendFrames = blendFrames;
  result.loopStart = blendFrames / sampleRate;
  return finish("outlier-wrap-repaired");
}
