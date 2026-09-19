import test from 'node:test';
import assert from 'node:assert/strict';
import { mountedBasis, mountedReading, createRoadResponse, usableRoadSample, roadSourceLabel } from '../src/motion/road-input.js';
import { orientationMatrix, applyRotation } from '../src/motion/reference.js';
import { createMotionProtocol } from '../src/motion/channel.js';
import { estimateEngineDemand } from '../src/engine/powertrain.js';
import { createEngineMotion } from '../src/engine/motion.js';
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
 for(const gravity of [[0,0,9.81],[0,9.81,0],[9.81,0,0],[0,-7,7],[0,7,-7],null]) assert.equal(mountedBasis(gravity),null);
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
 assert.equal(roadSourceLabel({source:'GPS',active:true,sample:sample()}),'iPhone motion + GPS speed');
});
