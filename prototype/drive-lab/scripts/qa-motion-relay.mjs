// Explicit, bounded encrypted synthetic exchange. Never sends a diagnostic report.
import { webcrypto } from 'node:crypto';
import { createMotionSession } from '../src/motion/session.js';
const base = process.argv[2];
if (!base || !(base === 'https://sedicivalvole.app' || /^http:\/\/127\.0\.0\.1:\d+$/.test(base))) throw new Error('Explicit local or canonical origin required');
const host = () => ({ isSecureContext: true, crypto: webcrypto, location: { origin: base }, addEventListener() {}, removeEventListener() {} });
const doc = () => ({ visibilityState: 'visible', addEventListener() {}, removeEventListener() {} });
const request = (path, options) => fetch(base + path, { ...options, headers: { ...options.headers, Origin: 'https://sedicivalvole.app' } });
const seen = { receiver: {}, phone: {} }, accepted = [], requests = [];
let receivedReady = false, phoneReady = false, pair;
const fetcher = async (path, options) => { const started = performance.now(); const response = await request(path, options); requests.push({ status: response.status, ms: Math.round(performance.now() - started) }); return response; };
const receiver = createMotionSession({role:'receiver',host:host(),doc:doc(),fetcher,onChange:s=>{seen.receiver=s;if(s.receiverConfirmed)receivedReady=true;}});
const phone = createMotionSession({role:'phone',host:host(),doc:doc(),fetcher,
 getPhone:()=>({summary:{sensorState:'live',tared:true,tareState:'tared',accelerometer:true,gyroscope:true},values:{frame:'tare-relative',generation:1,ageMs:0,acceleration:[0,0,0],rotation:[0,0,10],tilt:[0,0,0],turnRate:10}}),
 onChange:s=>{seen.phone=s;if(s.receiverConfirmed)phoneReady=true;}});
try {
 await receiver.start(null,'https');
 if (!seen.receiver.qrUrl) throw new Error('QR creation failed');
 const parts=new URL(seen.receiver.qrUrl).hash.slice(6).split('.');pair={id:parts[0],token:parts[1],key:parts[2]};
 await phone.start(pair);
 for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,80));const s=receiver.sample();if(s)accepted.push(Math.round(s.ageMs));}
 const result={synthetic:true,origin:base,receiver:receiver.report().latest,phone:phone.report().latest,receivedReady,phoneReady,freshObservations:accepted.length,ageRangeMs:accepted.length?[Math.min(...accepted),Math.max(...accepted)]:null,httpRequests:requests.length,httpErrors:requests.filter(r=>r.status!==200).length,httpMedianMs:requests.map(r=>r.ms).sort((a,b)=>a-b)[Math.floor(requests.length/2)],privacy:{rawSamplesIncluded:false,keysIncluded:false,mailSent:false}};
 console.log(JSON.stringify(result,null,2));
 if(!receivedReady||!phoneReady) process.exitCode=1;
} finally {receiver.dispose();phone.dispose();}
