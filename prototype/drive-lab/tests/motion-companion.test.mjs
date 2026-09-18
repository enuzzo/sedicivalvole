import test from 'node:test';
import assert from 'node:assert/strict';
import { orientationMatrix, applyRotation, advanceOrientation, createPoseReference, rotationVector } from '../src/motion/reference.js';
import { createPhoneSensors } from '../src/motion/sensors.js';
import { createMotionProtocol } from '../src/motion/channel.js';
import { createMotionTelemetry, safeMotionSummary } from '../src/motion/telemetry.js';
import { createMotionSession } from '../src/motion/session.js';
import { phoneStatus } from '../src/motion/phone-status.js';
const identity = () => orientationMatrix({alpha:0,beta:0,gamma:0});
const near = (a,b) => a.forEach((v,i) => assert.ok(Math.abs(v-b[i])<1e-6, `${a} != ${b}`));
const sample = (extra={}) => ({at:0,orientationAt:0,orientation:identity(),acceleration:[0,0,0],rotation:[0,0,0],gravity:[0,0,9.81],...extra});
for (const pose of [{alpha:0,beta:0,gamma:0},{alpha:40,beta:90,gamma:0},{alpha:123,beta:-62,gamma:38}]) {
  test(`one tap sets zero in stable pose ${JSON.stringify(pose)}`, () => {
    const ref=createPoseReference(), s=sample({orientation:orientationMatrix(pose)});
    assert.equal(ref.tare(s,0),'tared');
    near(ref.project(s,0).tilt,[0,0,0]);
    near(ref.project({...s,acceleration:[1,2,3]},0).acceleration,[1,2,3]);
  });
}
test('relative acceleration rotates into initial frame without inventing road speed',()=>{
  const ref=createPoseReference(); ref.tare(sample(),0);
  const result=ref.project(sample({orientation:orientationMatrix({alpha:90,beta:0,gamma:0}),acceleration:[1,0,0]}),0);
  near(result.acceleration,[0,1,0]); near(result.tilt,[0,0,90]); assert.equal('speed' in result,false);
});
test('heading wraps locally and half-turn stays finite',()=>{
  const ref=createPoseReference(); ref.tare(sample({orientation:orientationMatrix({alpha:359,beta:0,gamma:0})}),0);
  near(ref.project(sample({orientation:orientationMatrix({alpha:1,beta:0,gamma:0})}),0).tilt,[0,0,2]);
  near(rotationVector(orientationMatrix({alpha:180,beta:0,gamma:0})),[0,0,180]);
});
test('upright phone extracts turn about gravity independently of mounting',()=>{
  const ref=createPoseReference(), upright=sample({orientation:orientationMatrix({alpha:0,beta:90,gamma:0}),gravity:[0,9.81,0]});
  ref.tare(upright,0); assert.equal(ref.project({...upright,rotation:[0,12,0]},0).turnRate,12);
});
test('tare rejects movement, incomplete and stale readings; never subtracts actual acceleration',()=>{
  const ref=createPoseReference();
  assert.equal(ref.tare(sample({acceleration:[1,0,0]}),0),'hold-still');
  assert.equal(ref.tare(sample({rotation:[0,6,0]}),0),'hold-still');
  assert.equal(ref.tare(sample({gravity:[0,0,0]}),0),'hold-still');
  assert.equal(ref.tare(sample({acceleration:null}),0),'unavailable');
  assert.equal(ref.tare(sample(),251),'unavailable');
  assert.equal(ref.tare(sample(),-1),'unavailable');
  ref.tare(sample({acceleration:[0.1,0,0]}),0);
  near(ref.project(sample({acceleration:[0.1,0,0]}),0).acceleration,[0.1,0,0]);
  assert.equal(ref.project(sample(),251),null); ref.clear(); assert.equal(ref.project(sample(),0),null);
});
test('gyro propagation handles sparse orientation but refuses execution gaps',()=>{
  near(rotationVector(advanceOrientation(identity(),[0,0,90],0.1)),[0,0,9]);
  assert.equal(advanceOrientation(identity(),[0,0,90],0.251),null);
  assert.equal(advanceOrientation(identity(),null,0.1),null);
});
function surface() {
  const listeners=new Map(); return {visibilityState:'visible',isSecureContext:true,navigator:{userActivation:{isActive:true}},location:{origin:'https://example.test'},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    emit(type,event={}){for(const fn of [...(listeners.get(type)??[])])fn({isTrusted:true,...event});},
  };
}
function sensorFixture() {
  let time=0;const host=surface(),doc=surface();host.DeviceMotionEvent={};host.DeviceOrientationEvent={};
  const events=[]; const sensor=createPhoneSensors({host,doc,now:()=>time,onEvent:(...e)=>events.push(e)});
  return {host,doc,sensor,events,time:(n)=>{time=n;},orient:()=>host.emit('deviceorientation',{alpha:0,beta:0,gamma:0}),
    motion:(extra={})=>host.emit('devicemotion',{acceleration:{x:0,y:0,z:0},accelerationIncludingGravity:{x:0,y:0,z:9.81},rotationRate:{alpha:0,beta:0,gamma:0},...extra})};
}
test('both permission requests originate synchronously in the enabling gesture',async()=>{
  const f=sensorFixture(); const requests=[];let complete;
  f.host.DeviceMotionEvent.requestPermission=()=>{requests.push('motion');return new Promise(r=>{complete=r;});};
  f.host.DeviceOrientationEvent.requestPermission=()=>{requests.push('orientation');return Promise.resolve('granted');};
  const start=f.sensor.start();assert.deepEqual(requests,['motion','orientation']);complete('granted');await start;
  assert.equal(f.sensor.summary().sensorState,'waiting'); f.sensor.dispose();
});
test('denial and a late permission response cannot start hidden sensors',async()=>{
  const f=sensorFixture();f.host.DeviceMotionEvent.requestPermission=()=>Promise.resolve('denied');
  await f.sensor.start();assert.equal(f.sensor.summary().sensorState,'denied');
  let resolve;f.host.DeviceMotionEvent.requestPermission=()=>new Promise(r=>{resolve=r;});
  const start=f.sensor.start();f.doc.visibilityState='hidden';f.doc.emit('visibilitychange');resolve('granted');await start;
  f.motion();assert.equal(f.sensor.summary().motionEvents,0);assert.equal(f.sensor.summary().sensorState,'suspended');f.sensor.dispose();
});
test('stationary sparse orientation stays usable, a gap requires retare, and hidden clears it',async()=>{
  const f=sensorFixture();await f.sensor.start();f.orient();f.motion();assert.equal(f.sensor.tare(),'tared');
  for(let t=20;t<=1000;t+=20){f.time(t);f.motion();}
  assert.equal(f.sensor.summary().orientationEvents,1);assert.equal(f.sensor.summary().orientationEstimated,true);assert.ok(f.sensor.latest());
  f.time(1300);assert.equal(f.sensor.latest(),null);assert.equal(f.sensor.summary().tared,false);
  f.orient();f.motion();assert.equal(f.sensor.tare(),'tared');
  f.doc.visibilityState='hidden';f.doc.emit('visibilitychange');assert.equal(f.sensor.latest(),null);assert.equal(f.sensor.summary().visibilityStops,1);f.sensor.dispose();
});
test('synthetic DOM events and null sensor axes never masquerade as real sensor data',async()=>{
  const f=sensorFixture();await f.sensor.start();f.orient();f.motion({isTrusted:false});assert.equal(f.sensor.summary().motionEvents,0);
  f.motion({acceleration:{x:null,y:0,z:0}});assert.equal(f.sensor.summary().accelerometer,false);assert.equal(f.sensor.tare(),'unavailable');f.sensor.dispose();
});
const values={frame:'tare-relative',generation:1,acceleration:[1,2,3],rotation:[0,0,2],tilt:[0,0,1],turnRate:2,ageMs:10};
function protocols(){let time=0;const receiver=createMotionProtocol({role:'receiver',now:()=>time}),phone=createMotionProtocol({role:'phone',now:()=>time,getPhone:()=>({values,summary:{sensorState:'live',tared:true,token:'secret',sdp:'private'}})});return {receiver,phone,time:(t)=>{time=t;}};}
test('processed sample roundtrip is fresh only within sender age plus measured roundtrip',()=>{
  const f=protocols(),poll=f.receiver.poll();f.time(20);const answer=f.phone.receive(poll);f.time(40);f.receiver.receive(answer);
  assert.deepEqual(f.receiver.sample().acceleration,[1,2,3]);assert.equal(f.receiver.summary().ageUpperMs,50);
  assert.equal(f.receiver.summary().token,undefined);f.time(241);assert.equal(f.receiver.sample(),null);
  f.receiver.receive(answer);assert.equal(f.receiver.summary().rejected,1);
});
test('expired, replayed, unmatched and malformed channel messages are rejected',()=>{
  const f=protocols(); const answer=f.phone.receive(f.receiver.poll());f.time(251);f.receiver.receive(answer);assert.equal(f.receiver.sample(),null);
  f.receiver.poll();assert.equal(f.receiver.summary().expiredRequests,1);f.receiver.receive(answer);
  for(const text of ['null','{',JSON.stringify({v:'sv-motion-1',kind:'sample',request:1,sequence:2,ageMs:0,values:{...values,tilt:[Infinity,0,0]},summary:null})]) f.receiver.receive(text);
  assert.equal(f.receiver.sample(),null);assert.equal(f.phone.receive(JSON.stringify({v:'sv-motion-1',kind:'poll',request:0})),null);
});
test('diagnostics are bounded aggregates and reject arbitrary nesting or secrets',()=>{
  let t=0;const tel=createMotionTelemetry(()=>t);const hostile={state:'connected',sensorState:'live',cadenceHz:60,token:'secret',sdp:'private',values,coordinates:[1,2],nested:{token:'secret'}};
  for(let i=0;i<500;i++){t+=2000;tel.update(hostile);tel.event('tare',hostile);}tel.event('secret',hostile);
  const report=tel.snapshot();assert.equal(report.history.length,300);assert.equal(report.events.length,120);assert.equal(report.totalEvents,500);
  assert.doesNotMatch(JSON.stringify(report),/secret|private|acceleration|"coordinates"|"sdp"/);
  assert.deepEqual(safeMotionSummary(null),{});report.latest.state='evil';assert.equal(tel.snapshot().latest.state,'connected');
});
test('stopping during signaling never revives a session or exposes the capability',async()=>{
  const host=surface(),doc=surface();host.RTCPeerConnection=function(){};let resolve;
  const snapshots=[]; const session=createMotionSession({role:'receiver',host,doc,onChange:s=>snapshots.push(s),
    peerFactory:()=>({offer:()=>new Promise(r=>{resolve=r;}),close(){},summary:()=>({state:'connecting'}),sample:()=>null}),
    fetcher:()=>{throw Error('must not fetch after stop');}});
  const start=session.start();session.stop();resolve('v=0 fixture');await start;
  assert.equal(snapshots.at(-1).state,'closed');assert.equal(snapshots.at(-1).qrUrl,null);assert.doesNotMatch(JSON.stringify(session.report()),/fixture|token|sdp/);session.dispose();
});
test('signaling failure records its stage and HTTP status without payload or exception strings',async()=>{
 const host=surface(),doc=surface();host.RTCPeerConnection=function(){};
 const session=createMotionSession({role:'receiver',host,doc,
  peerFactory:()=>({offer:async()=> 'v=0 private-description',close(){},summary:()=>({state:'connecting'}),sample:()=>null}),
  fetcher:async()=>({ok:false,status:403})});
 await session.start();const report=session.report(),error=report.events.find(e=>e.type==='error');
 assert.equal(error.stage,'create');assert.equal(error.signalingStatus,403);assert.equal(error.signalingErrors,1);
 assert.doesNotMatch(JSON.stringify(report),/private-description|sdp|token/);session.dispose();
});
test('missing WebRTC is reported separately from a failed network connection',async()=>{
 const host=surface(),doc=surface();const session=createMotionSession({role:'receiver',host,doc});
 await session.start();assert.equal(session.report().latest.state,'unavailable');session.dispose();
});

