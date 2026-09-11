import { useEffect, useRef } from "react";
import { ENGINE_CATALOGUE } from "./catalogue.js";
import "./telemetry-field.css";

export function EngineTelemetry({ state, profileId, onProfile, onRev, onRelease, speed = 0, onFrame }) {
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
  const rpm = state.rpm ?? 1000;
  const rpmPosition = Math.max(0, Math.min(1, rpm / 9000));
  const voice = ENGINE_CATALOGUE.find(item => item.id === profileId)?.label ?? profileId;
  return <section ref={fieldRef} className="engine-telemetry" data-revving={Boolean(state.revving)} aria-label="Engine Telemetry">
    <header><span className="engine-voice-title">{voice} <small>ENGINE / TELEMETRY</small></span><span>{state.status === "ready" ? `${(state.source || "sample").toUpperCase()} ENGINE` : state.status?.toUpperCase()}</span></header>
    <div className="engine-tach-labels" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <span key={i}>{i}</span>)}</div>
    <div className="engine-tach" role="meter" aria-label="Virtual engine RPM" aria-valuenow={rpm} aria-valuemin={0} aria-valuemax={9000}>
      <svg className="engine-rpm-wave" viewBox="0 0 720 66" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({length:73},(_,i)=>{
          const proximity=Math.exp(-0.5*((i/72-rpmPosition)/0.064)**2);
          const height=8+(i%8===0?6:0)+proximity*42;
          return <line key={i} x1={4+i*712/72} x2={4+i*712/72} y1={62-height} y2="62"
            className={i/72>=.88?'is-redline':undefined} style={{opacity:.25+proximity*.75}}/>;
        })}
        <path className="engine-rpm-cursor" d={`M${4+rpmPosition*712-4} 2h8l-4 6z`}/>
      </svg>
      <i style={{ width: `${rpmPosition*100}%` }} />
    </div>
    <div className="engine-primary">
      <div><small>VIRTUAL RPM</small><strong>{Math.round(rpm).toLocaleString("en-US")}</strong><span>{state.revving ? "REVVING" : state.idleBlip ? "IDLE BLIP" : state.shift ? state.shift.toUpperCase() : Math.round(speed) === 0 ? state.enabled === false ? "AUDIO PAUSED" : state.trustedStationary ? "IDLE · AUTO BLIPS ON" : state.motion === "lost" ? "IDLE · NO SPEED SIGNAL" : "IDLE · CONFIRMING STOP" : "ENGINE SPEED"}</span></div>
      <div><small>{state.singleSpeed ? "SHAFT / CONTINUOUS" : `GEAR / ${state.transmissionMode || "AUTO"}`}</small><strong>{state.singleSpeed ? "—" : state.revving ? "N" : state.gear ?? 1}</strong><span>{state.singleSpeed ? "VIRTUAL TURBINE" : state.shiftPhase ? state.shiftPhase.toUpperCase() : "ACOUSTIC GEARBOX"}</span></div>
    </div>
    <div className="engine-graphs">
      <div><small>DRIVE RESPONSE <b>{Math.round((state.drive ?? 0) * 100)}%</b></small><svg viewBox="0 0 300 52" aria-label="Drive response history"><polyline points={trace("drive")} /></svg></div>
      <div><small>DECELERATION <b>{Math.round((state.deceleration ?? 0) * 100)}%</b></small><svg viewBox="0 0 300 52" aria-label="Deceleration history"><polyline points={trace("decel")} /></svg></div>
    </div>
    <div className="engine-bottom"><div className="engine-profiles" aria-label="Engine profile">
      {ENGINE_CATALOGUE.map(({ id, label, description }) => <button key={id} type="button" title={description} aria-pressed={profileId === id} onClick={() => onProfile(id)}>{label}</button>)}
    </div><span>{Math.round(speed)} KM/H · {state.motion === "fresh" ? "LIVE MOTION" : state.motion === "degraded" ? "SIGNAL AGING" : "AWAITING MOTION"}</span></div>
    {Math.round(speed) === 0 ? ["left", "right"].map(side => <button key={side} className={`engine-rev is-${side}`} type="button" aria-label={`TAMARRO ${side}`} disabled={!state.canRev}
      aria-pressed={Boolean(state.revving)}
      onClick={() => state.revving ? onRelease?.() : onRev?.()}><strong><span className="engine-rev-emoji" aria-hidden="true">🤘</span>TAMARRO</strong><small>{state.canRev ? state.revving ? "SHOW-OFF · STOP" : "SHOW-OFF" : state.enabled === false ? "AUDIO PAUSED" : "PREPARING AUDIO"}</small></button>) : null}
    {state.status === "loading" || state.status === "retrying" || state.status === "error" ? <div className="engine-load-state" role="status" aria-live="polite" aria-atomic="true">
      <strong>{state.status === "error" ? "ENGINE UNAVAILABLE" : `LOADING ${(ENGINE_CATALOGUE.find(item => item.id === profileId)?.label ?? profileId).toUpperCase()}…`}</strong>
      <span>{state.status === "retrying" ? "Waiting for audio · retrying automatically" : state.status === "error" ? "Audio could not be prepared" : "Preparing engine audio"}{state.playing ? ` · ${ENGINE_CATALOGUE.find(item => item.id === state.profileId)?.label ?? state.profileId} continues` : ""}</span>
    </div> : null}
  </section>;
}
