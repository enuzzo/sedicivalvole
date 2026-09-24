import { ContextualRail, useContextualControls } from "../contextual-controls.jsx";
import { useEffect, useRef, useState } from "react";
import { ENGINE_CATALOGUE } from "./catalogue.js";
import "./telemetry-field.css";
import { telemetrySignals } from "./telemetry-signals.js";
import { EngineSignals } from "./telemetry-signals.jsx";
import { Led } from "../ui/night-instrument.jsx";

// Twelve shift lights that close in from both ends toward the centre, in six
// pairs: green, then amber, then red. At the top of the range all twelve stay
// lit; only the limiter itself pulses (2.5 Hz, steady with reduced motion).
const SHIFT_LIGHTS = Object.freeze(Array.from({ length: 12 }, (_, index) => {
  const pair = Math.min(index, 11 - index);
  return Object.freeze({ index, at: 0.5 + pair * 0.068, tone: pair < 2 ? "go" : pair < 4 ? "near" : "shift" });
}));
// The tachometer is 72 LED segments of 125 RPM (a tick every thousand); their heights form the crest.
const TACH_SEGMENTS = 72;
const TACH_MAX_RPM = 9000;
const REDLINE_FROM = 0.88;
const SHOW_OFF_PHASES = Object.freeze({ rev: "REV", release: "RELEASE", limiter: "LIMITER" });

