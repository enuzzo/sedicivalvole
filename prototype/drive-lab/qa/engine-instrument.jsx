// Development-only silent renderer bench. No audio, geolocation, network or reports.
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {EngineTelemetry} from '../src/engine/telemetry-field.jsx';
import {engineProfile} from '../src/engine/profiles.js';
import {virtualRpm,decideAutomaticGear} from '../src/engine/gearbox.js';
import {planEngineShift,sampleEngineShift} from '../src/engine/powertrain.js';
import {resolveSemanticTheme} from '../src/semantic-theme.js';
import {getFluxTheme} from '../src/flux-themes.js';
import '../src/styles.css';
import '../src/phone-cockpit.css';
import '../src/contextual-rail.css';
import '../src/engine/telemetry-metrics.css';
import './engine-instrument.css';
function Preview(){
 const [appearance,setAppearance]=useState('dark'),[mode,setMode]=useState('drive'),[sample,setSample]=useState({speed:0,state:{}});
 const [paused,setPaused]=useState(false),[profileId,setProfileId]=useState('mono');
 const clock=useRef(0), pauseRef=useRef(paused);
 pauseRef.current=paused;
 useEffect(()=>{
  const profile=engineProfile(profileId),drivetrain=profile.configuration.drivetrain;
  let raf,previous=performance.now(),last=0,gear=1,selectedAt=clock.current,shift=null;
  function frame(now){
   const dt=Math.min(.08,(now-previous)/1000);previous=now;
   if(!pauseRef.current&&document.visibilityState!=='hidden') clock.current+=dt;
   if(now-last>=50){
    last=now;const t=clock.current%32;
    const speed=mode==='idle'?0:mode==='lost'?42:t<3?0:t<15?(t-3)*8:t<19?96:Math.max(0,96-(t-19)*10);
    const drive=t<15?.7:.12;
    let state={status:'ready',playing:!pauseRef.current,enabled:!pauseRef.current,motion:mode==='lost'?'lost':pauseRef.current?'degraded':'fresh',gear,rpm:speed===0?600:virtualRpm(speed,gear,drivetrain),drive,deceleration:t>19&&speed>0?.6:0,canRev:false,trustedStationary:speed===0,transmissionMode:'AUTO'};
    if(mode==='lost') {state.rpm=1000;shift=null;}
    else if(!pauseRef.current){
     const decision=decideAutomaticGear({gear,speedKmh:speed,drive,canShift:true,heldSeconds:clock.current-selectedAt},profile,drivetrain);
     if(!shift&&decision){shift=planEngineShift({at:clock.current,fromRpm:state.rpm,toRpm:virtualRpm(speed,decision.gear,drivetrain),fromGear:gear,toGear:decision.gear,fromLoad:drive,duration:profile.duration,profile});selectedAt=clock.current;}
     if(shift){const a=sampleEngineShift(shift,clock.current);state.rpm=a.rpm;state.shiftPhase=a.phase;state.shift=shift.toGear>shift.fromGear?'upshift':'downshift';if(clock.current>=shift.commitAt)gear=shift.toGear;state.gear=gear;if(clock.current>=shift.endAt)shift=null;}
    }
    setSample({speed,state});
   }
   raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
 },[mode,profileId]);
 return <main className="app phase-running controls-resting engine-instrument-preview" data-phone-layout={innerHeight<=450?'landscape':undefined} data-appearance={appearance} style={resolveSemanticTheme(getFluxTheme('red'),appearance).css}>
  <EngineTelemetry {...sample} speedSource="GPS" profileId={profileId} onProfile={setProfileId} onSpeedSource={()=>setMode(v=>v==='lost'?'drive':'lost')} />
  <aside className="instrument-preview-controls" aria-label="Silent simulation controls"><strong>SIMULATED INPUT · NO AUDIO</strong><div>
   <button onClick={()=>setPaused(v=>!v)}>{paused?'Resume':'Pause'}</button>
   <button onClick={()=>{clock.current=0;setMode('drive')}}>Drive sequence</button>
   <button onClick={()=>setMode('idle')}>Stationary</button>
   <button onClick={()=>setMode('lost')}>Signal lost</button>
   <button onClick={()=>setAppearance(v=>v==='dark'?'light':'dark')}>{appearance==='dark'?'Light':'Dark'}</button>
  </div></aside>
 </main>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
