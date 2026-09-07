import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ATLAS_SPEED_BANDS } from './atlas-model.js';
import { altitudeTraceRange, chartAltitudeSource, chartAltitudeValue, sessionStatsSnapshot, sessionRuntimeSnapshot, SESSION_GAP_MS } from './session-stats.js';

const duration = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const value = (n, suffix = '') => Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—';
const SessionReportPanel = lazy(() => import('../../reports/session-report-panel.jsx'));

function Trace({ samples, kind = 'journey' }) {
  const ref = useRef(null);
  const [cursor, setCursor] = useState(null);
  useEffect(() => {
    const canvas = ref.current;
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      const ratio = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = width * ratio; canvas.height = height * ratio;
      const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
      const ink = getComputedStyle(canvas).color;
      ctx.font = '13px "Space Grotesk", sans-serif'; ctx.fillStyle = ink;
      const left = 36, right = width - 44, top = 14, bottom = height - 27;
      const first = samples[0]?.capturedAtMs ?? 0, last = samples.at(-1)?.capturedAtMs ?? first + 1;
      const x = t => left + (t - first) / Math.max(1, last - first) * (right - left);
      const fields = kind === 'journey' ? ['speedKmh', 'altitudeM'] : ['downloadRate', 'uploadRate'];
      fields.forEach((field, index) => {
        const readValue = sample => field === 'altitudeM' ? chartAltitudeValue(sample) : sample[field];
        const numbers = samples.map(readValue).filter(Number.isFinite);
        const { minimum, maximum } = field === 'altitudeM' ? altitudeTraceRange(samples)
          : { minimum: 0, maximum: Math.max(field === 'speedKmh' ? 30 : 1, ...numbers) };
        const y = v => bottom - (v - minimum) / Math.max(1, maximum - minimum) * (bottom - top);
        const color = getComputedStyle(canvas).getPropertyValue(index ? '--stats-blue' : '--stats-red').trim();
        if (!index) {
          ctx.globalAlpha = .15; ctx.strokeStyle = ink;
          for (let i = 0; i < 4; i++) { const yy = top + (bottom - top) * i / 3; ctx.beginPath();ctx.moveTo(left, yy);ctx.lineTo(right, yy);ctx.stroke(); }
          ctx.globalAlpha = 1;
        }
        const runs = []; let run = [];
        for (const sample of samples) {
          const previous = run.at(-1);
          const changedSource = field === 'altitudeM' && previous && chartAltitudeSource(previous) !== chartAltitudeSource(sample);
          if (!Number.isFinite(readValue(sample)) || sample.containsGap || changedSource || (previous && (sample.firstCapturedAtMs ?? sample.capturedAtMs) - (previous.lastCapturedAtMs ?? previous.capturedAtMs) > SESSION_GAP_MS)) { if (run.length) runs.push(run); run = []; }
          if (Number.isFinite(readValue(sample)) && !sample.containsGap) run.push(sample);
        }
        if (run.length) runs.push(run);
        ctx.fillStyle = color; ctx.globalAlpha = index ? .14 : .06;
        runs.forEach(points => { if (points.length < 2) return; ctx.beginPath(); ctx.moveTo(x(points[0].capturedAtMs), bottom); points.forEach(p => ctx.lineTo(x(p.capturedAtMs), y(readValue(p)))); ctx.lineTo(x(points.at(-1).capturedAtMs), bottom); ctx.closePath(); ctx.fill(); });
        ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2;
        for (const points of runs) {
          ctx.setLineDash(field === 'altitudeM' && chartAltitudeSource(points[0]) === 'map' ? [5, 4] : []);
          ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(x(point.capturedAtMs), y(readValue(point))) : ctx.moveTo(x(point.capturedAtMs), y(readValue(point)))); ctx.stroke();
          if (points.length === 1) { ctx.beginPath(); ctx.arc(x(points[0].capturedAtMs), y(readValue(points[0])), 2.5, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.setLineDash([]); ctx.fillStyle = color;
        ctx.textAlign = index ? 'left' : 'right';
        ctx.fillText(numbers.length ? String(Math.round(maximum)) : "—", index ? right + 6 : left - 7, top + 5);
        ctx.fillText(numbers.length ? String(minimum) : "—", index ? right + 6 : left - 7, bottom);
      });
      ctx.fillStyle = ink;ctx.textAlign = 'left';ctx.fillText(duration(first - (samples[0]?.capturedAtMs ?? first)), left, height - 6);
      ctx.textAlign = 'right';ctx.fillText(duration(last - first), right, height - 6);
      if (cursor != null && samples.length) { ctx.strokeStyle = ink;ctx.globalAlpha = .5;ctx.beginPath();ctx.moveTo(left + cursor * (right - left), top);ctx.lineTo(left + cursor * (right - left), bottom);ctx.stroke(); }
    };
    draw(); const observer = new ResizeObserver(draw);observer.observe(canvas);
    return () => observer.disconnect();
  }, [samples, kind, cursor]);
  const targetTime = (samples[0]?.capturedAtMs ?? 0) + (cursor ?? 0) * ((samples.at(-1)?.capturedAtMs ?? 0) - (samples[0]?.capturedAtMs ?? 0));
  const selected = cursor == null ? null : samples.reduce((best, s) => !best || Math.abs(s.capturedAtMs - targetTime) < Math.abs(best.capturedAtMs - targetTime) ? s : best, null);
  return <div className="stats-trace" onPointerLeave={() => setCursor(null)}>
    <canvas ref={ref} role="img" aria-label={kind === 'journey' ? 'Observed speed and altitude timeline. Solid GPS altitude, dashed map estimate. Gaps are unknown.' : 'Observed download and upload rate timeline.'}
      onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setCursor(Math.max(0, Math.min(1, (e.clientX - r.left - 36) / (r.width - 80)))); }} />
    {selected ? <output className="stats-chart-cursor">{kind === 'journey' ? `${value(selected.speedKmh, ' km/h')} · ${value(chartAltitudeValue(selected), chartAltitudeSource(selected) === 'map' ? ' m MAP' : ' m GPS')}` : `${value(selected.downloadRate, ' KB/s ↓')} · ${value(selected.uploadRate, ' KB/s ↑')}`}</output> : null}
  </div>;
}

