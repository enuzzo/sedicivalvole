import React, { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { FluxField } from '../src/flux-field.jsx';
import { getFluxTheme } from '../src/flux-themes.js';
import { speedToAperturePressure } from '../src/signal-model.js';
import { apertureCurveTarget } from '../src/motion/aperture-curve.js';
import './motion-aperture.css';
const noop = () => {};
function Study(){
 const [turn,setTurn]=useState(0),[fresh,setFresh]=useState(true),[reduced,setReduced]=useState(false),[speed,setSpeed]=useState(42),[renderer,setRenderer]=useState('Loading');
 const sample=useCallback(()=>fresh?{frame:'tare-relative',generation:1,turnRate:turn,ageMs:0}:null,[turn,fresh]);
 return <main><FluxField pressure={speedToAperturePressure(speed)} speed={speed} theme={getFluxTheme('mono')} reducedMotion={reduced} brake={0} effect={null} getMotionSample={sample} onFrame={noop} onRenderer={setRenderer} onRuntimeError={setRenderer}/><section>
 <small>SIMULATED SENSOR INPUT · NO AUDIO / GPS / NETWORK</small><h1>Aperture · rotation response</h1>
 <div>{[-30,0,30].map(value=><button key={value} onClick={()=>{setTurn(value);setFresh(true);}}>{value<0?'Left curve':value>0?'Right curve':'Straight'}</button>)}<button onClick={()=>setFresh(false)}>Drop sensor signal</button><button onClick={()=>setReduced(v=>!v)}>Reduced motion {reduced?'ON':'OFF'}</button><button onClick={()=>setSpeed(v=>v?0:42)}>{speed?'Stop':'Drive at 42'}</button></div>
 <p role="status">{String(renderer)} · {speed} km/h · {fresh?`${turn}°/s`:'STALE'} · bend {apertureCurveTarget(sample(),speed,reduced).toFixed(3)}</p>
 </section></main>;
}
createRoot(document.getElementById('root')).render(<Study/>);
