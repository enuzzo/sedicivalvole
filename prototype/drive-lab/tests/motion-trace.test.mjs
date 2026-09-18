import test from 'node:test';
import assert from 'node:assert/strict';
import { createMotionTrace, TRACE_CAPACITY } from '../src/motion/trace-model.js';
import { createScreenWake } from '../src/motion/screen-wake.js';
import { safeMotionSummary, createMotionTelemetry } from '../src/motion/telemetry.js';
const sample = (at, extra = {}) => ({ sampleAt: at, generation: 1, acceleration: [.1,.2,.3], tilt: [0,0,0], ageMs: 0, ...extra });
test('trace retains only real unique recent samples with bounded storage', () => {
 const model=createMotionTrace();let result;
 for(let i=0;i<1000;i++){result=model.update(sample(i*10),i*10);model.update(sample(i*10),i*10+1);}
 assert.equal(result.points.length,TRACE_CAPACITY);
 assert.ok(result.points.every(p=>9990-p.at<=3000));
 assert.equal(result.points.at(-1).at,9990);
});
test('zero, missing data, expired samples and gaps never join different histories',()=>{
 const model=createMotionTrace();model.update(sample(0),0);model.update(sample(20),20);
 assert.equal(model.update(sample(40,{generation:2}),40).points.length,1);
 assert.equal(model.update(sample(400),400).points.length,1);
 assert.equal(model.update(null,410),null);
 assert.equal(model.update(sample(420),420).points.length,1);
 assert.equal(model.update(sample(430,{ageMs:251}),430),null);
 assert.equal(model.update(sample(0),1000),null);
 assert.equal(model.update(sample(500),499),null);
});
test('trace scales all axes together, preserves measured values and flags outliers',()=>{
 const model=createMotionTrace(), measured=[-3.1,.5,2.2];
 const result=model.update(sample(0,{acceleration:measured}),0);
 assert.equal(result.range,4);assert.deepEqual(result.points[0].value,measured);
 measured[0]=99;assert.equal(result.points[0].value[0],-3.1);
 assert.equal(model.update(sample(20),20).range,4);
 const clipped=model.update(sample(40,{acceleration:[129,0,0]}),40);
 assert.equal(clipped.clipped,true);assert.equal(clipped.points.length,0);
 model.clear();assert.equal(model.update(sample(60),60).range,1);
});
test('invalid clock, vectors and backdated observations cannot revive a trace',()=>{
 const m=createMotionTrace();assert.equal(m.update(sample(0),NaN),null);
 m.update(sample(100),100);assert.equal(m.update(sample(80),101),null);
 assert.equal(m.update(sample(200,{tilt:[null,0,0]}),200),null);
 assert.equal(m.update(sample(200,{acceleration:[Infinity,0,0]}),200),null);
 m.update(sample(300),300);assert.equal(m.update(sample(200),200),null);
});
function wakeFixture(request) {
 const events=[],doc={visibilityState:'visible'}, host={navigator:{wakeLock:{request}}};
 const wake=createScreenWake({host,doc,onChange:s=>events.push(s)});return {wake,doc,events};
}
function lockFixture() {
 let listener; const lock={released:false,release:async()=>{lock.released=true;listener?.();},addEventListener:(type,fn)=>{listener=fn;}};return lock;
}
const settled=()=>new Promise(resolve=>setImmediate(resolve));
test('wake acquisition, system revocation and explicit retry are observable',async()=>{
 const locks=[];const f=wakeFixture(async type=>{assert.equal(type,'screen');const l=lockFixture();locks.push(l);return l;});
 f.wake.start();await settled();assert.equal(f.wake.summary().wakeState,'active');
 await locks[0].release();assert.equal(f.wake.summary().wakeState,'released');assert.equal(f.wake.summary().wakeLock,false);
 assert.equal(locks.length,1);await f.wake.retry();assert.equal(locks.length,2);
 f.wake.stop();assert.equal(f.wake.summary().wakeState,'idle');assert.equal(locks[1].released,true);
 assert.equal(f.wake.summary().wakeReleases,2);
});
test('late wake acquisition after stop is immediately released',async()=>{
 let complete;const f=wakeFixture(()=>new Promise(r=>complete=r));f.wake.start();f.wake.stop();
 const lock=lockFixture();complete(lock);await settled();assert.equal(lock.released,true);assert.equal(f.wake.summary().wakeLock,false);assert.equal(f.wake.summary().wakeState,'idle');
});
test('wake rejection and missing support retain safe actionable states, no exception text',async()=>{
 const f=wakeFixture(async()=>{throw Object.assign(Error('sensitive platform text'),{name:'NotAllowedError'});});
 f.wake.start();await settled();assert.equal(f.wake.summary().wakeState,'denied');assert.equal(f.wake.summary().wakeFailures,1);
 assert.doesNotMatch(JSON.stringify(f.events),/sensitive/);
 const other=createScreenWake({host:{navigator:{}},doc:{visibilityState:'visible'}});other.start();assert.equal(other.summary().wakeState,'unsupported');
});
test('hidden wake retry and overlapping requests cannot acquire extra locks',async()=>{
 let complete,count=0;const f=wakeFixture(()=>{count++;return new Promise(r=>complete=r);});
 f.wake.start();void f.wake.retry();assert.equal(count,1);f.doc.visibilityState='hidden';
 const lock=lockFixture();complete(lock);await settled();assert.equal(lock.released,true);
 assert.equal(f.wake.summary().wakeState,'released');assert.equal(f.wake.summary().wakeReleases,1);
 await f.wake.retry();assert.equal(count,1);f.wake.stop();
});
test('wake and renderer diagnostics admit only bounded summary fields',()=>{
 const telemetry=createMotionTelemetry(()=>0),raw={wakeState:'denied',wakeFailures:2,traceRenderer:'webgl2',traceFps:30,tracePoints:90,traceRange:4,points:[[1,2,3]],rawError:'secret',tilt:[1,2,3]};
 telemetry.update(raw);telemetry.event('wake',raw);telemetry.event('trace',raw);
 assert.equal(telemetry.snapshot().events.length,2);assert.equal(safeMotionSummary(raw).wakeState,'denied');
 assert.doesNotMatch(JSON.stringify(telemetry.snapshot()),/secret|"points"|"tilt"/);
 assert.equal(safeMotionSummary({wakeState:'secret',traceRenderer:'vendor secret'}).wakeState,undefined);
});
