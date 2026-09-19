import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createMotionCipher, createRelayKey, createMotionRelay } from '../src/motion/relay.js';
import { apertureCurveTarget, advanceApertureCurve } from '../src/motion/aperture-curve.js';
import { createMotionSession } from '../src/motion/session.js';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const values = () => ({ frame: 'tare-relative', generation: 1, acceleration: [0,0,0], rotation: [0,0,10], tilt: [0,0,0], turnRate: 10, ageMs: 0 });
const phone = () => ({ values: values(), summary: { tared: true, sensorState: 'live' } });

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
