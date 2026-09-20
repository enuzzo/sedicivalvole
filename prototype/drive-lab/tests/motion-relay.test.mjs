import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createMotionCipher, createRelayKey, createMotionRelay } from '../src/motion/relay.js';
import { apertureCurveTarget, advanceApertureCurve } from '../src/motion/aperture-curve.js';
import { createMotionSession } from '../src/motion/session.js';
import { createMotionProtocol, createMotionPeer } from '../src/motion/channel.js';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const values = () => ({ frame: 'tare-relative', generation: 1, acceleration: [0,0,0], rotation: [0,0,10], tilt: [0,0,0], turnRate: 10, ageMs: 0 });
const phone = () => ({ values: values(), summary: { tared: true, sensorState: 'live' } });

test('pipelined HTTPS polls accept matching earlier replies without admitting expired or replayed motion', () => {
 let t=0; const now=()=>t;
 const receiver=createMotionProtocol({role:'receiver',now,maxPending:8});
 const sender=createMotionProtocol({role:'phone',now,getPhone:phone});
 const first=receiver.poll();t=50;const second=receiver.poll();
 assert.ok(second,'another request can travel while the earlier response is returning');
 t=75;const a=sender.receive(first);t=125;const b=sender.receive(second);
 t=150;receiver.receive(a);assert.ok(receiver.sample());
 t=200;receiver.receive(b);assert.equal(receiver.summary().received,2);
 receiver.receive(a);assert.equal(receiver.summary().received,2);
 t=301;assert.equal(receiver.sample(),null,'the 250 ms upper bound is not extended');
 const late=receiver.poll();t=380;const reply=sender.receive(late);t=600;receiver.receive(reply);
 assert.equal(receiver.sample(),null);assert.ok(receiver.summary().latencyDrops>0);
});

test('HTTPS remains connected before ZERO and supplies sustained fresh motion across realistic request latency', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto),slots={};let calibrated=false,delay=50;
 const exchange=role=>async packet=>{
  await sleep(delay/2);if(packet)slots[role]={sequence:(slots[role]?.sequence??0)+1,packet};
  const reply={...(slots[role==='phone'?'receiver':'phone']??{})};await sleep(delay/2);return reply;
 };
 const receiver=createMotionRelay({role:'receiver',cipher,exchange:exchange('receiver')});
 const sender=createMotionRelay({role:'phone',cipher,exchange:exchange('phone'),getPhone:()=>calibrated?phone():{values:null,summary:{sensorState:'live',tared:false}}});
 try {
  await sleep(400);
  for(let i=0;i<20;i++){assert.equal(receiver.summary().state,'connected');assert.equal(receiver.sample(),null);await sleep(20);}
  calibrated=true;await sleep(600);let fresh=0,confirmed=0;
  for(let i=0;i<60;i++){fresh+=Boolean(receiver.sample());confirmed+=Boolean(receiver.summary().receiverConfirmed);await sleep(20);}
  assert.ok(fresh>=57,`fresh at ${fresh}/60 observations`);assert.ok(confirmed>=54,`mutual receipt at ${confirmed}/60 observations`);
  delay=180;await sleep(1000);
  assert.equal(receiver.summary().state,'connected','slow data is not a transport disconnect');
  assert.equal(receiver.sample(),null);assert.equal(receiver.summary().receiverConfirmed,false);
 }finally{receiver.close();sender.close();}
});

