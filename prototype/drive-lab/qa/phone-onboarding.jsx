import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MotionPhone} from '../src/motion/phone.jsx';
import {MotionPanel} from '../src/motion/motion-ui.jsx';
import {getFluxTheme} from '../src/flux-themes.js';
import {resolveSemanticTheme} from '../src/semantic-theme.js';
import '../src/styles.css';
import '../src/motion/motion.css';
// Development-only fixtures: no API, no GPS, no audio, no diagnostic delivery.
const query=new URLSearchParams(location.search), theme=query.get('theme')==='dark'?'dark':'light';
const fixture={sensorState:'idle',mountSelected:false,tared:false,tareState:'required',roadState:'not-selected',wakeLock:false,wakeState:'idle'};
let state='idle', onChange=()=>{};
const values={frame:'tare-relative',generation:1,ageMs:0,acceleration:[0,0,.18],rotation:[0,0,-1.4],tilt:[0,0,0],turnRate:-1.4,road:{longitudinalMps2:.18,yawRate:-1.4}};
const live=()=>({...fixture,state,dataFresh:state==='connected',referenceReceived:fixture.tared,receiverConfirmed:fixture.tared,received:50,rttMs:108,presentation:{palette:'red',appearance:theme},values:state==='connected'&&fixture.tared?values:null});
const sensors=()=>({start:async()=>{Object.assign(fixture,{sensorState:'live',accelerometer:true,gyroscope:true,orientation:true});},summary:()=>({...fixture}),latest:()=>fixture.tared?values:null,stop:()=>Object.assign(fixture,{sensorState:'stopped',tared:false,wakeLock:false,wakeState:'idle'}),setMount:v=>Object.assign(fixture,{mountSelected:v,tared:false,roadState:v?'needs-zero':'not-selected'}),requestTare:()=>Object.assign(fixture,{tared:true,tareState:'tared',roadState:query.has('pose-fail')?'unsupported-pose':'calibrated'}),requestWake:async()=>Object.assign(fixture,query.has('wake-denied')?{wakeLock:false,wakeState:'denied'}:{wakeLock:true,wakeState:'active'}),dispose(){}});
const session=({onChange:change})=>{onChange=change;return{start:async()=>{state='connected';onChange(live());},refresh:()=>onChange(live()),event(){},stop:()=>{state='closed';onChange(live());},dispose(){},report:()=>({synthetic:true})};};
function Receiver(){const [s,set]=useState({...live(),state:'idle'});const ready=()=>{Object.assign(fixture,{sensorState:'live',mountSelected:true,tared:true,tareState:'tared',roadState:'calibrated',wakeLock:true,wakeState:'active'});state='connected';set(live());};return <main className="qa-receiver" data-appearance={theme} style={{...resolveSemanticTheme(getFluxTheme('red'),theme).css,color:'var(--ui-text)',background:'var(--ui-surface-strong)',padding:24,minHeight:'100dvh',boxSizing:'border-box'}}><MotionPanel snapshot={s} responseLabel="Synthetic preview · not physical evidence" onStart={()=>set({...live(),state:'pairing'})} onStop={()=>set({...live(),state:'closed'})} onClose={()=>{}}/><div style={{display:'flex',gap:8,marginTop:24}}><button onClick={ready}>QA LIVE</button><button onClick={()=>set({...s,dataFresh:false,receiverConfirmed:false,values:null})}>QA DELAY</button><button onClick={()=>set({...s,wakeLock:false,wakeState:'released'})}>QA WAKE LOST</button></div></main>;}
createRoot(document.getElementById('root')).render(query.has('receiver')?<Receiver/>:<MotionPhone pair={{id:'synthetic-local-only'}} createSensors={sensors} createSession={session}/>);
