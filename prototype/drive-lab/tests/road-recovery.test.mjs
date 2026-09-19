import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForMotionIce } from '../src/motion/ice-gathering.js';
import { createSoundtrackRecovery } from '../src/soundtrack/recovery.js';
import { resetApplicationCache } from '../src/session/reset-cache.js';
import { safeMotionSummary } from '../src/motion/telemetry.js';

function peer(sdp, state = 'gathering') {
  const pc = new EventTarget(); pc.localDescription = { sdp }; pc.iceGatheringState = state; return pc;
}
test('ICE uses existing candidates when embedded gathering never completes', async () => {
  const pc = peer('v=0\r\na=candidate:private-test-value\r\n'); const evidence=[];
  await waitForMotionIce(pc, { timeoutMs: 10, onEvidence: value => evidence.push(value) });
  assert.deepEqual(evidence, [{iceCandidates:1,iceComplete:false}]);
  assert.ok(!JSON.stringify(evidence).includes('private-test-value'));
});
test('ICE rejects empty offers and leaves retry cleanup bounded', async () => {
  const cleanups = new Set();
  await assert.rejects(waitForMotionIce(peer('v=0'), {timeoutMs:10,cleanups}), /ice_no_candidates/);
  assert.equal(cleanups.size,0);
});
test('ICE completion is accepted without waiting and cancellation settles its caller', async () => {
  await waitForMotionIce(peer('a=candidate:test','complete'));
  const cleanups=new Set(); const pending=waitForMotionIce(peer('v=0'),{cleanups});
  [...cleanups][0](); await assert.rejects(pending,/closed/); assert.equal(cleanups.size,0);
});
test('ICE diagnostics expose only bounded counts and fixed failure codes', () => {
  assert.deepEqual(safeMotionSummary({iceCandidates:2,iceComplete:true,failureReason:'ice_no_candidates',sdp:'secret',candidate:'secret'}),{iceCandidates:2,iceComplete:true,failureReason:'ice_no_candidates'});
  assert.equal(safeMotionSummary({failureReason:'private arbitrary text'}).failureReason,undefined);
});
test('static reset preserves unrelated caches and unregisters only the app worker', async () => {
  const deleted=[],removed=[];
  const result=await resetApplicationCache({storage:{keys:async()=>['sedicivalvole.assets.v1.build','unrelated-cache'],delete:async key=>{deleted.push(key);return true;}},serviceWorker:{getRegistrations:async()=>['session-cache.js','other.js'].map(name=>({active:{scriptURL:`https://example.test/${name}`},unregister:async()=>{removed.push(name);return true;}}))}});
  assert.deepEqual(deleted,['sedicivalvole.assets.v1.build']); assert.deepEqual(removed,['session-cache.js']); assert.equal(result.failed,0);
});
test('cache reset reports storage denial rather than claiming success', async () => {
  const result=await resetApplicationCache({storage:{keys:async()=>{throw Error('denied')}},serviceWorker:null});
  assert.equal(result.failed,1);
});
test('recovery retries persistent errors with backoff and stops after a bounded episode', async () => {
  let time=0,calls=0,state;
  const recovery=createSoundtrackRecovery({now:()=>time,retry:async()=>calls++,onState:value=>state=value});
  const snapshot={status:'error',playbackWanted:true};
  await recovery.tick(snapshot,true); await recovery.tick(snapshot,true); assert.equal(calls,1);
  time=2000; await recovery.tick(snapshot,true); assert.equal(calls,2);
  time=302000; await recovery.tick(snapshot,true); assert.equal(calls,2); assert.equal(state,'unavailable');
});
test('recovery never resumes explicit native pause, mute, hidden or offline playback', async () => {
  let calls=0,time=0;const recovery=createSoundtrackRecovery({now:()=>time,retry:async()=>calls++});
  for (const snapshot of [{status:'paused',playbackWanted:false},{status:'error',playbackWanted:false}]) {time+=20000;await recovery.tick(snapshot,true);}
  await recovery.tick({status:'error',playbackWanted:true},false);assert.equal(calls,0);
});
test('advancing media is healthy; stopped media clock recovers without a network event', async () => {
  let time=0,calls=0;const recovery=createSoundtrackRecovery({now:()=>time,retry:async()=>calls++});
  const snapshot=clock=>({status:'playing',playbackWanted:true,current:{key:'one'},media:{roles:{current:{currentTimeSeconds:clock}}}});
  await recovery.tick(snapshot(1),true);time=11000;await recovery.tick(snapshot(2),true);assert.equal(calls,0);
  time=22000;await recovery.tick(snapshot(2),true);assert.equal(calls,1);
});
