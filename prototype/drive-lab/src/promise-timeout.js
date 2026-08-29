export class ReadinessTimeoutError extends Error {
  constructor(label, timeoutMs) {
    super(`${label} timed out after ${timeoutMs} ms`);
    this.name = "ReadinessTimeoutError";
    this.code = "READINESS_TIMEOUT";
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Bound an external readiness promise without leaving a late rejection
 * unhandled. Timer injection keeps browser lifecycle behavior deterministic in
 * tests and lets callers abort an underlying request when the deadline wins.
 */
export function withReadinessTimeout(promise, {
  label,
  timeoutMs,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
  onTimeout,
}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = schedule(() => {
      if (settled) return;
      settled = true;
      onTimeout?.();
      reject(new ReadinessTimeoutError(label, timeoutMs));
    }, timeoutMs);
    Promise.resolve(promise).then(
      (value) => {
        if (settled) return;
        settled = true;
        cancel(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        cancel(timer);
        reject(error);
      },
    );
  });
}
