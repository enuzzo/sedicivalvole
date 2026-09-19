import { createMotionSession } from '../src/motion/session.js';
if (!import.meta.env.DEV) throw new Error('Local QA only');
let phone,receiver,paused=false,joining=false,receipt=null,phoneState=null,presentation={palette:'blue',appearance:'light'};
const output=document.querySelector('#result');
function render(){output.textContent=JSON.stringify({fixture:'SYNTHETIC — not physical sensor proof',receiver:receipt,phone:phoneState},null,2);}
function stop(){receiver?.dispose();phone?.dispose();receiver=phone=null;}
document.querySelector('#run').onclick=()=>{
 stop();paused=false;joining=false;
 phone=createMotionSession({role:'phone',getPhone:()=>({summary:{sensorState:paused?'stale':'live',accelerometer:true,gyroscope:true,orientation:true,tared:!paused,tareCount:1,cadenceHz:50},values:paused?null:{frame:'tare-relative',generation:1,acceleration:[1,2,3],rotation:[0,0,1],tilt:[0,0,0.5],turnRate:1,ageMs:0}}),onChange:s=>{phoneState={state:s.state,sent:s.sent,receiverConfirmed:s.receiverConfirmed,presentation:s.presentation};render();}});
 receiver=createMotionSession({role:'receiver',getPresentation:()=>presentation,onChange:s=>{
   receipt={state:s.state,received:s.received,rttMs:s.rttMs,tared:s.tared,receiverConfirmed:s.receiverConfirmed,referenceReceived:s.referenceReceived,samplePresent:Boolean(s.values),sensorState:s.sensorState};render();
   if(s.qrUrl&&!joining){joining=true;const [id,token]=new URL(s.qrUrl).hash.slice(6).split('.');void phone.start({id,token});}
 }});void receiver.start();
};
document.querySelector('#theme').onclick=()=>{presentation={palette:'mint',appearance:'dark'};};
document.querySelector('#pause').onclick=()=>{paused=!paused;};
document.querySelector('#stop').onclick=()=>{stop();output.textContent='Stopped. Both peers disposed.';};
window.addEventListener('pagehide',stop);