test('incomplete fresh events invalidate zero and never claim live sensing',async()=>{
 const f=sensorFixture();await f.sensor.start();f.orient();f.motion();assert.equal(f.sensor.tare(),'tared');
 f.time(20);f.motion({rotationRate:{alpha:null,beta:0,gamma:0}});
 assert.equal(f.sensor.summary().sensorState,'incomplete');assert.equal(f.sensor.summary().tared,false);assert.equal(f.sensor.latest(),null);
 f.time(40);f.orient();f.motion();assert.equal(f.sensor.summary().sensorState,'live');assert.equal(f.sensor.latest(),null);
 assert.equal(f.sensor.tare(),'tared');f.sensor.dispose();
});
test('receiver clears stale remote zero while phone summary preserves local ownership',()=>{
 const f=protocols();f.receiver.receive(f.phone.receive(f.receiver.poll()));assert.equal(f.receiver.summary().tared,true);
 f.time(251);assert.equal(f.receiver.summary().tared,false);assert.equal(f.receiver.summary().sensorState,'stale');
 assert.equal(f.phone.summary().tared,undefined);assert.equal(f.phone.summary().sensorState,undefined);
});
test('failed recalibration preserves the old frame and explicitly reports rejection',async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion();assert.equal(f.sensor.tare(),'tared');
  f.time(20);f.motion({acceleration:{x:1,y:0,z:0}});assert.equal(f.sensor.tare(),'hold-still');
  assert.equal(f.sensor.summary().tared,true);assert.ok(f.sensor.latest());
  assert.match(phoneStatus({sensor:f.sensor.summary()}).instruction,/New ZERO rejected/);
  assert.match(phoneStatus({sensor:f.sensor.summary()}).instruction,/previous reference/);
  f.time(40);f.motion();assert.equal(f.sensor.tare(),'tared');
  assert.match(phoneStatus({sensor:f.sensor.summary()}).instruction,/Zero set/);
 }finally{f.sensor.dispose();}
});
test('first use and recovery never present a local instrument as a Tesla connection',()=>{
 assert.match(phoneStatus().connection,/Local only/);assert.equal(phoneStatus().action,'ENABLE LOCAL SENSORS');
 assert.equal(phoneStatus({hasPair:true}).canJoin,true);
 const denied=phoneStatus({hasPair:true,attempted:true,link:{state:'connected'},sensor:{sensorState:'denied'}});
 assert.equal(denied.action,'RETRY SENSORS');assert.equal(denied.canJoin,false);assert.match(denied.instruction,/denied/);
 for(const state of ['closed','expired','error','suspended','unavailable']){
  const result=phoneStatus({hasPair:true,attempted:true,link:{state}});
  assert.equal(result.canJoin,false);assert.equal(result.connected,false);assert.match(result.recovery,/CREATE QR|WebRTC support/);
 }
 assert.match(phoneStatus({hasPair:true,link:{state:'unavailable'}}).recovery,/unavailable in this browser/);
 const localDenied=phoneStatus({sensor:{sensorState:'denied'}});
 assert.ok(localDenied.instruction.includes(localDenied.action));
 assert.match(phoneStatus({sensor:{sensorState:'waiting',waitingMs:6000}}).instruction,/No sensor readings/);
 assert.doesNotMatch(phoneStatus({sensor:{sensorState:'stale',tared:false}}).instruction,/Zero set/);
 assert.match(phoneStatus({sensor:{sensorState:'incomplete'}}).instruction,/incomplete/);
});

