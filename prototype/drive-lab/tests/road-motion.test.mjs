import test from 'node:test';
import assert from 'node:assert/strict';
import { mountedBasis, mountedReading, createRoadResponse, usableRoadSample, roadSourceLabel, roadNavbarStatus } from '../src/motion/road-input.js';
import { orientationMatrix, applyRotation } from '../src/motion/reference.js';
import { createMotionProtocol } from '../src/motion/channel.js';
import { estimateEngineDemand } from '../src/engine/powertrain.js';
import { createEngineMotion } from '../src/engine/motion.js';
import { createPhoneSensors } from '../src/motion/sensors.js';
import { apertureCurveTarget } from '../src/motion/aperture-curve.js';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
const transpose = m => [m[0],m[3],m[6],m[1],m[4],m[7],m[2],m[5],m[8]];
const sample = (a=2, ageMs=0, generation=1) => ({ frame:'tare-relative',generation,ageMs,acceleration:[0,0,0],rotation:[0,0,0],tilt:[0,0,0],turnRate:0,road:{longitudinalMps2:a,yawRate:0} });
test('declared portrait mount preserves acceleration/braking signs through incline and car yaw',()=>{
 for(const beta of [20,30,40,55,70]) for(const alpha of [0,45,90,179,270]) {
  const matrix=orientationMatrix({alpha,beta,gamma:0});
  const inverse=transpose(matrix);
  const gravity=applyRotation(inverse,[0,0,9.81]);
  const basis=mountedBasis(gravity);assert.ok(basis);
  const heading=alpha*Math.PI/180;
  // World forward is rotated with the vehicle, independently of the tare heading.
  const forward=[-Math.sin(heading),Math.cos(heading),0];
  for(const rate of [-5,0,3]) {
   const acceleration=applyRotation(inverse,forward.map(v=>v*rate));
   const rotation=applyRotation(inverse,[0,0,-12]);
   const reading=mountedReading(basis,{gravity,acceleration,rotation});
   near(reading.longitudinalMps2,rate);near(reading.yawRate,-12);
  }
  const lateral=applyRotation(inverse,[Math.cos(heading)*4,Math.sin(heading)*4,0]);
  near(mountedReading(basis,{gravity,acceleration:lateral,rotation:[0,0,0]}).longitudinalMps2,0);
 }
});
test('unsupported mounting and tilt/shock reject road input',()=>{
 for(const gravity of [[0,0,9.81],[0,7,-7],null]) assert.equal(mountedBasis(gravity),null);
 const basis=mountedBasis([0,7,7]);
 for(const overrides of [{gravity:[0,0,9.81]},{rotation:[90,0,0]},{acceleration:[16,0,0]}]) assert.equal(mountedReading(basis,{gravity:[0,7,7],acceleration:[0,0,0],rotation:[0,0,0],...overrides}),null);
});
test('phone ingress, generation change and expired fallback are bounded without impulses',()=>{
 const r=createRoadResponse();r.resolve(null,0,0);
 near(r.resolve(sample(6),0,40).accelerationMps2,.48);
 near(r.resolve(sample(-6,0,2),0,80).accelerationMps2,0);
 assert.equal(usableRoadSample(sample(2,251)),null);
 assert.equal(usableRoadSample(sample(2,-1)),null);
 assert.equal(r.resolve(sample(6,251),0,120).responseSource,'gps-motion');
 r.reset();near(r.resolve(sample(6),0,500).accelerationMps2,0);
});
test('real Engine motion snapshots use mounted acceleration without changing GPS speed or stop evidence',()=>{
 const motion=createEngineMotion();let phone=sample(3);motion.setPhoneMotionProvider(()=>phone);
 motion.observe({source:'GPS',rawSpeedKmh:40,receivedMs:0,accuracyM:5,liveWatch:true});
 motion.snapshot(0);let value;
 for(let t=40;t<=400;t+=40)value=motion.snapshot(t);
 near(value.speedKmh,40);near(value.accelerationMps2,3);assert.equal(value.drive,1);assert.equal(estimateEngineDemand(value).throttle,1);assert.equal(value.trustedStationary,false);
 phone=sample(-4);for(let t=440;t<=1080;t+=40)value=motion.snapshot(t);
 assert.ok(value.deceleration>.8);assert.equal(estimateEngineDemand(value).throttle,0);near(value.speedKmh,40);
 phone=null;for(let t=1120;t<=1600;t+=40)value=motion.snapshot(t);
 assert.equal(value.responseSource,'gps-motion');near(value.accelerationMps2,0);
 phone=sample(3);motion.reset('hide');assert.equal(motion.snapshot(1700).responseSource,'unavailable');assert.equal(motion.snapshot(1700).drive,0);
 motion.observe({source:'Demo',rawSpeedKmh:40,receivedMs:1750,driveInput:'regen'});
 value=motion.snapshot(1750);assert.equal(value.responseSource,'demo-motion');near(value.accelerationMps2,0);
});
test('encrypted-transport protocol preserves optional road values and expires them at 250ms',()=>{
 let time=0; const receiver=createMotionProtocol({role:'receiver',now:()=>time});
 const phone=createMotionProtocol({role:'phone',now:()=>time,getPhone:()=>({values:sample(-3),summary:{sensorState:'live',tared:true,mountSelected:true,roadState:'calibrated'}})});
 const poll=receiver.poll();time=20;const answer=phone.receive(poll);time=40;receiver.receive(answer);
 assert.equal(receiver.sample().road.longitudinalMps2,-3);assert.equal(receiver.summary().mountSelected,true);
 time=251;assert.equal(receiver.sample(),null);
});
test('source UI never treats connected or Demo as usable road sensors',()=>{
 assert.match(roadSourceLabel({source:'Demo',active:true,sample:sample()}),/phone excluded/);
 assert.match(roadSourceLabel({source:'GPS',active:true,link:{state:'connected'}}),/unavailable/);
 assert.equal(roadSourceLabel({source:'GPS',active:true,sample:sample()}),'Phone motion + GPS speed');
});

