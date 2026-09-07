import processorUrl from "./procedural-processor.js?audio-worklet";
const modules = new WeakMap();
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
  let ready = modules.get(context);
  if (!ready) {
    ready = context.audioWorklet.addModule(processorUrl).catch(error => { modules.delete(context); throw error; });
    modules.set(context, ready);
  }
  await abortableEnginePreparation(ready, signal);
  const source = new AudioWorkletNode(context, "sedicivalvole-engine", { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: configuration });
  const gain = context.createGain(); gain.gain.value = 0;
  source.connect(gain).connect(destination);
  let stopped = false;
  return { source, gain, params: source.parameters,
    stop() { if (stopped) return; stopped = true; source.onprocessorerror = null; source.port.postMessage("dispose"); source.disconnect(); gain.disconnect(); source.port.close(); },
  };
}
