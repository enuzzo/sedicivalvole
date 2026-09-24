import { useRef } from "react";
import { useOutsideDismiss } from "../ui/use-outside-dismiss.js";

export function GpsHelpPopover({ open, status, accuracy, onClose, onRetry, onDemo }) {
  const ref = useRef(null);
  useOutsideDismiss(ref, open, onClose);
  if (!open) return null;
  return (
    <aside
      ref={ref}
      id="gps-help-popover"
      className="gps-help-popover"
      role="dialog"
      aria-modal="false"
      aria-labelledby="gps-help-title"
    >
      <div className="gps-help-heading">
        <div><small>ATLAS LOCATION</small><strong id="gps-help-title">GPS needs attention</strong></div>
        <button type="button" onClick={onClose} aria-label="Close GPS help">CLOSE</button>
      </div>
      <dl>
        <div><dt>STATUS</dt><dd>{status}</dd></div>
        <div><dt>ACCURACY</dt><dd>{accuracy == null ? "unavailable" : `±${accuracy} m`}</dd></div>
      </dl>
      <p>
        Open this site's permissions in the Tesla browser, allow Location, then
        return here and retry. Menu wording can vary with vehicle software.
      </p>
      <div className="gps-help-actions">
        <button type="button" onClick={onRetry}>RETRY LOCATION</button>
        <button type="button" onClick={onDemo}>EXPLORE MILAN DEMO</button>
      </div>
      <small className="gps-help-privacy">Position stays in this ATLAS session and never enters the session report.</small>
    </aside>
  );
}