function HeadingRose({ headings }) {
  const ref = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext('2d');ctx.clearRect(0, 0, 160, 130);
    const ink = getComputedStyle(ref.current).color;
    const max = Math.max(1, ...headings);
    ctx.font = '13px "Space Grotesk", sans-serif';ctx.textAlign = 'center';ctx.textBaseline = 'middle';
    headings.forEach((n, i) => {
      const angle = i * Math.PI / 4 - Math.PI / 2;
      ctx.strokeStyle = ink;ctx.globalAlpha = .15;ctx.beginPath();ctx.moveTo(80,65);ctx.lineTo(80+Math.cos(angle)*42,65+Math.sin(angle)*42);ctx.stroke();
      const bands = n > 0 ? Math.max(1, Math.ceil(6 * n / max)) : 0;
      for (let band = 0; band < 6; band++) {
        ctx.globalAlpha = band < bands ? .9 : .08;
        ctx.strokeStyle = band < bands ? getComputedStyle(ref.current).getPropertyValue('--stats-red').trim() : ink;
        ctx.lineWidth = 4;ctx.beginPath();ctx.arc(80,65,9+band*6.5,angle-Math.PI/8+.055,angle+Math.PI/8-.055);ctx.stroke();
      }
      ctx.lineWidth = 1;
      ctx.globalAlpha = 1;ctx.fillStyle = ink;ctx.fillText(['N','NE','E','SE','S','SW','W','NW'][i],80+Math.cos(angle)*58,65+Math.sin(angle)*56);
    });
  }, [headings]);
  return <canvas className="stats-heading-rose" ref={ref} width="160" height="130" role="img" aria-label="Time spent moving in each compass direction" />;
}

