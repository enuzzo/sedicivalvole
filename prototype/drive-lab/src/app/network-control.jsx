import { useRef, useEffect } from "react";
import { useOutsideDismiss } from "../ui/use-outside-dismiss.js";

function networkUiCopy(notice) {
  if (notice?.status === "offline") return "OFFLINE";
  if (["limited", "request-failed"].includes(notice?.status)) return "LIMITED";
  if (notice?.status === "recovered") return "RECOVERED";
  if (notice?.status === "transferring") return "LOADING";
  return "CONNECTED";
}

function networkRateCopy(bytesPerSecond) {
  const value = Math.max(0, Number(bytesPerSecond) || 0);
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} MB/s`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} KB/s`;
  return `${Math.round(value)} B/s`;
}

export function NetworkControl({ notice, history, open, onOpenChange }) {
  const containerRef = useRef(null);
  useOutsideDismiss(containerRef, open, () => onOpenChange(false));
  const triggerRef = useRef(null);
  const width = 248;
  const height = 48;
  const graphPoints = history.length > 1
    ? history.map((sample, index) => {
      const x = index / (history.length - 1) * width;
      const y = height - sample.score * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ")
    : `0,${(height * 0.3).toFixed(1)} ${width},${(height * 0.3).toFixed(1)}`;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      onOpenChange(false);
      triggerRef.current?.focus({ preventScroll: true });
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {

      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onOpenChange, open]);

  return (
    <div className={`network-control${open ? " is-open" : ""}`} ref={containerRef}>
      <button
        ref={triggerRef}
        className={`network-state is-${notice.tone}${notice.status === "transferring" ? " is-loading" : ""}`}
        type="button"
        aria-controls="network-popover"
        aria-expanded={open}
        aria-label={`Network ${networkUiCopy(notice)}. Open 15 minute connection detail.`}
        title={`Network ${networkUiCopy(notice)}`}
        onClick={() => onOpenChange(!open)}
      >
        <span className="network-state-dot" aria-hidden="true" />
      </button>
      {open ? (
        <aside id="network-popover" className="network-popover" role="dialog" aria-modal="false" aria-labelledby="network-popover-title">
          <header>
            <div><small>APPLICATION NETWORK</small><strong id="network-popover-title">{networkUiCopy(notice)}</strong></div>
            <button type="button" onClick={() => onOpenChange(false)}>CLOSE</button>
          </header>
          <dl>
            <div><dt>DOWNLOAD</dt><dd>{networkRateCopy(notice.currentDownloadBytesPerSecond)}</dd></div>
            <div><dt>UPLOAD</dt><dd>{networkRateCopy(notice.currentUploadBytesPerSecond)}</dd></div>
            <div><dt>CONNECTION</dt><dd>{notice.effectiveType?.toUpperCase() || "UNAVAILABLE"}</dd></div>
            <div><dt>LATENCY</dt><dd>{notice.roundTripTimeMs == null ? "UNAVAILABLE" : `${Math.round(notice.roundTripTimeMs)} ms`}</dd></div>
          </dl>
          <figure>
            <figcaption>QUALITY · LAST 15 MIN</figcaption>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Network quality history with ${history.length} retained samples`}>
              <line x1="0" y1={height / 2} x2={width} y2={height / 2} />
              <polyline points={graphPoints} />
            </svg>
          </figure>
          <p>Browser connection hints and traffic observed by this app only.</p>
        </aside>
      ) : null}
    </div>
  );
}
