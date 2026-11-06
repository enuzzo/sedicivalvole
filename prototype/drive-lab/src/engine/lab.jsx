import { useCallback, useEffect, useRef, useState } from "react";
import { createEngineMotion } from "./motion.js";
import { useEngine } from "./use-engine.js";
import { ENGINE_CATALOGUE, ENGINE_SAMPLE_VOICES, ENGINE_COMBUSTION_VOICES, isEngineProfile, isCombustionVoice } from "./catalogue.js";
import { comparisonProfile, comparisonSpeed, COMPARISON_SECONDS, comparisonCalibrations,
  COMPARISON_STORAGE_KEY, readComparisonNotes, makeComparisonNote } from "./lab-comparison.js";
import "./lab.css";

// November 6 owner selection: Engine LAB direction A, "Listening Console".
// Choose (left) · Listen & compare (centre) · Your verdict (right), with the
// manual bench and diagnostics tucked under Advanced controls.

const ROUTE_PHASES = Object.freeze([
  { id: "city", label: "CITY", detail: "0–40 km/h", from: 0, to: 24 },
  { id: "highway", label: "HIGHWAY", detail: "80–130 km/h", from: 24, to: 54 },
  { id: "return", label: "RETURN", detail: "Back to 0", from: 54, to: COMPARISON_SECONDS },
]);
const ROUTE_TICKS = Object.freeze([0, 20, 48, COMPARISON_SECONDS]);
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const routePoint = (seconds, width, height) => [seconds / COMPARISON_SECONDS * width, height - comparisonSpeed(seconds) / 130 * (height - 6) - 3];
const ROUTE_PATH = Array.from({ length: COMPARISON_SECONDS + 1 }, (_, second) => routePoint(second, 560, 96))
  .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
const describe = id => ENGINE_CATALOGUE.find(item => item.id === id);

function EngineIcon() {
  return <svg className="elab-icon" viewBox="0 0 48 32" aria-hidden="true"><path d="M8 10h6l3-4h12l3 4h5v4h3v-3h4v12h-4v-3h-3v5l-4 4H17l-5-5H8v-4H4v6H1V10h3v6h4z" /></svg>;
}

function RouteCard({ elapsed, playing }) {
  const progress = Math.min(COMPARISON_SECONDS, Math.max(0, elapsed ?? 0));
  const [x, y] = routePoint(progress, 560, 96);
  const phase = ROUTE_PHASES.find(item => progress >= item.from && progress < item.to) ?? ROUTE_PHASES[2];
  return <section className="elab-route" aria-label="68-second test route">
    <header><strong>68-second test route</strong><span>{clock(progress)} / {clock(COMPARISON_SECONDS)}</span></header>
    <svg viewBox="0 0 560 96" preserveAspectRatio="none" aria-hidden="true">
      <defs><clipPath id="elab-route-done"><rect x="0" y="0" width={x} height="96" /></clipPath></defs>
      <path className="elab-route-line" d={ROUTE_PATH} />
      <path className="elab-route-done" d={`${ROUTE_PATH} L560 96 L0 96 Z`} clipPath="url(#elab-route-done)" />
      <path className="elab-route-progress" d={ROUTE_PATH} clipPath="url(#elab-route-done)" />
      {playing ? <><line className="elab-route-marker" x1={x} x2={x} y1="0" y2="96" /><circle className="elab-route-dot" cx={x} cy={y} r="5" /></> : null}
    </svg>
    <ol className="elab-route-phases">{ROUTE_PHASES.map(item => <li key={item.id} className={playing && item === phase ? "is-current" : ""}
      style={{ flexGrow: item.to - item.from }}><b>{item.label}</b><span>{item.detail}</span></li>)}</ol>
    <div className="elab-route-ticks">{ROUTE_TICKS.map(tick => <span key={tick} style={{ left: `${tick / COMPARISON_SECONDS * 100}%` }}>{clock(tick)}</span>)}</div>
  </section>;
}

function Readout({ snapshot, speed, playing }) {
  const rpm = Math.round(snapshot.rpm ?? 0), drive = Math.round((snapshot.drive ?? 0) * 100), decel = Math.round((snapshot.deceleration ?? 0) * 100);
  const gear = snapshot.singleSpeed ? "—" : snapshot.revving ? "N" : String(snapshot.gear ?? 1);
  return <section className="elab-readout" aria-label="Live engine readout">
    <small className={playing ? "is-live" : ""}>{playing ? "SIMULATED ROUTE · LIVE" : "READOUT · IDLE"}</small>
    <div className="elab-readout-values">
      <div><strong>{rpm.toLocaleString("en-US")}</strong><span>RPM</span><i className="elab-meter"><b style={{ width: `${Math.min(100, rpm / 90)}%` }} /></i><em>0–9,000</em></div>
      <div><strong>{Math.round(speed)}</strong><span>km/h</span></div>
      <div><strong>{gear}</strong><span>GEAR</span><em>1–6</em></div>
    </div>
    <div className="elab-readout-bars">
      <label>Drive <b>{drive}%</b><i className="elab-meter"><b style={{ width: `${drive}%` }} /></i></label>
      <label>Deceleration <b>{decel}%</b><i className="elab-meter"><b style={{ width: `${decel}%` }} /></i></label>
    </div>
  </section>;
}