test('relay encryption authenticates contents and direction; fresh nonces hide repeated packets', async () => {
 const secret=createRelayKey(webcrypto), cipher=await createMotionCipher(secret,webcrypto);
 const a=await cipher.seal('private sample','phone'), b=await cipher.seal('private sample','phone');
 assert.notEqual(a,b); assert.equal(await cipher.open(a,'phone'),'private sample');
 await assert.rejects(cipher.open(a,'receiver'));
 await assert.rejects(cipher.open(a.slice(0,-5)+'aaaa=','phone'));
 await assert.rejects((await createMotionCipher(createRelayKey(webcrypto),webcrypto)).open(a,'phone'));
});
test('two encrypted mailbox peers reach mutual readiness; slow delivery cannot steer Aperture', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto);
 const slots={}; let slow=false; const peers=[];
 const exchange=role=>async packet=>{ await sleep(slow?150:2); if(packet)slots[role]={sequence:(slots[role]?.sequence??0)+1,packet}; return slots[role==='phone'?'receiver':'phone']??{}; };
 try {
  peers.push(createMotionRelay({role:'receiver',cipher,exchange:exchange('receiver')}), createMotionRelay({role:'phone',cipher,exchange:exchange('phone'),getPhone:phone}));
  for(let i=0;i<100&&!peers[0].summary().receiverConfirmed;i++)await sleep(20);
  assert.equal(peers[0].summary().receiverConfirmed,true);
  assert.ok(apertureCurveTarget(peers[0].sample(),42)>0);
  slow=true; await sleep(900);
  assert.equal(peers[0].sample(),null); assert.equal(peers[0].summary().receiverConfirmed,false);
 } finally {peers.forEach(p=>p.close());}
});
test('closing an in-flight relay cannot emit an open event or schedule new requests', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto);let resolve,calls=0;const events=[];
 const peer=createMotionRelay({role:'phone',cipher,exchange:()=>{calls++;return new Promise(r=>resolve=r);},onEvent:t=>events.push(t)});
 await sleep(20);peer.close();resolve({sequence:1,packet:await cipher.seal('{"v":1,"kind":"poll","request":0}','receiver')});await sleep(80);
 assert.deepEqual(events,['stop']);assert.equal(calls,1);assert.equal(peer.sample(),null);
});
test('Aperture curve is bounded, direction-sensitive, fresh-only and disabled at rest or reduced motion', () => {
 const v=values(); const right=apertureCurveTarget(v,42);assert.ok(right>0&&right<0.32);
 assert.equal(apertureCurveTarget({...v,turnRate:-10},42),-right);
 for(const sample of [null,{...v,ageMs:251},{...v,ageMs:-1},{...v,turnRate:NaN},{...v,frame:'world'}])assert.equal(apertureCurveTarget(sample,42),0);
 assert.equal(apertureCurveTarget(v,0),0);assert.equal(apertureCurveTarget(v,130,true),0);
 assert.ok(apertureCurveTarget({...v,turnRate:2000},130)<=0.32);
 let curve=right;for(let i=0;i<60;i++)curve=advanceApertureCurve(curve,0,1/60);assert.ok(curve<0.003);
});
function surface(){const listeners=new Map();return {isSecureContext:true,crypto:webcrypto,location:{origin:'https://fixture.invalid'},visibilityState:'visible',addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};}
test('HTTPS QR works without WebRTC; encryption key never enters any API request or diagnostics',async()=>{
 const calls=[]; const host=surface(),doc=surface();let latest;
 const session=createMotionSession({role:'receiver',host,doc,onChange:s=>latest=s,fetcher:async(_url,options)=>{calls.push(JSON.parse(options.body));return {ok:true,status:200,text:async()=>JSON.stringify({id:'a'.repeat(32),token:'b'.repeat(64),join:'c'.repeat(64)})};}});
 try {await session.start(null,'https');assert.equal(latest.state,'pairing');assert.equal(latest.transport,'https');
  const secret=latest.qrUrl.split('.').at(-1);assert.match(secret,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify(calls).includes(secret));assert.ok(!JSON.stringify(session.report()).includes(secret));
 }finally{session.dispose();}
});


test('HTTPS rate backpressure retries without losing the pending reply or prematurely closing', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto);
 let calls=0;const events=[],replies=[];
 const poll=await cipher.seal(JSON.stringify({v:'sv-motion-1',kind:'poll',request:0}),'receiver');
 const peer=createMotionRelay({role:'phone',cipher,getPhone:phone,onEvent:type=>events.push(type),exchange:async packet=>{
  calls++;
  if(calls===1)return {sequence:1,packet:poll};
  if(packet)replies.push(await cipher.open(packet,'phone'));
  if(calls<=4)throw Object.assign(new Error('slow_down'),{status:429});
  return {};
 }});
 try {
  await sleep(300);
  assert.equal(peer.summary().state,'connected');assert.equal(peer.summary().relayBackoffs,3);
  assert.ok(replies.length>=4);assert.equal(new Set(replies.slice(0,4)).size,1,'a rejected exchange retains its pending response');
  assert.deepEqual(events,['channel-open']);
 }finally{peer.close();}
 const blocked=createMotionRelay({role:'phone',cipher,exchange:async()=>{throw Object.assign(new Error('slow_down'),{status:429});}});
 try {
  await sleep(1200);
  assert.equal(blocked.summary().state,'connecting','server backpressure preserves admission');
  assert.equal(blocked.summary().networkState,'retrying');
  assert.ok(blocked.summary().relayBackoffs >= 4 && blocked.summary().relayBackoffs <= 7, 'sustained refusal backs off instead of hammering');
 }finally{blocked.close();}
});


