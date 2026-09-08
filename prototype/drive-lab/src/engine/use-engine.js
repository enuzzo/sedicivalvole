import { useEffect, useRef, useState } from "react";

export function useEngine({ active, muted, profileId, audioRef, motion, onEvent, allowManual = false, resolveProfile }) {
  const runtimeRef = useRef(null);
  const [snapshot, setSnapshot] = useState({ status: "idle", rpm: 1000, gear: 1, drive: 0, deceleration: 0, motion: "lost", trustedStationary: false });
  useEffect(() => {
    let cancelled = false, loading = false, moduleRetry = null, attempt = 0;
    const started = performance.now();
    if (!active) { if (runtimeRef.current) { runtimeRef.current.unload(); setSnapshot(runtimeRef.current.getState()); } return; }
    const setup = async () => {
      if (cancelled || loading) return;
      const audio = audioRef.current;
      if (!audio?.context || !audio.engineInput) return;
      loading = true;
      try {
        if (!runtimeRef.current) {
          const { createGeapsRuntime } = await import("./runtime.js");
          if (cancelled) return;
          runtimeRef.current = createGeapsRuntime({ context: audio.context, destination: audio.engineInput, motion, onEvent, allowManual, resolveProfile });
        }
        const runtime = runtimeRef.current;
        runtime.setEnabled(!muted);
        const state = runtime.getState();
        if (!muted && (state.profileId !== profileId || !state.prepared)) await runtime.load(profileId);
        if (!cancelled) setSnapshot(runtime.getState());
      } catch (error) {
        if (!cancelled) {
          const retry = !muted && performance.now() - started < 300000;
          setSnapshot(current => ({ ...current, status: retry ? "retrying" : "error", error: String(error?.message || error) }));
          if (retry) moduleRetry = setTimeout(wake, Math.min(30000, 5000 * 2 ** Math.min(attempt++, 3)));
        }
      } finally { loading = false; }
    };
    const wake = () => {
      clearTimeout(moduleRetry);
      if (cancelled || runtimeRef.current) return;
      if (performance.now() - started >= 300000) { setSnapshot(current => ({ ...current, status: "error" })); return; }
      if (navigator.onLine === false || document.visibilityState === "hidden") moduleRetry = setTimeout(wake, 10000);
      else void setup();
    };
    window.addEventListener("online", wake); document.addEventListener("visibilitychange", wake);
    void setup();
    const timer = setInterval(() => {
      if (runtimeRef.current) setSnapshot(runtimeRef.current.getState());
    }, 100);
    return () => { cancelled = true; clearInterval(timer); clearTimeout(moduleRetry); window.removeEventListener("online", wake); document.removeEventListener("visibilitychange", wake); runtimeRef.current?.setEnabled(false); };
  }, [active, muted, profileId, audioRef, motion, onEvent, allowManual, resolveProfile]);
  useEffect(() => () => runtimeRef.current?.destroy(), []);
  return { snapshot, runtimeRef };
}
