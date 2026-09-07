import { useEffect, useRef, useState } from 'react';
import { ATLAS_SPEED_BANDS } from './atlas-model.js';
import { sessionStatsSnapshot, SESSION_GAP_MS } from './session-stats.js';

const duration = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const value = (n, suffix = '') => Number.isFinite(n) ? `${Math.round(n)}${suffix}` : '—';

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
        const numbers = samples.map(s => s[field]).filter(Number.isFinite);
        const minimum = field === 'altitudeM' ? Math.floor(Math.min(...numbers, 0) / 50) * 50 : 0;
        const maximum = Math.max(field === 'speedKmh' ? 30 : 1, ...numbers);
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
          if (!Number.isFinite(sample[field]) || sample.containsGap || (previous && (sample.firstCapturedAtMs ?? sample.capturedAtMs) - (previous.lastCapturedAtMs ?? previous.capturedAtMs) > SESSION_GAP_MS)) { if (run.length) runs.push(run); run = []; }
          if (Number.isFinite(sample[field]) && !sample.containsGap) run.push(sample);
        }
        if (run.length) runs.push(run);
        ctx.fillStyle = color; ctx.globalAlpha = index ? .14 : .06;
        runs.forEach(points => { if (points.length < 2) return; ctx.beginPath(); ctx.moveTo(x(points[0].capturedAtMs), bottom); points.forEach(p => ctx.lineTo(x(p.capturedAtMs), y(p[field]))); ctx.lineTo(x(points.at(-1).capturedAtMs), bottom); ctx.closePath(); ctx.fill(); });
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
        let previous = null;
        for (const s of samples) {
          if (!Number.isFinite(s[field]) || s.containsGap) { previous = null; continue; }
          if (!previous || (s.firstCapturedAtMs ?? s.capturedAtMs) - (previous.lastCapturedAtMs ?? previous.capturedAtMs) > SESSION_GAP_MS) ctx.moveTo(x(s.capturedAtMs), y(s[field]));
          else ctx.lineTo(x(s.capturedAtMs), y(s[field]));
          previous = s;
        }
        ctx.stroke(); ctx.fillStyle = color;ctx.textAlign = index ? 'left' : 'right';
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
    <canvas ref={ref} role="img" aria-label={kind === 'journey' ? 'Observed GPS speed and altitude timeline. Gaps are unknown.' : 'Observed download and upload rate timeline.'}
      onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setCursor(Math.max(0, Math.min(1, (e.clientX - r.left - 36) / (r.width - 80)))); }} />
    {selected ? <output className="stats-chart-cursor">{kind === 'journey' ? `${value(selected.speedKmh, ' km/h')} · ${value(selected.altitudeM, ' m GPS')}` : `${value(selected.downloadRate, ' KB/s ↓')} · ${value(selected.uploadRate, ' KB/s ↑')}`}</output> : null}
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
  useEffect(() => {
    const refresh = () => setSnapshot({ stats: sessionStatsSnapshot(journeyRef.current.totals, performance.now()),
      samples: [...(range === "session" ? journeyRef.current.sessionSamples : journeyRef.current.recentSamples)], terrain: journeyRef.current.terrain, network: [...networkHistoryRef.current], system: readSystem() });
    refresh();const timer = setInterval(refresh, 2000);return () => clearInterval(timer);
  }, [journeyRef, networkHistoryRef, readSystem, range]);
  if (!snapshot) return null;
  const { stats: s, samples, network, system, terrain } = snapshot;
  return <>
    <header className="stats-heading"><div><small>SESSION OBSERVATORY</small><h2 id="stats-title">Stats for Nerds</h2></div><nav aria-label="Stats controls"><button data-dialog-initial-focus onClick={onClose}>Close</button></nav></header>
    <div className="stats-scroll">
      <div className="stats-headlines">
        {[[s.observedMs ? (s.distanceM / 1000).toFixed(1) : '—','km','GPS distance'],[duration(s.elapsedMs),'','Duration'],[value(s.averageKmh),'km/h','Avg speed'],[s.observedMs ? Math.round(s.movingMs/s.observedMs*100) : '—','%','Moving']].map(([n,u,label]) => <div key={label}><strong>{n}<small>{u}</small></strong><span>{label}</span></div>)}
      </div>
      {!samples.length ? <p className="stats-empty">Waiting for GPS observations. Demo driving is not recorded as a real journey.</p> : null}
      <section className="stats-main-chart"><header><strong>Speed <small>km/h</small></strong><button className="stats-range" onClick={() => setRange(r => r === "recent" ? "session" : "recent")}>{range === "recent" ? "Recent hour" : "Whole session · averaged"}</button><strong className="stats-blue">GPS altitude <small>m</small></strong></header><Trace samples={samples} /></section>
      <div className="stats-lower">
        <section><h3>Speed bands</h3>{ATLAS_SPEED_BANDS.map((b,i) => <div className="stats-band" key={b.label}><span>{b.label}</span><meter min="0" max={Math.max(1,s.observedMs)} value={s.speedBandsMs[i]} /><strong>{duration(s.speedBandsMs[i])}</strong></div>)}</section>
        <section className="stats-terrain"><h3>Journey / GPS estimates</h3><dl>{[['Elevation gain',s.elevationObservedMs ? value(s.elevationGainM,' m') : '—'],['Elevation loss',s.elevationObservedMs ? value(s.elevationLossM,' m') : '—'],['Stopped',`${duration(s.stoppedMs)} · ${s.stops} stops`],['Peak speed',value(s.peakKmh,' km/h')]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></section>
        <section className="stats-direction"><h3>Heading</h3><HeadingRose headings={s.headingMs}/></section>
      </div>
      <div className="stats-system"><section><header><h3>Network <small>KB/s ↓ / ↑</small></h3><span>{((system.network.observedDownloadBytes ?? 0)/1048576).toFixed(1)} MB observed ↓</span></header><Trace samples={network} kind="network" /></section><section className="stats-health"><h3>System</h3><dl><div><dt>Frame rate</dt><dd>{value(system.frame.averageFps,' FPS')}</dd></div><div><dt>Frame p95</dt><dd>{value(system.frame.p95FrameMs,' ms')}</dd></div><div><dt>Audio</dt><dd>{system.audio}</dd></div><div><dt>GPS coverage</dt><dd>{Math.round(s.coverage*100)}%</dd></div></dl></section></div>
      <footer className="stats-footnote">{duration(s.unknownMs)} unobserved · Elevation filtered by accuracy and hysteresis. Network excludes opaque/cache traffic. Session statistics stay on this device. Terrain: {value(terrain?.elevationM, " m")} ({terrain?.status ?? "unavailable"}), last observed Open-Meteo / Copernicus area estimate.</footer>
    </div>
  </>;
}
