import { useCallback, useEffect, useRef, useState } from "react";
import { createEngineMotion } from "./motion.js";
import { useEngine } from "./use-engine.js";
import { EngineTelemetry } from "./telemetry-field.jsx";

/** Protected tuning surface. Manual selection is deliberately absent from the public mode. */
export function EngineLab({ audioRef, prepareAudio }) {
  const [active, setActive] = useState(false);
  const [profile, setProfile] = useState("mono");
  const [speed, setSpeed] = useState(0);
  const [input, setInput] = useState("auto");
  const [transmission, setTransmission] = useState("AUTO");
  const [notice, setNotice] = useState("");
  const motion = useRef(createEngineMotion());
  const evidence = useRef({ speed, input }); evidence.current = { speed, input };
  const events = useRef([]);
  const onEvent = useCallback((type, detail) => { events.current = [...events.current.slice(-99), { type, ...detail }]; }, []);
  const geaps = useEngine({ active, muted: false, profileId: profile, audioRef, motion: motion.current, onEvent, allowManual: true });
  const release = useCallback(() => geaps.runtimeRef.current?.releaseRev(), [geaps.runtimeRef]);
  useEffect(() => {
    const timer = setInterval(() => motion.current.observe({ source: "Lab", rawSpeedKmh: evidence.current.speed,
      receivedMs: performance.now(), driveInput: evidence.current.input, brakeHeld: evidence.current.input === "brake" }), 100);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { geaps.runtimeRef.current?.setTransmissionMode(transmission); }, [transmission, geaps.runtimeRef, geaps.snapshot.status]);
  useEffect(() => () => { audioRef.current?.setMuted(true); audioRef.current?.setSourceMode("flux"); }, [audioRef]);
  const start = async () => {
    try { await prepareAudio(); motion.current.reset("lab-start"); setActive(true); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  return <section className="engine-lab">
    <div className="engine-lab-controls">
      <button type="button" onClick={() => active ? setActive(false) : void start()}>{active ? "STOP ENGINE" : "START ENGINE"}</button>
      <label>Speed <input aria-label="Engine test speed" type="range" min="0" max="180" step="1" value={speed} onChange={event => setSpeed(Number(event.target.value))} /><output>{speed} km/h</output></label>
      <label>Drive input <select aria-label="Drive input" value={input} onChange={event => setInput(event.target.value)}><option value="auto">Inferred</option><option value="accelerator">Accelerator</option><option value="regen">Lift / regen</option><option value="brake">Brake</option></select></label>
      <label>Transmission <select aria-label="Transmission" value={transmission} onChange={event => setTransmission(event.target.value)}><option>AUTO</option><option>MANUAL</option></select></label>
      {transmission === "MANUAL" ? <div>{[1,2,3,4,5,6].map(gear => <button type="button" key={gear} onClick={() => setNotice(geaps.runtimeRef.current?.requestGear(gear) ? "Gear requested" : "Gear rejected: check speed, signal and shift state")}>{gear}</button>)}</div> : null}
      <p>PHYS: 0.25 m wheel radius · donor gear and final-drive ratios. TUNING: RPM thresholds, shift duration and mix. CAL: GPS age ≤ 1.8 s; exact standstill requires two observations and 350 ms. Drive response is an inference, not a pedal sensor.</p>
      {notice ? <p role="status">{notice}</p> : null}
      <details><summary>Engine diagnostics / latest 100 events</summary><pre>{JSON.stringify({ ...geaps.snapshot, evidence: motion.current.snapshot(performance.now()), events: events.current }, null, 2)}</pre></details>
    </div>
    <div className="engine-lab-stage"><EngineTelemetry state={geaps.snapshot} profileId={profile} onProfile={setProfile} speed={speed} onRev={() => geaps.runtimeRef.current?.setRevHeld(true)} onRelease={release} /></div>
  </section>;
}
