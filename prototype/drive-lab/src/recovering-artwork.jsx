import { useEffect, useState } from "react";
import { createArtworkRecovery } from "./artwork-recovery.js";

export function useRecoveringArtwork(url) {
  const [result, setResult] = useState({ url: null, status: "idle", src: null });
  useEffect(() => {
    if (!url) return;
    const recovery = createArtworkRecovery({ url, makeImage: () => new Image(),
      now: () => performance.now(), schedule: (fn, delay) => window.setTimeout(fn, delay),
      cancel: timer => window.clearTimeout(timer),
      canRetry: () => navigator.onLine !== false && document.visibilityState !== "hidden",
      onState: next => setResult({ ...next, url }),
    });
    const wake = () => {
      recovery.wake();
      if (navigator.onLine !== false && document.visibilityState !== "hidden") {
        setResult(current => current.url === url && current.status === "ready"
          ? { ...current, revision: (current.revision ?? 0) + 1 } : current);
      }
    };
    window.addEventListener("online", wake); window.addEventListener("offline", wake);
    document.addEventListener("visibilitychange", wake);
    return () => {
      recovery.dispose(); window.removeEventListener("online", wake); window.removeEventListener("offline", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [url]);
  return result.url === url ? result : { status: "idle", src: null };
}

export function RecoveringArtwork({ src, fallback = "16", className = "", width, height }) {
  const artwork = useRecoveringArtwork(src);
  return artwork.src
    ? <img src={artwork.src} alt="" width={width} height={height} className={className} />
    : <span className={`recovering-artwork ${className}`} style={{ width, height }} aria-hidden="true">{fallback}</span>;
}