export function EngineTelemetry({ state, profileId, onProfile, onRev, onRelease, speed = 0, speedSource = "GPS", speedFreshness = state.motion, onFrame }) {
  const contextual = useContextualControls();
  const [visible, setVisible] = useState(() => document.visibilityState !== "hidden");
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const signal = telemetrySignals(state, speed, speedSource, speedFreshness);
  const historyRef = useRef([]);
  const fieldRef = useRef(null);
  useEffect(() => {
    if (fieldRef.current && onFrame) onFrame(performance.now(), 100, "Engine SVG telemetry", fieldRef.current.clientWidth, fieldRef.current.clientHeight);
  }, [state, onFrame]);
  useEffect(() => {
    const next = { drive: state.drive ?? 0, decel: state.deceleration ?? 0 };
    historyRef.current = [...historyRef.current.slice(-99), next];
  }, [state]);
  useEffect(() => {
    const release = () => onRelease?.();
    window.addEventListener("blur", release);
    return () => { release(); window.removeEventListener("blur", release); };
  }, [onRelease]);
  const trace = key => historyRef.current.map((value, index) => `${index * 3},${48 - value[key] * 44}`).join(" ");
  const area = key => {
    const points = historyRef.current;
    if (!points.length) return "";
    return `M0,50 ${points.map((value, index) => `L${index * 3},${48 - value[key] * 44}`).join(" ")} L${(points.length - 1) * 3},50 Z`;
  };
  const traceEnd = key => {
    const points = historyRef.current;
    return points.length ? { x: (points.length - 1) * 3, y: 48 - points[points.length - 1][key] * 44 } : null;
  };
  const speedKnown = signal.speedKnown;
  const rpm = state.rpm ?? 1000;
  const rpmPosition = Math.max(0, Math.min(1, rpm / 9000));
  // Peak hold: the highest RPM of the last 1.5 s stays marked, like a needle tell-tale.
  const peakRef = useRef({ value: 0, at: 0 });
  const now = performance.now();
  if (rpmPosition >= peakRef.current.value || now - peakRef.current.at > 1_500) peakRef.current = { value: rpmPosition, at: now };
  const peakPosition = peakRef.current.value;
  const gearLabel = state.singleSpeed ? "—" : state.revving ? "N" : String(state.gear ?? 1);
  const litSegments = Math.round(rpmPosition * TACH_SEGMENTS);
  const peakSegment = Math.round(peakPosition * TACH_SEGMENTS);
  const redline = rpmPosition >= REDLINE_FROM;
  const limiterPulse = state.showOffPhase === "limiter";
  const motionLed = speedFreshness === "fresh" ? "live" : speedFreshness === "degraded" ? "aging" : "off";
  const driveEnd = traceEnd("drive"), decelEnd = traceEnd("decel");
  const voice = ENGINE_CATALOGUE.find(item => item.id === profileId)?.label ?? profileId;
  return <section ref={fieldRef} className="engine-telemetry" data-revving={Boolean(state.revving)} data-redline={redline} data-limiter={limiterPulse} aria-label="Engine Telemetry">
    <ContextualRail className="engine-contextual-rail"><div {...contextual} onPointerDown={event => event.stopPropagation()} className="engine-profiles" aria-label="Engine profile">
      {ENGINE_CATALOGUE.map(({ id, label, description }) => <button key={id} type="button" title={description} aria-pressed={profileId === id} onClick={() => onProfile(id)}>{label}</button>)}
    </div></ContextualRail>
    <header>
      <span className="engine-voice-title">{voice} <small>ENGINE / TELEMETRY</small></span>
      <span className="engine-status">
        <span className="engine-status-chip" data-state={motionLed}><Led on={motionLed !== "off"} tone={motionLed === "aging" ? "caution" : "success"} />{speedFreshness === "fresh" ? "LIVE MOTION" : speedFreshness === "degraded" ? "SIGNAL AGING" : "AWAITING MOTION"}</span>
        <span className="engine-status-chip">{state.status === "ready" ? `${(state.source || "sample").toUpperCase()} ENGINE` : state.status?.toUpperCase()}</span>
      </span>
    </header>
    <div className="engine-shift-lights" aria-hidden="true">
      {SHIFT_LIGHTS.map(({ index, at, tone }) => <i key={index} className={`is-${tone}`} data-on={rpmPosition >= at} />)}
    </div>
    <div className="engine-tach" role="meter" aria-label="Virtual engine RPM" aria-valuenow={rpm} aria-valuemin={0} aria-valuemax={TACH_MAX_RPM}>
      <svg className="engine-tach-bar" viewBox="0 0 720 80" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: TACH_SEGMENTS }, (_, i) => {
          const at = (i + 0.5) / TACH_SEGMENTS;
          const crest = Math.exp(-0.5 * ((at - rpmPosition) / 0.07) ** 2);
          // The last eight segments sit under the unit label: their crest is capped below it.
          const height = Math.min(i >= TACH_SEGMENTS - 9 ? 50 : 78, 22 + (i % 8 === 0 ? 6 : 0) + crest * 50);
          const zone = at >= REDLINE_FROM ? "red" : at >= 0.7 ? "hot" : "warm";
          return <rect key={i} x={i * 10 + 1.25} y={78 - height} width="7.5" height={height} rx="2"
            className={`tach-seg is-${zone}`} data-lit={i < litSegments} data-peak={i === peakSegment - 1 && peakSegment > litSegments} />;
        })}
      </svg>
      <div className="engine-tach-labels" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <span key={i} style={{ left: i === 9 ? "100%" : `${(i * 80 + 5) / 7.2}%` }} data-edge={i === 0 ? "start" : i === 9 ? "end" : undefined}>{i}</span>)}
      </div>
      <small className="engine-tach-unit" aria-hidden="true">×1000 r/min</small>
    </div>
    <div className="engine-primary">
      <div className="engine-metric">
        <small><Led on={redline || Boolean(state.revving)} tone="alert" />VIRTUAL RPM</small>
        <strong>{Math.round(rpm).toLocaleString("en-US")}</strong>
        <span>{state.enabled === false ? "AUDIO PAUSED" : state.revving ? "REVVING" : state.idleBlip ? "IDLE BLIP" : state.shift ? state.shift.toUpperCase() : Math.round(speed) === 0 ? state.trustedStationary ? "AUTO BLIPS ON" : speedFreshness === "lost" ? "NO SPEED SIGNAL" : "CONFIRMING STOP" : "ENGINE SPEED"}</span>
        <EngineSignals kind="rpm" signal={signal} visible={visible} />
      </div>
      <div className="engine-metric engine-speed-metric" aria-label={`Speed source ${speedSource}`}>
        <small><Led on={speedKnown && speedFreshness === "fresh"} tone="success" />SPEED · KM/H</small>
        <strong>{speedKnown ? Math.round(speed) : "—"}</strong>
        <span>{speedSource === "GPS" ? speedKnown ? speedFreshness === "degraded" ? "GPS · SIGNAL AGING" : "GPS SPEED" : "AWAITING GPS" : `${speedSource} SPEED`}</span>
        <EngineSignals kind="speed" signal={signal} visible={visible} />
      </div>
      <div className="engine-metric">
        <small><Led on={Boolean(state.shiftPhase)} />{state.singleSpeed ? "VIRTUAL SHAFT" : "VIRTUAL GEAR"}</small>
        <strong className="engine-gear-value"><span key={gearLabel}>{gearLabel}</span></strong>
        <span>{state.singleSpeed ? "CONTINUOUS" : state.shiftPhase ? state.shiftPhase.toUpperCase() : `${state.transmissionMode || "AUTO"} · ACOUSTIC`}</span>
        <EngineSignals kind="gear" signal={signal} visible={visible} />
      </div>
    </div>
    <div className="engine-graphs">
      <div className="is-drive"><small>DRIVE RESPONSE <b>{Math.round((state.drive ?? 0) * 100)}%</b></small><svg viewBox="0 0 300 52" preserveAspectRatio="none" aria-label="Drive response history">
        <path className="graph-grid" d="M0 13H300M0 26H300M0 39H300" /><path className="graph-area" d={area("drive")} /><polyline points={trace("drive")} />
        {driveEnd ? <line className="graph-now" x1={driveEnd.x} y1={driveEnd.y} x2={driveEnd.x} y2={driveEnd.y} /> : null}</svg></div>
      <div className="is-decel"><small>DECELERATION <b>{Math.round((state.deceleration ?? 0) * 100)}%</b></small><svg viewBox="0 0 300 52" preserveAspectRatio="none" aria-label="Deceleration history">
        <path className="graph-grid" d="M0 13H300M0 26H300M0 39H300" /><path className="graph-area" d={area("decel")} /><polyline points={trace("decel")} />
        {decelEnd ? <line className="graph-now" x1={decelEnd.x} y1={decelEnd.y} x2={decelEnd.x} y2={decelEnd.y} /> : null}</svg></div>
    </div>
    {Math.round(speed) === 0 ? <button className="engine-rev is-wide" type="button" aria-label="TAMARRO" disabled={!state.canRev}
      onPointerDown={event => event.stopPropagation()} aria-pressed={Boolean(state.revving)}
      style={{ "--rev-fill": state.revving ? rpmPosition.toFixed(3) : 0 }}
      onClick={() => state.revving ? onRelease?.() : onRev?.()}>
      <span className="engine-rev-fill" aria-hidden="true" />
      <span className="engine-rev-stripes" aria-hidden="true" />
      <strong><span className="engine-rev-emoji" aria-hidden="true">🤘</span>TAMARRO</strong>
      <small>{state.canRev ? state.revving ? `${SHOW_OFF_PHASES[state.showOffPhase] ?? "REV"} · TAP TO STOP` : "SHOW-OFF · TAP TO REV" : state.enabled === false ? "AUDIO PAUSED" : "PREPARING AUDIO"}</small>
      <strong className="engine-rev-mirror" aria-hidden="true">TAMARRO<span className="engine-rev-emoji">🤘</span></strong>
    </button> : null}
    {state.status === "loading" || state.status === "retrying" || state.status === "error" ? <div className="engine-load-state" role="status" aria-live="polite" aria-atomic="true">
      <strong>{state.status === "error" ? "ENGINE UNAVAILABLE" : `LOADING ${(ENGINE_CATALOGUE.find(item => item.id === profileId)?.label ?? profileId).toUpperCase()}…`}</strong>
      <span>{state.status === "retrying" ? "Waiting for audio · retrying automatically" : state.status === "error" ? "Audio could not be prepared" : "Preparing engine audio"}{state.playing ? ` · ${ENGINE_CATALOGUE.find(item => item.id === state.profileId)?.label ?? state.profileId} continues` : ""}</span>
    </div> : null}
  </section>;
}