test('a known network loss clears transport receipts immediately without resetting monotonic protocol sequences', () => {
 let time=0; const now=()=>time;
 const receiver=createMotionProtocol({role:'receiver',now}), sender=createMotionProtocol({role:'phone',now,getPhone:phone});
 const first=receiver.poll(), reply=sender.receive(first); receiver.receive(reply);
 assert.ok(receiver.sample());
 receiver.resetTransport(); sender.resetTransport();
 assert.equal(receiver.sample(),null);assert.equal(sender.summary().receiverConfirmed,false);
 receiver.receive(reply);assert.equal(receiver.sample(),null);
 assert.equal(sender.receive(first),null,'old challenges remain rejected after interruption');
 time=20;receiver.receive(sender.receive(receiver.poll()));assert.ok(receiver.sample());
});

test('unknown network failures preserve pairing and bound retries, then recover fresh mutual evidence', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto), slots={},events=[];
 let broken=false, calls=0, inFlight=0, peak=0;
 const exchange=role=>async packet=>{
  calls++;inFlight++;peak=Math.max(peak,inFlight);
  try { await sleep(2); if(broken)throw new TypeError('Network unavailable');
   if(packet)slots[role]={sequence:(slots[role]?.sequence??0)+1,packet};
   return slots[role==='phone'?'receiver':'phone']??{};
  }finally{inFlight--;}
 };
 const receiver=createMotionRelay({role:'receiver',cipher,exchange:exchange('receiver'),onEvent:type=>events.push(type)});
 const sender=createMotionRelay({role:'phone',cipher,exchange:exchange('phone'),getPhone:phone});
 try {
  for(let i=0;i<100&&!receiver.summary().receiverConfirmed;i++)await sleep(20);
  assert.equal(receiver.summary().receiverConfirmed,true);
  broken=true;const before=calls;await sleep(2400);
  assert.equal(receiver.summary().state,'connected');assert.equal(sender.summary().state,'connected');
  assert.equal(receiver.sample(),null);assert.equal(receiver.summary().receiverConfirmed,false);
  assert.equal(receiver.summary().networkState,'retrying');
  assert.ok(calls-before<=10,`bounded requests during failure: ${calls-before}`);
  broken=false;
  for(let i=0;i<350&&!receiver.summary().receiverConfirmed;i++)await sleep(20);
  assert.equal(receiver.summary().receiverConfirmed,true);assert.ok(receiver.sample());
  assert.deepEqual(events,['channel-open']);assert.ok(peak<=2,'at most one in-flight request per peer');
 }finally{receiver.close();sender.close();}
});

test('offline waits retain the session until its original lease, with no HTTP traffic or stop resurrection', async t => {
 t.mock.timers.enable({apis:['setTimeout']});
 let time=0,calls=0;const events=[];
 const peer=createMotionRelay({role:'phone',now:()=>time,cipher:{seal:async x=>x,open:async x=>x},exchange:async()=>{calls++;return {};},onEvent:type=>events.push(type)});
 peer.setOnline(false);time=30000;t.mock.timers.tick(30000);
 assert.equal(calls,0);assert.equal(peer.summary().state,'connecting');assert.equal(peer.summary().networkState,'offline');
 time=3600000;t.mock.timers.tick(1000);
 assert.equal(peer.summary().state,'closed');assert.deepEqual(events,['expired']);
 peer.setOnline(true);t.mock.timers.tick(1000);assert.equal(calls,0);
});

