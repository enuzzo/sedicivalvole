import { useEffect, useState } from "react";
import { MotionPanel } from "./motion-ui.jsx";

// Only the open drawer observes fast telemetry. Reads use the session's current
// monotonic clock; neither polling nor closing/reopening renews a sample.
export function MotionReceiverPanel({ readSnapshot, ...props }) {
  const [snapshot, setSnapshot] = useState(readSnapshot);
  useEffect(() => {
    let timer;
    const refresh = () => {
      const next = readSnapshot();
      setSnapshot(next);
      // Wake at expiry as well as at the 20 Hz display cadence. Never let the
      // slower App metadata update retain a live number or readiness indicator.
      const untilExpiry = next.dataFresh && Number.isFinite(next.ageUpperMs) ? 251 - next.ageUpperMs : 50;
      timer = setTimeout(refresh, Math.max(1, Math.min(50, untilExpiry)));
    };
    refresh();
    return () => clearTimeout(timer);
  }, [readSnapshot]);
  return <MotionPanel {...props} snapshot={snapshot}/>;
}