export default function StatsPanel({ journeyRef, networkHistoryRef, readSystem, onClose }) {
  const [snapshot, setSnapshot] = useState(null);
  const [range, setRange] = useState("recent");
  const [reportSource, setReportSource] = useState(null);
  const exportRef = useRef(null);
  useEffect(() => { if (!reportSource) exportRef.current?.focus({ preventScroll: true }); }, [reportSource]);
  useEffect(() => {
    const refresh = () => setSnapshot({ stats: sessionStatsSnapshot(journeyRef.current.totals, performance.now()),
      samples: [...(range === "session" ? journeyRef.current.sessionSamples : journeyRef.current.recentSamples)], terrain: journeyRef.current.terrain, network: [...networkHistoryRef.current], system: readSystem() });
    refresh();const timer = setInterval(refresh, 2000);return () => clearInterval(timer);
  }, [journeyRef, networkHistoryRef, readSystem, range]);
  if (!snapshot) return null;
  if (reportSource) return <Suspense fallback={<p>Loading session export…</p>}><SessionReportPanel source={reportSource} onClose={() => setReportSource(null)} /></Suspense>;
  const { stats: s, samples, network, system, terrain } = snapshot;
  const runtime = sessionRuntimeSnapshot(system);
  return <>
    <header className="stats-heading"><div><small>SESSION OBSERVATORY</small><h2 id="stats-title">Stats for Nerds</h2></div><nav aria-label="Stats controls"><button ref={exportRef} onClick={() => setReportSource({ journey: structuredClone(journeyRef.current), system: readSystem(), nowMs: performance.now(), createdAt: new Date().toISOString(), app: { version: __APP_VERSION__, build: __APP_BUILD__, commit: __APP_COMMIT__ } })}>Export session</button><button data-dialog-initial-focus onClick={onClose}>Close</button></nav></header>
    <div className="stats-scroll">
      <div className="stats-headlines">
        {[[s.observedMs ? (s.distanceM / 1000).toFixed(1) : '—','km','GPS distance'],[duration(s.elapsedMs),'','Duration'],[value(s.averageKmh),'km/h','Avg speed'],[s.observedMs ? Math.round(s.movingMs/s.observedMs*100) : '—','%','Moving']].map(([n,u,label]) => <div key={label}><strong>{n}<small>{u}</small></strong><span>{label}</span></div>)}
      </div>
      {!samples.length ? <p className="stats-empty">Waiting for GPS observations. Demo driving is not recorded as a real journey.</p> : null}
      <section className="stats-main-chart"><header><strong>Speed <small>km/h</small></strong><button className="stats-range" onClick={() => setRange(r => r === "recent" ? "session" : "recent")}>{range === "recent" ? "Recent hour" : "Whole session · averaged"}</button><strong className="stats-blue">Altitude <small>m · GPS / map</small></strong></header><Trace samples={samples} /><p className="stats-trace-note">{samples.some(sample => chartAltitudeSource(sample) === 'map') ? 'GPS altitude: solid · Map elevation: dashed area estimate.' : samples.some(sample => Number.isFinite(sample.altitudeM)) ? 'Reported GPS altitude · precision varies. Ascent/descent require accurate fixes.' : 'Altitude unavailable · waiting for GPS or map elevation.'}</p></section>
      <div className="stats-lower">
        <section><h3>Speed bands</h3>{ATLAS_SPEED_BANDS.map((b,i) => <div className="stats-band" key={b.label}><span>{b.label}</span><meter min="0" max={Math.max(1,s.observedMs)} value={s.speedBandsMs[i]} /><strong>{duration(s.speedBandsMs[i])}</strong></div>)}</section>
        <section className="stats-terrain"><h3>Journey / GPS estimates</h3><dl>{[['Elevation gain',s.elevationObservedMs ? value(s.elevationGainM,' m') : '—'],['Elevation loss',s.elevationObservedMs ? value(s.elevationLossM,' m') : '—'],['Stopped',`${duration(s.stoppedMs)} · ${s.stops} stops`],['Peak speed',value(s.peakKmh,' km/h')],['Moving average',value(s.movingAverageKmh,' km/h')],['Acceleration share',s.accelerationShare == null ? '—' : value(s.accelerationShare * 100,'%')],['Braking share',s.brakingShare == null ? '—' : value(s.brakingShare * 100,'%')]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>
        <section className="stats-direction"><h3>Heading</h3><HeadingRose headings={s.headingMs}/></section>
      </div>
      <div className="stats-system"><section><header><h3>Network <small>KB/s ↓ / ↑</small></h3><span>{((system.network.observedDownloadBytes ?? 0)/1048576).toFixed(1)} MB observed ↓</span></header><Trace samples={network} kind="network" /></section><section className="stats-health"><h3>System</h3><dl><div><dt>Frame rate</dt><dd>{value(system.frame.averageFps,' FPS')}</dd></div><div><dt>Frame p95</dt><dd>{value(system.frame.p95FrameMs,' ms')}</dd></div><div><dt>Audio</dt><dd>{system.audio}</dd></div><div><dt>GPS coverage</dt><dd>{Math.round(s.coverage*100)}%</dd></div><div><dt>Long tasks</dt><dd>{value(runtime.longTasks.count)}</dd></div><div><dt>Longest task</dt><dd>{value(runtime.longTasks.maximumDurationMs,' ms')}</dd></div><div><dt>Retries · {runtime.events.scope}</dt><dd>{value(runtime.events.retryCount)}</dd></div><div><dt>Mode changes · {runtime.events.scope}</dt><dd>{value(runtime.events.audioModeChanges)}</dd></div></dl></section></div>
      {runtime.engine.active ? <section className="stats-terrain"><h3>Engine · simulated</h3><dl>{[['RPM',value(runtime.engine.rpm)],['Gear',runtime.engine.gear === 0 ? 'N' : value(runtime.engine.gear)],['Load',runtime.engine.load == null ? '—' : value(runtime.engine.load * 100,'%')]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section> : null}
      <footer className="stats-footnote">{duration(s.unknownMs)} unobserved · Acceleration/braking shares compare cumulative GPS speed gained/lost, with jitter and gap rejection; they are not measured pedal use. Elevation filtered by accuracy and hysteresis. Network excludes opaque/cache traffic. Retained events cover the bounded diagnostic log. Session statistics stay on this device until you explicitly prepare an export. Terrain: {value(terrain?.elevationM, " m")} ({terrain?.status ?? "unavailable"}), area estimate from <a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noopener noreferrer">Open-Meteo / Copernicus</a> (CC BY 4.0). When GPS height is missing, an approximately 1 km rounded area is queried while running. Map elevation is a terrain estimate, not a GPS fix.</footer>
    </div>
  </>;
}
