/**
 * Insert an AudioWorklet in a serial route while retaining a synchronous
 * direct bypass. If its processor dies, reconnect the direct route before
 * removing the failed node so both scores cannot be silenced by an optional
 * effect.
 */
export function installBypassableSerialProcessor({
  source,
  processor,
  destination,
  onProcessorError,
}) {
  let active = true;
  processor.connect(destination);
  source.connect(processor);
  source.disconnect(destination);

  const bypass = (event) => {
    if (!active) return false;
    active = false;
    source.connect(destination);
    try { source.disconnect(processor); } catch {}
    try { processor.disconnect(); } catch {}
    processor.onprocessorerror = null;
    onProcessorError?.(event);
    return true;
  };
  processor.onprocessorerror = bypass;

  return {
    bypass,
    destroy() {
      active = false;
      processor.onprocessorerror = null;
      try { source.disconnect(processor); } catch {}
      try { processor.disconnect(); } catch {}
    },
  };
}