function sessionFixture(options={}) {
 const host=surface(),doc=surface();host.RTCPeerConnection=function(){};
 let time=0,peerState='connecting',hooks,closes=0;
 const snapshots=[],calls=[];
 const pair={id:'a'.repeat(32),token:'b'.repeat(64)};
 const response=value=>({ok:true,status:200,text:async()=>JSON.stringify(value)});
 const session=createMotionSession({role:'phone',host,doc,now:()=>time,onChange:s=>snapshots.push(s),
  peerFactory:params=>{hooks=params;return {offer:async()=> 'fixture',answer:async()=> 'fixture',accept:async()=>{},close(){closes++;},summary:()=>({state:peerState}),sample:()=>null};},
  fetcher:async(_url,request)=>{const body=JSON.parse(request.body);calls.push(body.action);return response(body.action==='create'?{...pair,join:'c'.repeat(64)}:{token:'c'.repeat(64),sdp:'fixture'});},...options});
 return {session,host,doc,snapshots,calls,pair,response,time:n=>{time=n;},closes:()=>closes,
  emit:(type,state='connected')=>{peerState=state;hooks.onEvent(type,{state});}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('double taps, permission retry and consumed QR cannot replace a pairing',async()=>{
 const f=sessionFixture();try {
  const first=f.session.start(f.pair);await f.session.start(f.pair);await first;
  assert.equal(f.calls.filter(a=>a==='join').length,1);
  f.emit('channel-open');await f.session.start(f.pair);assert.equal(f.calls.filter(a=>a==='join').length,1);
  f.session.stop();await f.session.start(f.pair);assert.equal(f.calls.filter(a=>a==='join').length,1);
  assert.equal(f.snapshots.at(-1).state,'closed');
 }finally{f.session.dispose();}
});
test('an unreachable direct connection expires in 30 seconds without automatic retries',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});const f=sessionFixture();
 try{await f.session.start(f.pair);f.time(30001);t.mock.timers.tick(30001);
  assert.equal(f.snapshots.at(-1).state,'expired');assert.equal(f.calls.filter(a=>a==='join').length,1);
  assert.ok(f.closes()>0);
 }finally{f.session.dispose();}
});
test('a stopped late join is deleted and cannot publish a connection',async()=>{
 let resolve;const actions=[];const f=sessionFixture({fetcher:(_url,request)=>{
  const body=JSON.parse(request.body);actions.push(body.action);
  return body.action==='join'?new Promise(r=>resolve=r):Promise.resolve({ok:true,status:200,text:async()=> '{}' });
 }});
 try{const start=f.session.start(f.pair);f.session.stop();resolve(f.response({token:'c'.repeat(64),sdp:'fixture'}));await start;await settle();
  assert.deepEqual(actions,['join','delete']);assert.equal(f.snapshots.at(-1).state,'closed');
  assert.doesNotMatch(JSON.stringify(f.session.report()),/fixture|"token"|"sdp"/);
 }finally{f.session.dispose();}
});
test('offline and peer closure release setup state and erase QR capability',async()=>{
 const f=sessionFixture({role:'receiver'});try{
  await f.session.start();assert.ok(f.snapshots.at(-1).qrUrl);f.host.emit('offline');
  assert.equal(f.snapshots.at(-1).state,'error');assert.equal(f.snapshots.at(-1).qrUrl,null);
  await f.session.start();f.emit('stop','closed');assert.equal(f.snapshots.at(-1).qrUrl,null);
  assert.equal(f.snapshots.at(-1).state,'closed');
 }finally{f.session.dispose();}
});
test('used/expired admission and malformed server responses have bounded recovery',async()=>{
 for(const status of [403,404,409,410,500,200]){
  const f=sessionFixture({fetcher:async()=>({ok:status===200,status,text:async()=>'<html>unavailable</html>'})});
  try{await f.session.start(f.pair);assert.equal(f.snapshots.at(-1).state,[403,410].includes(status)?'expired':'error');
   assert.equal(f.snapshots.at(-1).qrUrl,null);
  }finally{f.session.dispose();}
 }
});
test('an HTTP timeout exits pending setup and permits explicit receiver recovery',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});let attempts=0;
 const f=sessionFixture({role:'receiver',fetcher:(_url,request)=>{attempts++;return new Promise((_resolve,reject)=>request.signal.addEventListener('abort',()=>reject(new Error('aborted'))));}});
 try{const run=f.session.start();await Promise.resolve();t.mock.timers.tick(10001);await run;
  assert.equal(f.snapshots.at(-1).state,'error');assert.equal(attempts,1);assert.equal(f.session.report().latest.signalingErrors,1);
 }finally{f.session.dispose();}
});
test('a joined receiver QR disappears and its remaining setup is bounded',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const f=sessionFixture({role:'receiver',fetcher:async(_url,request)=>{
  const action=JSON.parse(request.body).action;
  return {ok:true,status:200,text:async()=>JSON.stringify(action==='create'?{id:'a'.repeat(32),token:'b'.repeat(64),join:'c'.repeat(64)}:{status:'joined'})};
 }});
 try{await f.session.start();assert.ok(f.snapshots.at(-1).qrUrl);
  f.time(1100);t.mock.timers.tick(1100);await settle();f.session.refresh();
  assert.equal(f.snapshots.at(-1).qrUrl,null);assert.equal(f.snapshots.at(-1).state,'connecting');
  f.time(31101);t.mock.timers.tick(30001);assert.equal(f.snapshots.at(-1).state,'expired');
 }finally{f.session.dispose();}
});