test('an in-flight response from before offline cannot restore data or create a second request loop', async () => {
 const cipher=await createMotionCipher(createRelayKey(webcrypto),webcrypto);let resolve,calls=0;const events=[];
 const peer=createMotionRelay({role:'phone',cipher,getPhone:phone,exchange:()=>{calls++;return new Promise(r=>resolve=r);},onEvent:type=>events.push(type)});
 try {
  await sleep(20);peer.setOnline(false);peer.setOnline(true);
  assert.equal(calls,1);
  resolve({sequence:1,packet:await cipher.seal(JSON.stringify({v:'sv-motion-1',kind:'poll',request:0}),'receiver')});
  await sleep(40);assert.equal(calls,2);assert.deepEqual(events,[]);assert.equal(peer.summary().receiverConfirmed,false);
  peer.close();resolve({});await sleep(60);assert.equal(calls,2);assert.deepEqual(events,['stop']);
 }finally{peer.close();}
});


test('local WebRTC tolerates temporary disconnection but retains terminal failure and lease teardown', t => {
 t.mock.timers.enable({apis:['setInterval']});let pc,time=0;
 class Channel extends EventTarget {
  label='sedicivalvole-motion';ordered=false;maxRetransmits=0;readyState='open';bufferedAmount=0;sent=[];
  send(text){this.sent.push(text);} close(){this.readyState='closed';}
 }
 class Peer extends EventTarget {
  connectionState='connected';
  constructor(){super();pc=this;}
  createDataChannel(){return this.channel=new Channel();}
  close(){this.connectionState='closed';}
 }
 const peer=createMotionPeer({role:'receiver',host:{isSecureContext:true,RTCPeerConnection:Peer},now:()=>time});
 try {
  time=50;t.mock.timers.tick(50);assert.equal(pc.channel.sent.length,1);
  pc.connectionState='disconnected';pc.dispatchEvent(new Event('connectionstatechange'));
  time=30050;t.mock.timers.tick(30000);
  assert.equal(peer.summary().state,'connected');assert.equal(peer.summary().networkState,'retrying');assert.equal(pc.channel.sent.length,1);
  pc.connectionState='connected';pc.dispatchEvent(new Event('connectionstatechange'));
  time+=50;t.mock.timers.tick(50);assert.equal(pc.channel.sent.length,2);
  pc.connectionState='failed';pc.dispatchEvent(new Event('connectionstatechange'));
  assert.equal(peer.summary().state,'closed');assert.equal(pc.channel.readyState,'closed');
 }finally{peer.close();}
});


test('opposite polling phases recover after thirty seconds offline with the real integer-second mailbox expiry', async t => {
 t.mock.timers.enable({apis:['setTimeout']});
 let time=0;const slots={};
 const cipher={seal:async value=>value,open:async value=>value};
 const exchange=role=>async packet=>{
  const seconds=Math.floor(time/1000);
  for(const slot of Object.values(slots))if(seconds-slot.at>=2)slot.packet=null;
  if(packet)slots[role]={sequence:(slots[role]?.sequence??0)+1,at:seconds,packet};
  return {...(slots[role==='phone'?'receiver':'phone']??{})};
 };
 const receiver=createMotionRelay({role:'receiver',now:()=>time,cipher,exchange:exchange('receiver')});
 const sender=createMotionRelay({role:'phone',now:()=>time,cipher,exchange:exchange('phone'),getPhone:phone});
 const advance=async ms=>{time+=ms;t.mock.timers.tick(ms);for(let i=0;i<12;i++)await Promise.resolve();};
 try {
  for(let i=0;i<50;i++)await advance(20);
  assert.equal(receiver.summary().receiverConfirmed,true);
  sender.setOnline(false);receiver.setOnline(false);await advance(30000);
  assert.equal(receiver.sample(),null);assert.equal(receiver.summary().state,'connected');
  sender.setOnline(true);await advance(20);receiver.setOnline(true);
  for(let i=0;i<150&&!receiver.summary().receiverConfirmed;i++)await advance(20);
  assert.equal(receiver.summary().receiverConfirmed,true,'fresh confirmation recovers despite expired mailbox contents and opposite phases');
  assert.equal(sender.summary().receiverConfirmed,true);
 }finally{receiver.close();sender.close();}
});
