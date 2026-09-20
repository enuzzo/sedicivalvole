import { useCallback, useEffect, useRef, useState } from "react";
import { createPhoneSensors } from "./sensors.js";
import { createMotionSession } from "./session.js";
import { getFluxTheme } from "../flux-themes.js";
import { resolveSemanticTheme } from "../semantic-theme.js";
import { MotionQuality, MotionSteps, MotionReadings, MotionLiveStatus, SetupDisclosure, SetupMark, MountChoice } from "./motion-ui.jsx";
import { MotionTrace } from "./trace-view.jsx";
import { motionPresentationFromSearch } from "./presentation.js";
import { phoneSetup, setupEvidence, ended } from "./guided-setup.js";
const initialPresentation = motionPresentationFromSearch(window.location.search);
// The bearer capability stays in memory; remove it from history before UI/logging.
const match = /^#pair=([a-f0-9]{32})\.([a-f0-9]{64})(?:\.([a-f0-9]{64}))?$/.exec(window.location.hash);
const initialPair = match ? { id: match[1], token: match[2], ...(match[3] ? { key: match[3] } : {}) } : null;
if (window.location.hash) history.replaceState(null, "", `${location.pathname}?motion=phone`);

export function MotionPhone({ createSensors = createPhoneSensors, createSession = createMotionSession, pair = initialPair } = {}) {
  const sensorsRef = useRef(null), sessionRef = useRef(null), traceRef = useRef({});
  const attemptedRef = useRef(false);
  const [presentation, setPresentation] = useState(initialPresentation);
  const theme = resolveSemanticTheme(getFluxTheme(presentation.palette), presentation.appearance);
  const [snapshot, setSnapshot] = useState({ state: "idle" });
  const [sensor, setSensor] = useState({ sensorState: "idle" });
  const [values, setValues] = useState(null), [completed, setCompleted] = useState(false);
  const [review, setReview] = useState(false), [detail, setDetail] = useState(false), [trace, setTrace] = useState(false);
  const [viewReset, setViewReset] = useState(0);
  const getSample = useCallback(() => sensorsRef.current?.latest() ?? null, []);
  const traceTelemetry = useCallback(value => { traceRef.current = value; }, []);
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Phone companion — sedicivalvole";
    let previousLink = "idle";
    const session = createSession({ role: "phone", onChange: next => {
      const changed = previousLink !== next.state; previousLink = next.state;
      if (changed && ended(next.state)) { sensorsRef.current?.stop(); setCompleted(false); setReview(false); setTrace(false); }
      if (next.presentation) setPresentation(previous => previous.palette === next.presentation.palette && previous.appearance === next.presentation.appearance ? previous : next.presentation);
      setSnapshot(next);
    }, getPhone: () => ({ summary: { ...sensorsRef.current?.summary(), ...traceRef.current }, values: sensorsRef.current?.latest() ?? null }) });
    // Remote onboarding requests wake only from its own final explicit gesture.
    const sensors = createSensors({ autoWake: false, onEvent: (type, value) => session.event(type, value) });
    sensorsRef.current = sensors; sessionRef.current = session;
    const timer = setInterval(() => { setSensor(sensors.summary()); setValues(sensors.latest()); session.refresh(); }, 100);
    return () => { document.title = previousTitle; clearInterval(timer); sensors.dispose(); session.dispose(); sensorsRef.current = null; sessionRef.current = null; };
  }, []);
  const guide = phoneSetup({ link: snapshot, sensor, hasPair: Boolean(pair), attempted: attemptedRef.current });
  const summary = { ...snapshot, ...sensor };
  useEffect(() => { if (guide.ready && !completed) { setCompleted(true); setReview(false); } }, [guide.ready, completed]);
  const requiresAction = sensor.sensorState !== "live" || !(sensor.placementConfirmed ?? sensor.mountSelected) || !sensor.tared || !sensor.wakeLock;
  const showSetup = !completed || review || requiresAction;
  const refresh = () => setSensor(sensorsRef.current?.summary() ?? {});
  const start = () => {
    if (sensor.sensorState === "waiting" && sensor.waitingMs >= 5000) sensorsRef.current?.stop();
    void sensorsRef.current?.start(); refresh();
  };
  const connect = () => {
    if (!pair || attemptedRef.current || ended(snapshot.state)) return;
    attemptedRef.current = true; void sessionRef.current?.start(pair);
  };
  const stop = () => { sensorsRef.current?.stop(); sessionRef.current?.stop(); setCompleted(false); setReview(false); setTrace(false); refresh(); setValues(null); };
  const restart = () => { sensorsRef.current?.stop(); sensorsRef.current?.resetPlacement(); setCompleted(false); setReview(false); setTrace(false); setDetail(false); refresh(); setValues(null); };
  const actions = {
    sensors: start, connect,
    position: () => { sensorsRef.current?.confirmPlacement(); refresh(); },
    zero: () => { sensorsRef.current?.requestTare(); refresh(); },
    awake: () => { void sensorsRef.current?.requestWake(); refresh(); },
  };
  const labels = { sensors: "ENABLE LOCAL SENSORS", connect: "CONNECT TO DISPLAY", position: "PHONE IS SECURED", zero: "ZERO", awake: "KEEP SCREEN AWAKE" };
  const download = () => {
    const report = { schema: "sedicivalvole.motion-phone-report.v1", generatedAt: new Date().toISOString(), build: __APP_BUILD__, commit: __APP_COMMIT__, platform: navigator.userAgent, motion: sessionRef.current?.report() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "sedicivalvole-phone-motion.json"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <main className="motion-phone motion-guided-phone" data-palette={presentation.palette} data-appearance={presentation.appearance} style={{ ...theme.css, colorScheme: presentation.appearance }}>
    <div className="motion-guided-stage" data-setup={showSetup}>
      <header className="motion-phone-brand"><img src={`/brand/pistons-v1/mark-512.png?build=${encodeURIComponent(__APP_BUILD__)}`} width="48" height="48" alt=""/><div><span className="motion-wordmark">sedicivalvole</span><span className="motion-phone-kicker">PHONE COMPANION</span></div></header>
      {showSetup ? <>
        <MotionSteps active={guide.active} done={setupEvidence(summary, true)}/>
        <div className="motion-focus-copy" role="status"><h1>{guide.title}</h1><p>{guide.hint}</p></div>
        <div className="motion-focus-art"><img src={`/brand/phone-guide/${guide.active === 4 ? "awake" : guide.active >= 2 ? "zero-console" : guide.active === 1 ? "connect" : "scan"}.png`} alt=""/></div>
        <div className="motion-focus-action">
          {guide.action && <button className="motion-primary" onClick={actions[guide.action]}>{labels[guide.action]}</button>}
          {guide.active === 4 && !sensor.wakeLock && <p>{sensor.wakeState === "requesting" ? "Requesting screen wake…" : "Screen-awake lock not acquired"}</p>}
          {review && guide.ready && <button onClick={() => setReview(false)}>BACK TO LIVE DATA</button>}
        </div>
        <footer className="motion-setup-footer"><span>{ended(snapshot.state) ? "New QR required" : guide.ready ? "Setup complete" : `Step ${Math.min(5, guide.active + 1)} of 5`}</span>{!ended(snapshot.state) && <button onClick={restart}>Restart setup</button>}</footer>
      </> : <>
        <SetupDisclosure expanded={false} onClick={() => setReview(true)}/>
        <h1 className="motion-live-title">Recent phone motion</h1>
        <MotionReadings summary={summary} values={values} phone/>
        <MotionLiveStatus summary={summary} phone/>
        <button className="motion-stop" onClick={stop}>STOP</button>
      </>}
      <button className="motion-detail-toggle" aria-expanded={detail} onClick={() => setDetail(v => !v)}>Connection & sensor details<SetupMark kind="chevron"/></button>
    </div>
    {detail && <section className="motion-extra-details">
      <MotionQuality summary={summary}/>
      <MountChoice selected={sensor.mountSelected} onChange={selected => { sensorsRef.current?.setMount(selected); refresh(); }}/>
      <p>ZERO works in any orientation. Car-axis motion is optional: enable it only when the screen faces the cabin and the phone is aligned straight ahead, then set ZERO again. Otherwise GPS controls vehicle acceleration.</p>
      <p>Small vibrations can appear in the readings without affecting the driving response.</p>
      <p>Network gaps keep your pairing and ZERO while local sensors stay live. Recovery is automatic within this one-hour session.</p>
      <p>{snapshot.state === "connected" ? "Display link open. Only fresh calibrated readings are live." : "This phone is not connected to the display."} GPS remains the speed source.</p>
      <p>Keep this page visible. Hiding or locking either screen ends this session. On the display, create a new QR to restart.</p>
      <button onClick={stop}>STOP SENSORS & CONNECTION</button><button onClick={download}>DOWNLOAD PHONE REPORT</button>
      <p>Reports contain quality and connection events only, never raw sensor history, location or pairing keys.</p>
      {(!pair || ended(snapshot.state)) && <div className="motion-local-check"><p>Local sensor check only. This does not reconnect to the display.</p><button onClick={start}>ENABLE LOCAL SENSORS</button><button disabled={sensor.sensorState !== "live"} onClick={() => { sensorsRef.current?.requestTare(); refresh(); }}>LOCAL ZERO</button><button onClick={() => void sensorsRef.current?.requestWake()}>KEEP SCREEN AWAKE</button></div>}
      {(completed || sensor.tared && (!pair || ended(snapshot.state))) && <><button aria-expanded={trace} onClick={() => setTrace(v => !v)}>{trace ? "HIDE" : "SHOW"} TRACE CUBE</button>{trace && <><MotionTrace getSample={getSample} onTelemetry={traceTelemetry} resetKey={viewReset} themeKey={`${presentation.palette}:${presentation.appearance}`}/><button onClick={() => setViewReset(n => n + 1)}>RECENTER VIEW</button></>}</>}
      <p className="motion-meta">A project by enuzzo · {__APP_BUILD__}</p>
    </section>}
  </main>;
}