test('navbar preserves the pairing fact independently of GPS and optional road calibration', () => {
 const options = { source:'GPS', active:true, gpsFresh:false, link:{state:'connected'}, sensor:{sensorState:'live',mountSelected:false} };
 const paired = roadNavbarStatus(options);
 assert.equal(paired.state,'paired'); assert.equal(paired.connected,true); assert.equal(paired.source,'gps-motion');
 assert.match(paired.label,/car motion off/);
 const enabled = roadNavbarStatus({...options,sensor:{mountSelected:true}});
 assert.equal(enabled.state,'paired'); assert.match(enabled.label,/waiting for fresh speed/);
 const demo = roadNavbarStatus({...options,source:'Demo',sample:sample()});
 assert.equal(demo.state,'demo'); assert.equal(demo.connected,true); assert.equal(demo.source,'demo-motion');
 assert.match(demo.label,/Phone paired.*phone excluded/);
});

test('navbar active sensor state requires actual current road input and drops on expiry or lost GPS', () => {
 const options = { source:'GPS',active:true,gpsFresh:true,sample:sample(),link:{state:'connected'},sensor:{mountSelected:true} };
 const live = roadNavbarStatus(options);
 assert.equal(live.state,'active'); assert.equal(live.source,'phone-motion'); assert.equal(live.connected,true);
 assert.equal(roadNavbarStatus({...options,link:{state:'connected',networkState:'retrying'}}).source,'phone-motion',
  'an HTTP retry cannot hide input the unchanged consumer still uses');
 for (const changed of [{sample:sample(2,251)},{sample:null},{gpsFresh:false},{active:false}]) {
  const next = roadNavbarStatus({...options,...changed});
  assert.equal(next.state,'paired'); assert.equal(next.source,'gps-motion'); assert.equal(next.connected,true);
 }
 const local = roadNavbarStatus({...options,local:true,link:{}});
 assert.equal(local.state,'active'); assert.equal(local.connected,false,'local sensing cannot claim a paired phone');
 const waiting = roadNavbarStatus({...options,local:true,link:{},sample:null,gpsFresh:false,sensor:{sensorState:'live'}});
 assert.equal(waiting.state,'local'); assert.match(waiting.summary,/waiting for GPS/);
});

test('navbar recovery and terminal states cannot retain a healthy phone check', () => {
 const options = {source:'GPS',active:true,gpsFresh:false,sample:sample(),sensor:{mountSelected:true}};
 for (const networkState of ['offline','retrying']) {
  const status = roadNavbarStatus({...options,link:{state:'connected',networkState}});
  assert.equal(status.state,'retrying'); assert.equal(status.connected,false); assert.equal(status.source,'gps-motion');
  assert.match(status.label,/Waiting for fresh GPS speed/);
 }
 for (const state of ['closed','expired','suspended','error']) {
  const status = roadNavbarStatus({...options,sample:null,link:{state}});
  assert.equal(status.state,'gps'); assert.equal(status.connected,false);
 }
 assert.equal(roadNavbarStatus({...options,sample:null,link:{state:'pairing'}}).state,'pairing');
});

