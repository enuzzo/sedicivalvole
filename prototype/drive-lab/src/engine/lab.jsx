import { useCallback, useEffect, useRef, useState } from "react";
import { createEngineMotion } from "./motion.js";
import { useEngine } from "./use-engine.js";
import { EngineTelemetry } from "./telemetry-field.jsx";
import { ENGINE_PROFILES } from "./profiles.js";
import { comparisonProfile, comparisonSpeed, COMPARISON_SECONDS, COMPARISON_CALIBRATIONS,
  COMPARISON_STORAGE_KEY, readComparisonNotes, makeComparisonNote } from "./lab-comparison.js";

/** Protected tuning surface. Manual selection is deliberately absent from the public mode. */
function EngineBench({ audioRef, prepareAudio, profile, onProfile, calibration, autoReplay, onProgress, children }) {
  const [active, setActive] = useState(autoReplay);
  const [routeMode, setRouteMode] = useState(autoReplay);
  const [speed, setSpeed] = useState(0);
  const [input, setInput] = useState("auto");
  const [transmission, setTransmission] = useState("AUTO");
  const [notice, setNotice] = useState("");
  const motion = useRef(createEngineMotion());
  const evidence = useRef({ speed, input }); evidence.current = { speed, input };
  const events = useRef([]);
  const routeStart = useRef(null), lastRouteTick = useRef(null);
  const resolveProfile = useCallback(id => comparisonProfile(id, calibration), [calibration]);
  const onEvent = useCallback((type, detail) => { events.current = [...events.current.slice(-99), { type, ...detail }]; }, []);
  const geaps = useEngine({ active, muted: false, profileId: profile, audioRef, motion: motion.current, onEvent, allowManual: true, resolveProfile });
  const current = useRef(null); current.current = { active, snapshot: geaps.snapshot };
  const release = useCallback(() => geaps.runtimeRef.current?.releaseRev(), [geaps.runtimeRef]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (routeMode && current.current.active) {
        if (document.visibilityState === "hidden" || audioRef.current?.context?.state !== "running") {
          setActive(false); setNotice("Replay stopped while inactive. Play A or B to restart."); return;
        }
        if (routeStart.current != null && (current.current.snapshot.status !== "ready" || (lastRouteTick.current != null && performance.now() - lastRouteTick.current > 1200))) {
          setActive(false); setNotice("Replay interrupted. Play A or B to restart."); return;
        }
        if (!current.current.snapshot.prepared) return;
        lastRouteTick.current = performance.now();
        routeStart.current ??= performance.now();
        const elapsed = Math.min(COMPARISON_SECONDS, (performance.now() - routeStart.current) / 1000);
        const roadSpeed = comparisonSpeed(elapsed);
        evidence.current = { speed: roadSpeed, input: "auto" }; setSpeed(roadSpeed);
        onProgress(calibration, Math.floor(elapsed));
        if (elapsed >= COMPARISON_SECONDS) { setActive(false); setNotice("Replay complete. Save your preference below."); }
      }
      motion.current.observe({ source: "Lab", rawSpeedKmh: evidence.current.speed,
        receivedMs: performance.now(), driveInput: evidence.current.input, brakeHeld: evidence.current.input === "brake" });
    }, 100);
    const hidden = () => {
      if (routeMode && document.visibilityState === "hidden") {
        setActive(false); setNotice("Replay stopped while hidden. Play A or B to restart.");
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", hidden); };
  }, [routeMode, audioRef, calibration, onProgress]);
  useEffect(() => { geaps.runtimeRef.current?.setTransmissionMode(transmission); }, [transmission, geaps.runtimeRef, geaps.snapshot.status]);
  const start = async () => {
    try { await prepareAudio(); setRouteMode(false); motion.current.reset("lab-start"); setActive(true); setNotice(""); }
    catch (error) { setNotice(String(error?.message || error)); }
  };
  return <section className="engine-lab">
    <div className="engine-lab-controls">
      {children}
      <p aria-live="polite">{active ? (geaps.snapshot.prepared ? `${COMPARISON_CALIBRATIONS[calibration]} · ${Math.round(speed)} km/h` : "Preparing audio…") : notice || "Ready to compare"}</p>
      <button type="button" disabled={!active} onClick={() => { setActive(false); setNotice("Replay stopped. Play A or B to restart."); }}>STOP AUDIO</button>
      <details className="engine-manual-bench"><summary>Manual bench / diagnostics</summary>
      <button type="button" onClick={() => active ? setActive(false) : void start()}>{active ? "STOP ENGINE" : "START ENGINE"}</button>
      <label>Speed <input aria-label="Engine test speed" type="range" min="0" max="180" step="1" value={speed} disabled={routeMode && active} onChange={event => setSpeed(Number(event.target.value))} /><output>{Math.round(speed)} km/h</output></label>
      <label>Drive input <select aria-label="Drive input" disabled={routeMode && active} value={input} onChange={event => setInput(event.target.value)}><option value="auto">Inferred</option><option value="accelerator">Accelerator</option><option value="regen">Lift / regen</option><option value="brake">Brake</option></select></label>
      <label>Transmission <select aria-label="Transmission" disabled={routeMode && active} value={transmission} onChange={event => setTransmission(event.target.value)}><option>AUTO</option><option>MANUAL</option></select></label>
      {transmission === "MANUAL" ? <div>{[1,2,3,4,5,6].map(gear => <button type="button" key={gear} onClick={() => setNotice(geaps.runtimeRef.current?.requestGear(gear) ? "Gear requested" : "Gear rejected: check speed, signal and shift state")}>{gear}</button>)}</div> : null}
      <p>Virtual 0.32 m wheel radius · original road ratios · 130 km/h acoustic ceiling. Speed and drive input here are simulated. Public drive response is inferred, not measured pedal or Tesla gearbox data.</p>
      <details><summary>Engine diagnostics / latest 100 events</summary><pre>{JSON.stringify({ ...geaps.snapshot, evidence: motion.current.snapshot(performance.now()), events: events.current }, null, 2)}</pre></details>
      </details>
    </div>
    <div className="engine-lab-stage"><EngineTelemetry state={geaps.snapshot} profileId={profile} onProfile={onProfile} speed={speed} onRev={() => !routeMode && geaps.runtimeRef.current?.setRevHeld(true)} onRelease={release} /></div>
  </section>;
}

