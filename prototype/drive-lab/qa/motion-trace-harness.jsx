// Development entry only. No sensor permission, pairing, location, audio or mail.
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionTrace } from '../src/motion/trace-view.jsx';
import { MotionPanel, MotionSteps, MotionNext } from '../src/motion/motion-ui.jsx';
import { phoneOnboarding } from '../src/motion/onboarding.js';
import { getFluxTheme } from '../src/flux-themes.js';
import { resolveSemanticTheme } from '../src/semantic-theme.js';
import '../src/styles.css';
import '../src/motion/motion.css';
function Fixture() {
  const [presentation,setPresentation]=useState({palette:'red',appearance:'dark'}),[guide,setGuide]=useState('idle');
  const snapshots={idle:{state:'idle'},connecting:{state:'connecting'},zero:{state:'connected',sensorState:'live'},ready:{state:'connected',sensorState:'live',tared:true,referenceReceived:true,receiverConfirmed:true},stale:{state:'stale'},closed:{state:'closed'}};
  const state=useRef({run:false,generation:1}), extension=useRef(null);
  const [summary,setSummary]=useState({}),[reset,setReset]=useState(0),[mode,setMode]=useState('STOPPED');
  const read=useCallback(()=>{
    if(!state.current.run)return null;
    const at=Math.floor(performance.now()/20)*20,t=at/1000;
    return {sampleAt:at,ageMs:performance.now()-at,generation:state.current.generation,
      acceleration:[Math.sin(t*1.8)*.65,Math.cos(t*1.3)*.5,Math.sin(t*.8)*.6],tilt:[Math.sin(t)*30,Math.cos(t)*25,Math.sin(t*.5)*45]};
  },[]);
  const update=useCallback(s=>setSummary(s),[]);
  return <main className="motion-phone" style={resolveSemanticTheme(getFluxTheme(presentation.palette),presentation.appearance).css}>
    <header><h1>TRACE · SYNTHETIC QA</h1></header><p>Development-only processed values. No real device evidence.</p>
    <div className="motion-actions"><button onClick={()=>setPresentation(p=>p.palette==='red'?{palette:'blue',appearance:'light'}:{palette:'red',appearance:'dark'})}>CHANGE THEME</button><select aria-label="Onboarding state" value={guide} onChange={e=>setGuide(e.target.value)}>{Object.keys(snapshots).map(s=><option key={s}>{s}</option>)}</select></div>
    <MotionPanel snapshot={snapshots[guide]} onStart={()=>setGuide('connecting')} onStop={()=>setGuide('closed')} onClose={()=>setGuide('idle')}/>
    <MotionSteps compact active={phoneOnboarding({hasPair:true,attempted:true,link:snapshots[guide],sensor:snapshots[guide]}).active}/><MotionNext guide={phoneOnboarding({hasPair:true,attempted:true,link:snapshots[guide],sensor:snapshots[guide]})}/>
    <div className="motion-actions"><button onClick={()=>{state.current.run=true;setMode('RUNNING');}}>RUN FIXTURE</button><button onClick={()=>{state.current.run=false;setMode('PAUSED');}}>PAUSE SAMPLES</button></div>
    <section className="motion-instrument"><MotionTrace getSample={read} onTelemetry={update} resetKey={reset} themeKey={`${presentation.palette}:${presentation.appearance}`}/>
    <div className="motion-view-actions"><button onClick={()=>{state.current.generation++;setMode('NEW ZERO');}}>NEW ZERO</button><button onClick={()=>setReset(n=>n+1)}>RECENTER VIEW</button></div></section>
    <div className="motion-actions"><button onClick={()=>{extension.current=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');extension.current?.loseContext();}}>LOSE GRAPHICS</button><button onClick={()=>extension.current?.restoreContext()}>RESTORE GRAPHICS</button></div>
    <output aria-label="Fixture status">{mode}</output><pre aria-label="Trace summary">{JSON.stringify(summary,null,2)}</pre>
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);
