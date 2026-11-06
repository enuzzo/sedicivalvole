import processorUrl from "./procedural-processor.js?audio-worklet";
import combustionUrl from "./combustion/combustion-processor.js?audio-worklet";
// One registration per context and processor module.
const modules = new WeakMap();
// `model: "combustion"` selects the physically informed synthesizer (./combustion).
const PROCESSORS = Object.freeze({
  procedural: { url: processorUrl, name: "sedicivalvole-engine" },
  combustion: { url: combustionUrl, name: "sedicivalvole-combustion" },
});
export function abortableEnginePreparation(promise, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new Error("Engine preparation cancelled or timed out"));
    promise.then(value => { signal.removeEventListener("abort", abort); resolve(value); }, error => { signal.removeEventListener("abort", abort); reject(error); });
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true });
  });
}
export async function prepareProceduralVoice(context, configuration, destination, signal) {
  if (signal.aborted) throw new Error("Engine preparation cancelled");
  const processor = PROCESSORS[configuration.model ?? "procedural"];
  if (!processor) throw new Error("Unknown Engine voice model");
  let registered = modules.get(context);
  if (!registered) { registered = new Map(); modules.set(context, registered); }
  let ready = registered.get(processor.url);
  if (!ready) {
    ready = context.audioWorklet.addModule(processor.url).catch(error => { registered.delete(processor.url); throw error; });
    registered.set(processor.url, ready);
  }
  await abortableEnginePreparation(ready, signal);
  const source = new AudioWorkletNode(context, processor.name, { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: configuration });
  const gain = context.createGain(); gain.gain.value = 0;
  source.connect(gain).connect(destination);
  let stopped = false;
  return { source, gain, params: source.parameters,
    stop() { if (stopped) return; stopped = true; source.onprocessorerror = null; source.port.postMessage("dispose"); source.disconnect(); gain.disconnect(); source.port.close(); },
  };
}