/** Selected A/B listening direction; one engine runtime and one shared context. */
export function EngineLab({ audioRef, prepareAudio }) {
  const [profile, setProfile] = useState("mono"), [calibration, setCalibration] = useState("B");
  const [serial, setSerial] = useState(0), [replay, setReplay] = useState(false);
  const [listened, setListened] = useState({ A: 0, B: 0 });
  const [preference, setPreference] = useState(""), [note, setNote] = useState("");
  const [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const pending = useRef(false), mounted = useRef(true), drafts = useRef({});
  const [notes, setNotes] = useState(() => { try { return readComparisonNotes(window.localStorage); } catch { return []; } });
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; audioRef.current?.setMuted(true); audioRef.current?.setSourceMode("flux"); }; }, [audioRef]);
  const onProgress = useCallback((key, seconds) => setListened(current => current[key] === seconds ? current : { ...current, [key]: seconds }), []);
  const chooseProfile = id => {
    if (pending.current) return;
    drafts.current[profile] = { note, preference, listened };
    const draft = drafts.current[id];
    setProfile(id); setReplay(false); setSerial(value => value + 1);
    setListened(draft?.listened ?? { A: 0, B: 0 }); setPreference(draft?.preference ?? ""); setNote(draft?.note ?? "");
  };
  const play = async key => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try {
      await prepareAudio();
      if (!mounted.current) return;
      setCalibration(key); setListened(current => ({ ...current, [key]: 0 }));
      setReplay(true); setSerial(value => value + 1); setNotice("");
    } catch { if (mounted.current) setNotice("Audio could not start. Please try again."); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const save = () => {
    try {
      const entry = makeComparisonNote({ profile, preference, note, listened,
        build: typeof __APP_BUILD__ === "undefined" ? "local" : __APP_BUILD__, sampleRate: audioRef.current?.context?.sampleRate ?? null });
      const next = [...notes, entry].slice(-60);
      window.localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(next));
      setNotes(next); setNote(""); setNotice("Preference saved on this device.");
    } catch (error) { setNotice(error?.message === "Choose a preference before saving." ? error.message : "Could not save locally. Keep your note and try again."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ schema: "engine-listening-export.v1", notes }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "engine-listening-notes.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <EngineBench key={`${profile}-${serial}`} {...{ audioRef, prepareAudio, profile, calibration, onProgress }} onProfile={chooseProfile} autoReplay={replay}>
    <h2>Engine A/B Listening</h2>
    <p className="engine-comparison-build">Build {typeof __APP_BUILD__ === "undefined" ? "local" : __APP_BUILD__}</p>
    <p>Same 68-second route: city, 80–130 km/h, return. One take at a time, at its original level. No loudness matching.</p>
    <label>Engine <select aria-label="Comparison engine" value={profile} disabled={busy} onChange={event => chooseProfile(event.target.value)}>{ENGINE_PROFILES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <div className="engine-comparison-buttons">{["A", "B"].map(key => <button key={key} type="button" disabled={busy} aria-pressed={replay && calibration === key} onClick={() => void play(key)}>PLAY {key}<small>{COMPARISON_CALIBRATIONS[key]}</small></button>)}</div>
    <p>Listened: A {listened.A}s · B {listened.B}s / {COMPARISON_SECONDS}s each. Replaying starts that take again.</p>
    <details className="engine-listening-notes"><summary>Preference & notes · {notes.length} saved</summary>
      <label>Preference <select aria-label="Listening preference" value={preference} onChange={event => setPreference(event.target.value)}><option value="">Choose…</option><option value="A">A · Reference</option><option value="B">B · Refined</option><option value="tie">No preference</option></select></label>
      <label>What sounds better? <textarea aria-label="Listening note" maxLength={4000} value={note} onChange={event => setNote(event.target.value)} placeholder="Body, clarity, whistle, shifts…" /></label>
      <button type="button" onClick={save}>SAVE PREFERENCE</button>
      <button type="button" onClick={download} disabled={!notes.length}>EXPORT NOTES ({notes.length})</button>
      <p>Saved only on this device, up to 60 entries. Partial listens are recorded honestly. Export to share; nothing is sent automatically.</p>
      {notes.slice(-5).reverse().map((entry, index) => <p key={`${entry.id}-${index}`}><strong>{entry.profile} · {entry.preference === "tie" ? "No preference" : `Preferred ${entry.preference}`}</strong><br />{entry.note || "No written note"}</p>)}
    </details>
    {notice ? <p role="status">{notice}</p> : null}
  </EngineBench>;
}
