/** Tiny signal plots: virtual cycle train, road ruler and committed gear selector. */
export function EngineSignals({ kind, signal, visible }) {
  const running = visible && (kind === 'rpm' ? signal.rpmRunning : kind === 'speed' ? signal.speedRunning : false);
  return <svg className={`engine-micro-signal signal-${kind}`} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true"
    data-running={running} data-engaged={signal.gearEngaged} data-phase={signal.phase}
    style={{ '--signal-period': `${kind === 'rpm' ? signal.rpmSeconds : signal.speedSeconds}s`, '--pulse-height': signal.pulseHeight }}>
    <path className="signal-baseline" d="M0 23H240" />
    {kind === 'rpm' ? <g className="signal-pulse-envelope"><g className="signal-travel">
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${i * 48} 23h12l4-3 4-16 5 22 4-6 4 3h15`} />)}
    </g></g> : kind === 'speed' ? <>
      <g className="signal-travel">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${i * 24} 23v${i % 2 ? -8 : -15}`} />)}</g>
      <path className="signal-index" d="M116 2h8l-4 5z" />
    </> : <>
      {Array.from({ length: 6 }, (_, i) => <path className="signal-ratio" key={i} d={`M${12 + i * 40} 18h16m-8-4v9`} />)}
      {signal.gear !== null && <g className="signal-gear-selector" style={{ transform: `translateX(${(signal.gear - 1) * 40}px)` }}>
        <path className="signal-clutch-top" d="M8 9l5-5h14l5 5" />
        <path className="signal-clutch-bottom" d="M8 15l5 5h14l5-5" />
      </g>}
    </>}
  </svg>;
}