test('declared aligned mounts accept upright and landscape inclines with W3C or Core Motion gravity',()=>{
 for(const pose of [{alpha:25,beta:90,gamma:0},{alpha:25,beta:40,gamma:0},{alpha:0,beta:0,gamma:50},{alpha:0,beta:0,gamma:-50}]) for(const sign of [1,-1]) {
  const matrix=orientationMatrix(pose), up=matrix.slice(6), gravity=up.map(v=>v*9.81*sign);
  const basis=mountedBasis(gravity,matrix);assert.ok(basis);
  const expectedForward=applyRotation(matrix,basis.forward);
  near(expectedForward[2],0);
  const a=basis.forward.map(v=>v*3), rotation=up.map(v=>v*-12);
  const result=mountedReading(basis,{gravity,acceleration:a,rotation});
  near(result.longitudinalMps2,3);near(result.yawRate,-12);
  assert.equal(mountedReading(basis,{gravity:gravity.map(v=>-v),acceleration:a,rotation}),null);
 }
 for(const pose of [{alpha:0,beta:0,gamma:0},{alpha:0,beta:180,gamma:0}]) {
  const m=orientationMatrix(pose);assert.equal(mountedBasis(m.slice(6).map(v=>v*-9.81),m),null);
 }
});

test('measured synthetic stationary noise stays observable but cannot drive road consumers; small real inputs retain sign and latency', async () => {
 let at = 0;
 const listeners = new Map();
 const host = { isSecureContext: true, DeviceMotionEvent: {}, DeviceOrientationEvent: {}, navigator: {},
  addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
 const doc = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
 const sensors = createPhoneSensors({ host, doc, now: () => at, autoWake: false });
 const matrix = orientationMatrix({ alpha: 0, beta: 45, gamma: 0 }), up = matrix.slice(6);
 const gravity = up.map(v => v * 9.81), basis = mountedBasis(gravity, matrix);
 const tick = (a, yaw) => {
  at += 20;
  listeners.get('deviceorientation')({ isTrusted: true, alpha: 0, beta: 45, gamma: 0 });
  const acceleration = basis.forward.map(v => v * a), rotation = up.map(v => v * yaw);
  listeners.get('devicemotion')({ isTrusted: true, acceleration: { x: acceleration[0], y: acceleration[1], z: acceleration[2] },
   accelerationIncludingGravity: Object.fromEntries(['x', 'y', 'z'].map((key, i) => [key, acceleration[i] + gravity[i]])),
   rotationRate: { beta: rotation[0], gamma: rotation[1], alpha: rotation[2] } });
 };
 const receiver = createMotionProtocol({ role: 'receiver', now: () => at });
 const phone = createMotionProtocol({ role: 'phone', now: () => at, getPhone: () => ({ summary: sensors.summary(), values: sensors.latest() }) });
 const response = createRoadResponse(), measured = [];
 try {
  await sensors.start(); sensors.setMount(true); tick(0, 0); sensors.requestTare();
  for (let i = 0; i < 27; i++) tick(0, 0);
  assert.equal(sensors.summary().tared, true);
  for (let i = 0; i < 500; i++) {
   tick(.055 * Math.sin(i * .73) + .025 * Math.cos(i * 1.17), .45 * Math.sin(i * .41));
   receiver.receive(phone.receive(receiver.poll()));
   const sample = receiver.sample();
   measured.push({ acceleration: Math.abs(sample.road.longitudinalMps2), rotation: Math.abs(sample.road.yawRate) });
   near(response.resolve(sample, 0, at).accelerationMps2, 0);
   near(apertureCurveTarget({ ...sample, turnRate: sample.road.yawRate }, 40), 0);
  }
  assert.ok(Math.max(...measured.map(s => s.acceleration)) >= .07, 'visible input was measured, not suppressed in the sensor/protocol');
  assert.ok(Math.max(...measured.map(s => s.rotation)) >= .4);
  for (const sign of [1, -1]) {
   tick(sign * .18, sign); receiver.receive(phone.receive(receiver.poll()));
   const sample = receiver.sample();
   // The opposite sign takes at most two 20 ms steps through the existing slew limit.
   response.resolve(sample, 0, at); tick(sign * .18, sign); receiver.receive(phone.receive(receiver.poll()));
   near(response.resolve(receiver.sample(), 0, at).accelerationMps2, sign * .18);
   assert.equal(Math.sign(apertureCurveTarget({ ...sample, turnRate: sample.road.yawRate }, 40)), sign);
  }
  at += 251;
  assert.equal(receiver.sample(), null); assert.equal(sensors.latest(), null);
  assert.equal(response.resolve(receiver.sample(), 0, at).responseSource, 'gps-motion');
 } finally { sensors.dispose(); }
});