/** Protected tuning surface. Manual selection is deliberately absent from the public mode. */
function EngineBench({ audioRef, prepareAudio, profile, calibration, autoReplay, onProgress, choose, verdict, transport }) {
  const [active, setActive] = useState(autoReplay);
  const [routeMode, setRouteMode] = useState(autoReplay);
  const [speed, setSpeed] = useState(0);
  const [elapsed, setElapsed] = useState(0);
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
        const seconds = Math.min(COMPARISON_SECONDS, (performance.now() - routeStart.current) / 1000);
        const roadSpeed = comparisonSpeed(seconds);
        evidence.current = { speed: roadSpeed, input: "auto" }; setSpeed(roadSpeed); setElapsed(seconds);
        onProgress(calibration, Math.floor(seconds));
        if (seconds >= COMPARISON_SECONDS) { setActive(false); setNotice("Replay complete. Give your verdict on the right."); }
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
  const playing = active && routeMode;
  const status = active ? (geaps.snapshot.prepared ? (routeMode ? `${transport.labels[calibration]} · ${Math.round(speed)} km/h` : "Manual bench running") : "Preparing audio…") : notice || "Choose A or B to start a take.";
  return <div className="elab-columns">
    <aside className="elab-column elab-choose" aria-label="Choose an engine">{choose}</aside>
    <section className="elab-column elab-listen" aria-label="Listen and compare">
      <h2>Listen &amp; compare</h2>
      <p className="elab-lede">{transport.candidate ? "A is the published Rosso. B is your selected engine." : "A is the earlier Refined voicing. B is the published Full body."}</p>
      <div className="elab-transport">{["A", "B"].map(key => {
        const on = playing && calibration === key;
        return <button key={key} type="button" className={on ? "is-playing" : ""} disabled={transport.busy} aria-pressed={on}
          aria-label={`PLAY ${key} · ${transport.labels[key]}`} onClick={() => void transport.play(key)}>
          <span className="elab-transport-glyph" aria-hidden="true">{on ? "❚❚" : "▶"}</span>
          <span><strong>{on ? `Playing ${key}` : `Play ${key}`}</strong><small>{transport.labels[key]}</small></span>
          {on ? <i className="elab-live-dot" aria-hidden="true" /> : null}
        </button>;
      })}</div>
      <p className="elab-meta">Original levels · No loudness matching · Listened A {transport.listened.A}s · B {transport.listened.B}s</p>
      <RouteCard elapsed={routeMode ? elapsed : 0} playing={playing} />
      <button type="button" className="elab-stop" disabled={!active} onClick={() => { setActive(false); setNotice("Take stopped. Play A or B to restart."); }}>
        <span aria-hidden="true">■</span> STOP AUDIO</button>
      <Readout snapshot={geaps.snapshot} speed={speed} playing={active} />
      <p className="elab-status" aria-live="polite">{status}</p>
    </section>
    <aside className="elab-column elab-verdict" aria-label="Your verdict">{verdict}</aside>
    <footer className="elab-advanced">
      <span>Advanced controls</span>
      <details className="engine-manual-bench"><summary>Manual bench</summary>
        <div className="elab-bench">
          <button type="button" onClick={() => active ? setActive(false) : void start()}>{active ? "STOP ENGINE" : "START ENGINE"}</button>
          <label>Speed <input aria-label="Engine test speed" type="range" min="0" max="180" step="1" value={speed} disabled={routeMode && active} onChange={event => setSpeed(Number(event.target.value))} /><output>{Math.round(speed)} km/h</output></label>
          <label>Drive input <select aria-label="Drive input" disabled={routeMode && active} value={input} onChange={event => setInput(event.target.value)}><option value="auto">Inferred</option><option value="accelerator">Accelerator</option><option value="regen">Lift / regen</option><option value="brake">Brake</option></select></label>
          <label>Transmission <select aria-label="Transmission" disabled={routeMode && active} value={transmission} onChange={event => setTransmission(event.target.value)}><option>AUTO</option><option>MANUAL</option></select></label>
          {transmission === "MANUAL" ? <div className="elab-gears">{[1, 2, 3, 4, 5, 6].map(gear => <button type="button" key={gear} onClick={() => setNotice(geaps.runtimeRef.current?.requestGear(gear) ? "Gear requested" : "Gear rejected: check speed, signal and shift state")}>{gear}</button>)}</div> : null}
          <button type="button" className="elab-rev" disabled={!active || routeMode} onPointerDown={() => geaps.runtimeRef.current?.setRevHeld(true)} onPointerUp={release} onPointerLeave={release}>HOLD TO REV</button>
          <p>Virtual 0.32 m wheel radius · original road ratios · 130 km/h acoustic ceiling. Speed and drive input here are simulated, not measured pedal or Tesla gearbox data.</p>
        </div>
      </details>
      <details><summary>Diagnostics</summary><pre>{JSON.stringify({ ...geaps.snapshot, evidence: motion.current.snapshot(performance.now()), events: events.current }, null, 2)}</pre></details>
    </footer>
  </div>;
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
    if (!isEngineProfile(id) || id === profile) return;
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
      setNotes(next); setNote(""); setNotice("Verdict saved on this device.");
    } catch (error) { setNotice(error?.message === "Choose a preference before saving." ? "Choose A, B or No preference before saving." : "Could not save locally. Keep your note and try again."); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ schema: "engine-listening-export.v1", notes }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "engine-listening-notes.json"; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const labels = comparisonCalibrations(profile), selected = describe(profile);
  const engineRow = item => <li key={item.id}><button type="button" className={item.id === profile ? "is-selected" : ""} aria-pressed={item.id === profile}
    disabled={busy} onClick={() => chooseProfile(item.id)}><span><strong>{item.label}</strong><small>{item.description}</small></span>
    {item.id === profile ? <b className="elab-badge" aria-label="Plays as B">B</b> : <i aria-hidden="true">›</i>}</button></li>;
  const choose = <>
    <h2>Choose an engine</h2>
    <div className="elab-engines">
      <h3>SAMPLE VOICES · {ENGINE_SAMPLE_VOICES.length}</h3>
      <ul>{ENGINE_SAMPLE_VOICES.map(engineRow)}</ul>
      <h3>COMBUSTION · {ENGINE_COMBUSTION_VOICES.length}</h3>
      <ul>{ENGINE_COMBUSTION_VOICES.map(engineRow)}</ul>
    </div>
    {/* Keyboard and QA path to the same choice. */}
    <label className="sr-only">Comparison engine <select aria-label="Comparison engine" value={profile} disabled={busy} onChange={event => chooseProfile(event.target.value)}>
      {ENGINE_CATALOGUE.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
  </>;
  const verdict = <>
    <h2>Your verdict</h2>
    <p className="elab-lede">{isCombustionVoice(profile) ? `Rosso vs ${selected?.label}` : `${selected?.label}: Refined vs Full body`}</p>
    <h3 className="elab-choice-title" id="elab-choice-title">Which sounds better?</h3>
    <div className="elab-choice" role="group" aria-labelledby="elab-choice-title">
      {[["A", "A"], ["B", "B"], ["tie", "No preference"]].map(([value, label]) => <button key={value} type="button" aria-pressed={preference === value}
        className={preference === value ? "is-selected" : ""} onClick={() => setPreference(value)}>{label}</button>)}
    </div>
    <label className="sr-only">Listening preference <select aria-label="Listening preference" value={preference} onChange={event => setPreference(event.target.value)}>
      <option value="">Choose…</option><option value="A">A · {labels.A}</option><option value="B">B · {labels.B}</option><option value="tie">No preference</option></select></label>
    <p className="elab-choice-note">{preference === "A" ? `A · ${labels.A} selected` : preference === "B" ? `B · ${labels.B} selected` : preference === "tie" ? "No preference selected" : "Nothing selected yet"}</p>
    <label className="elab-note"><span>Listening notes</span><textarea aria-label="Listening note" maxLength={4000} value={note} onChange={event => setNote(event.target.value)} placeholder="Body, roar, hiss, shifts, bangs…" /></label>
    <button type="button" className="elab-save" onClick={save}>✓ SAVE VERDICT</button>
    {notice ? <p className="elab-notice" role="status">{notice}</p> : null}
    <div className="elab-saved"><strong>{notes.length} saved {notes.length === 1 ? "note" : "notes"}</strong>
      <button type="button" onClick={download} disabled={!notes.length}>EXPORT NOTES</button></div>
    <p className="elab-meta">Saved only on this device, up to 60. Export to share; nothing is sent automatically.</p>
    {notes.length ? <ol className="elab-history engine-listening-notes">{notes.slice(-4).reverse().map((entry, index) => <li key={`${entry.id}-${index}`}>
      <strong>{describe(entry.profile)?.label ?? entry.profile} · {entry.preference === "tie" ? "No preference" : `Preferred ${entry.preference}`}</strong>
      <span>{entry.note || "No written note"}</span></li>)}</ol> : null}
  </>;
  return <section className="elab">
    <header className="elab-header">
      <EngineIcon />
      <div><h1>Engine LAB</h1><p>Compare engine voices on the same 68-second route.</p></div>
      <span className="elab-build">Build {typeof __APP_BUILD__ === "undefined" ? "local" : __APP_BUILD__}</span>
    </header>
    <EngineBench key={`${profile}-${serial}`} {...{ audioRef, prepareAudio, profile, calibration, onProgress, choose, verdict }}
      autoReplay={replay} transport={{ play, busy, labels, listened, candidate: isCombustionVoice(profile) }} />
  </section>;
}
