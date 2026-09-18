// Development entry only. No sensor permission, pairing, location, audio or mail.
import React, { useCallback, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionTrace } from '../src/motion/trace-view.jsx';
import { getFluxTheme } from '../src/flux-themes.js';
import { resolveSemanticTheme } from '../src/semantic-theme.js';
import '../src/styles.css';
import '../src/motion/motion.css';
function Fixture() {
  const state=useRef({run:false,generation:1}), extension=useRef(null);
  const [summary,setSummary]=useState({}),[reset,setReset]=useState(0),[mode,setMode]=useState('STOPPED');
  const read=useCallback(()=>{
    if(!state.current.run)return null;
    const at=Math.floor(performance.now()/20)*20,t=at/1000;
    return {sampleAt:at,ageMs:performance.now()-at,generation:state.current.generation,
      acceleration:[Math.sin(t*1.8)*.65,Math.cos(t*1.3)*.5,Math.sin(t*.8)*.6],tilt:[Math.sin(t)*30,Math.cos(t)*25,Math.sin(t*.5)*45]};
  },[]);
  const update=useCallback(s=>setSummary(s),[]);
  return <main className="motion-phone" style={resolveSemanticTheme(getFluxTheme('red'),'dark').css}>
    <header><h1>TRACE · SYNTHETIC QA</h1></header><p>Development-only processed values. No real device evidence.</p>
    <div className="motion-actions"><button onClick={()=>{state.current.run=true;setMode('RUNNING');}}>RUN FIXTURE</button><button onClick={()=>{state.current.run=false;setMode('PAUSED');}}>PAUSE SAMPLES</button></div>
    <section className="motion-instrument"><MotionTrace getSample={read} onTelemetry={update} resetKey={reset}/>
    <div className="motion-view-actions"><button onClick={()=>{state.current.generation++;setMode('NEW ZERO');}}>NEW ZERO</button><button onClick={()=>setReset(n=>n+1)}>RECENTER VIEW</button></div></section>
    <div className="motion-actions"><button onClick={()=>{extension.current=document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');extension.current?.loseContext();}}>LOSE GRAPHICS</button><button onClick={()=>extension.current?.restoreContext()}>RESTORE GRAPHICS</button></div>
    <output aria-label="Fixture status">{mode}</output><pre aria-label="Trace summary">{JSON.stringify(summary,null,2)}</pre>
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);
