import { useCallback, useEffect, useRef, useState } from 'react';
import { createPhoneSensors } from './sensors.js';
import { MotionTrace } from './trace-view.jsx';
import { MotionQuality, MotionNext } from './motion-ui.jsx';
import { phoneOnboarding } from './onboarding.js';

export function localSensorCapability(host = globalThis) {
  const potential = Boolean(host.isSecureContext && host.DeviceMotionEvent && host.DeviceOrientationEvent);
  return { potential, touchInput: (host.navigator?.maxTouchPoints ?? 0) > 0, needsPermission: potential && [host.DeviceMotionEvent, host.DeviceOrientationEvent].some(api => typeof api.requestPermission === 'function') };
}
export function useLocalSensors(onEvent) {
  const owner = useRef(null);
  const [capability, setCapability] = useState(() => localSensorCapability(window));
  const [summary, setSummary] = useState({ sensorState: 'idle' });
  const [activity, setActivity] = useState(null);
  useEffect(() => {
    const sensors = createPhoneSensors({ onEvent }); owner.current = sensors;
    let timer = null;
    const observed = event => {
      const valid = value => value && ['x', 'y', 'z'].every(key => Number.isFinite(value[key]));
      const rotation = event.rotationRate;
      if (event.isTrusted && (valid(event.acceleration) || valid(event.accelerationIncludingGravity)) && rotation && ['alpha', 'beta', 'gamma'].every(key => Number.isFinite(rotation[key]))) {
        setCapability(current => ({ ...current, observed: true }));
        window.removeEventListener('devicemotion', observed);
      }
    };
    if (capability.potential) window.addEventListener('devicemotion', observed);
    timer = setInterval(() => { setSummary(previous => { const next = sensors.summary(); return ["idle", "stopped"].includes(next.sensorState) && next.sensorState === previous.sensorState ? previous : next; }); setActivity(sensors.activity()); }, 250);
    return () => { clearInterval(timer); window.removeEventListener('devicemotion', observed); sensors.dispose(); owner.current = null; };
  }, [onEvent]);
  const sample = useCallback(() => owner.current?.latest() ?? null, []);
  const start = () => { owner.current?.stop(); void owner.current?.start(); setSummary(owner.current?.summary() ?? {}); };
  return { capability, preferred: (capability.needsPermission && capability.touchInput) || capability.observed, summary, activity, sample, start,
    stop: () => owner.current?.stop(), zero: () => owner.current?.requestTare() };
}
export function LocalSensorsPanel({ sensors, gpsState, source, themeKey, onRemote, onClose }) {
  const [reset, setReset] = useState(0);
  const live = sensors.summary.sensorState === 'live';
  const guide = phoneOnboarding({ sensor: sensors.summary, localOnly: true });
  if (sensors.summary.sensorState === 'idle') {
    guide.title = 'Use this device’s sensors'; guide.hint = 'Allow accelerometer and gyroscope access. GPS continues to supply speed and location.';
  }
  return <div className="motion-panel-content local-sensors-panel">
    <header><div><small>THIS DEVICE · EXPERIMENTAL</small><h2 id="motion-title">Local motion sensors</h2></div><button data-dialog-initial-focus onClick={onClose}>CLOSE</button></header>
    <MotionNext guide={guide}/>
    <div className="motion-actions"><button className="motion-primary" disabled={sensors.summary.sensorState === 'requesting'} onClick={sensors.start}>{live ? 'RESTART SENSORS' : sensors.summary.sensorState === 'idle' ? 'ENABLE SENSORS' : 'RETRY SENSORS'}</button><button onClick={sensors.stop}>STOP</button><button onClick={sensors.zero} disabled={!live}>ZERO</button></div>
    <p className="local-source-status" role="status">LOCAL: {live ? 'Receiving valid motion data' : sensors.summary.sensorState} · {source === 'GPS' ? `GPS: ${gpsState}` : `Speed source: ${source}`}</p>
    <div className="local-motion-trace"><MotionTrace getSample={sensors.sample} resetKey={reset} themeKey={themeKey}/></div>
    <button onClick={() => setReset(value => value + 1)}>RECENTER VIEW</button>
    <MotionQuality summary={sensors.summary}/>
    <p>Fresh, zeroed rotation feeds TRACE and bends Aperture. Keep the phone fixed in its holder. GPS remains the speed reference; motion is never integrated into an invented speed. No phone pairing is needed.</p>
    <button onClick={onRemote}>USE ANOTHER PHONE INSTEAD</button>
  </div>;
}
