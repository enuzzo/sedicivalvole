import test from 'node:test';
import assert from 'node:assert/strict';
import { observeSessionStats, sessionStatsSnapshot } from '../src/environments/atlas/session-stats.js';
const point = (t,speed=36,extra={}) => ({ capturedAtMs:t,speedKmh:speed,accuracyM:5,heading:90,altitudeM:100,altitudeAccuracyM:3,...extra });
test('streamed totals survive long sessions and exclude GPS gaps', () => {
 let s;
 for(let t=0;t<=7200000;t+=1000) s=observeSessionStats(s,point(t));
 assert.equal(s.distanceM,72000);assert.equal(s.movingMs,7200000);
 s=observeSessionStats(s,point(7500000,0));
 assert.equal(s.stoppedMs,0);assert.equal(s.distanceM,72000);
 const snap=sessionStatsSnapshot(s,7500000);assert.equal(snap.unknownMs,300000);assert.equal(snap.averageKmh,36);
});
test('stationary noise, missing altitude, out-of-order and poor accuracy do not fabricate totals', () => {
 let s=observeSessionStats(null,point(1000,0,{altitudeAccuracyM:null}));
 s=observeSessionStats(s,point(2000,1,{altitudeAccuracyM:null}));
 assert.equal(s.distanceM,0);assert.equal(s.elevationObservedMs,0);
 assert.equal(observeSessionStats(s,point(1500)),s);
 assert.equal(observeSessionStats(s,point(3000,90,{accuracyM:1000})),s);
});
test('altitude hysteresis removes noise and resets on a gap', () => {
 let s;
 [100,101,100,102,105,106,100].forEach((altitudeM,i)=>s=observeSessionStats(s,point(i*1000,20,{altitudeM})));
 assert.equal(s.elevationGainM,5);assert.equal(s.elevationLossM,5);
 s=observeSessionStats(s,point(60000,20,{altitudeM:500}));assert.equal(s.elevationGainM,5);
});
test('empty session remains unavailable',()=>{const s=sessionStatsSnapshot(null,999);assert.equal(s.averageKmh,null);assert.equal(s.elapsedMs,0);assert.equal(s.peakKmh,null);});