test('ZERO waits past the tap movement, then captures a continuous half second of stillness',async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion({rotationRate:{alpha:20,beta:0,gamma:0}});
  assert.equal(f.sensor.requestTare(),'settling');assert.equal(f.sensor.summary().tareReason,'rotation');
  assert.equal(f.sensor.latest(),null);assert.equal(f.sensor.activity().rotation,20);
  for(let t=20;t<=500;t+=20){f.time(t);f.motion();assert.equal(f.sensor.summary().tared,false);}
  f.time(520);f.motion();assert.equal(f.sensor.summary().tared,true);assert.equal(f.sensor.summary().tareCount,1);
  f.time(540);f.motion({acceleration:{x:2,y:0,z:0}});assert.ok(f.sensor.latest().acceleration[0]>0);
 }finally{f.sensor.dispose();}
});
test('ZERO settling restarts after movement or a sampling gap and duplicate taps do not extend it',async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion();f.sensor.requestTare();
  for(let t=20;t<=400;t+=20){f.time(t);f.motion();}
  f.time(420);f.motion({acceleration:{x:2,y:0,z:0}});
  for(let t=440;t<=900;t+=20){f.time(t);f.motion();}
  assert.equal(f.sensor.summary().tared,false);
  f.time(1200);f.orient();f.motion();assert.equal(f.sensor.summary().tared,false);
  for(let t=1220;t<=1680;t+=20){f.time(t);f.motion();}
  assert.equal(f.sensor.summary().tared,false);f.time(1700);f.motion();assert.equal(f.sensor.summary().tared,true);
 }finally{f.sensor.dispose();}
});
for(const [reason,extra] of [['rotation',{rotationRate:{alpha:20,beta:0,gamma:0}}],['acceleration',{acceleration:{x:1,y:0,z:0}}],['gravity',{accelerationIncludingGravity:{x:0,y:0,z:1}}]]) {
 test(`ZERO ends after eight seconds and records ${reason} without raw samples`,async()=>{
  const f=sensorFixture();try {
   await f.sensor.start();f.orient();f.motion(extra);f.sensor.requestTare();
   for(let t=20;t<=8000;t+=20){f.time(t);if(t===6000)f.sensor.requestTare();f.motion(extra);}
   assert.equal(f.sensor.summary().tared,false);assert.equal(f.sensor.summary().tareState,'hold-still');
   assert.equal(f.sensor.summary().tareReason,reason);assert.equal(f.sensor.latest(),null);
   const safe=safeMotionSummary(f.sensor.summary());assert.equal(safe.tareReason,reason);assert.equal(safe.activity,undefined);
   f.time(8020);f.motion();assert.equal(f.sensor.summary().tared,false);
  }finally{f.sensor.dispose();}
 });
}
test('pending ZERO expires when events stop and never resumes itself',async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion();f.sensor.requestTare();
  f.time(8001);assert.equal(f.sensor.summary().tareState,'unavailable');assert.equal(f.sensor.activity(),null);
  f.orient();f.motion();assert.equal(f.sensor.summary().tared,false);
 }finally{f.sensor.dispose();}
});
for(const stop of ['stop','hide'])test(`pending ZERO is cancelled by ${stop}`,async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion();f.sensor.requestTare();
  if(stop==='stop')f.sensor.stop();else{f.doc.visibilityState='hidden';f.doc.emit('visibilitychange');}
  f.time(600);f.motion();assert.equal(f.sensor.summary().tared,false);assert.equal(f.sensor.summary().tareState,'required');
  assert.equal(f.sensor.activity(),null);
 }finally{f.sensor.dispose();}
});
test('recalibration continues to identify its old reference until the stable window succeeds',async()=>{
 const f=sensorFixture();try {
  await f.sensor.start();f.orient();f.motion();f.sensor.tare();f.sensor.requestTare();
  assert.match(phoneStatus({sensor:f.sensor.summary()}).instruction,/previous reference/);
  assert.ok(f.sensor.latest());
  for(let t=20;t<=520;t+=20){f.time(t);f.motion();}
  assert.equal(f.sensor.summary().tareCount,2);assert.equal(f.sensor.summary().tareState,'tared');
 }finally{f.sensor.dispose();}
});
