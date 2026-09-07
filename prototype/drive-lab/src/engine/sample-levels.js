const CORE = /^(on|off)_(low|high)$/;

/** Match static loop energy once at decode; retain waveform, pitch and crossfades. */
export function matchEngineLoopLevels(assets) {
  const measured = assets.filter(({ asset }) => CORE.test(asset.role)).map(({ asset, buffer }) => {
    let squares = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const samples = buffer.getChannelData(channel);
      for (let i = 0; i < samples.length; i++) squares += samples[i] ** 2;
    }
    return { asset, rms: Math.sqrt(squares / (buffer.length * buffer.numberOfChannels)) };
  });
  const powered = measured.filter(({ asset }) => asset.role.startsWith("on_"));
  const reference = Math.sqrt(powered.reduce((sum, { asset, rms }) => sum + (rms * (asset.volume ?? 1)) ** 2, 0) / powered.length);
  return new Map(measured.map(({ asset, rms }) => [asset.role, rms > 0.0001 ? Math.min(8, reference / rms) : 0]));
}
