import test from 'node:test';
import assert from 'node:assert/strict';
import { altitudeTraceRange, chartAltitudeSource, chartAltitudeValue, observeSessionStats, sessionRuntimeSnapshot, sessionStatsSnapshot } from '../src/environments/atlas/session-stats.js';
import { appendAtlasJourneySample, appendAtlasSessionJourneySample } from '../src/environments/atlas/atlas-model.js';
const point = (t,speed=36,extra={}) => ({ capturedAtMs:t,speedKmh:speed,accuracyM:5,heading:90,altitudeM:100,altitudeAccuracyM:3,...extra });

test('reported height survives both chart histories while uncertain accuracy cannot accumulate ascent', () => {
 for (const altitudeAccuracyM of [null, 25, -1]) {
  let totals, recent=[], session=[];
  [120,125,130,135].forEach((altitudeM,index)=>{
   const sample=point(index*2100,36,{altitudeM,altitudeAccuracyM});
   totals=observeSessionStats(totals,sample);
   recent=appendAtlasJourneySample(recent,sample);
   session=appendAtlasSessionJourneySample(session,recent.at(-1));
  });
  assert.deepEqual(recent.map(s=>s.altitudeM),[120,125,130,135]);
  assert.deepEqual(session.map(s=>s.altitudeM),[120,125,130,135]);
  assert.equal(totals.elevationObservedMs,0);assert.equal(totals.elevationGainM,0);
 }
});

test('altitude bounds preserve visible variation, flat zero, negative height and absent data', () => {
 const extent=values=>altitudeTraceRange(values.map(altitudeM=>({altitudeM})));
 assert.deepEqual(extent([120,125,135]),{minimum:115,maximum:140});
 assert.deepEqual(extent([0,0]),{minimum:-5,maximum:5});
 assert.deepEqual(extent([-15,-15]),{minimum:-20,maximum:-10});
 assert.deepEqual(extent([null,NaN,Infinity]),{minimum:-5,maximum:5});
 const high=extent([2500,2501]);assert.ok(high.minimum<2500 && high.minimum>2400);assert.ok(high.maximum>2501);
});
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

test('acceleration and braking shares retain cumulative speed changes independently of chart compaction', () => {
 let s;
 [0,10,20,30,20,10,0].forEach((speed,i)=>s=observeSessionStats(s,point(i*1000,speed)));
 const snapshot=sessionStatsSnapshot(s,6000);
 assert.equal(snapshot.accelerationGainKmh,30);
 assert.equal(snapshot.brakingLossKmh,30);
 assert.equal(snapshot.accelerationShare,0.5);
 assert.equal(snapshot.brakingShare,0.5);
 assert.equal(snapshot.motionObservedMs,6000);
 assert.ok(snapshot.movingAverageKmh > 0);
});

test('motion shares reject standstill jitter, GPS gaps and implausible speed jumps', () => {
 let s;
 [0,0.4,1.3,0.7,0].forEach((speed,i)=>s=observeSessionStats(s,point(i*1000,speed)));
 assert.equal(sessionStatsSnapshot(s,4000).accelerationShare,null);
 s=observeSessionStats(s,point(20000,50));
 assert.equal(s.accelerationGainKmh,0);
 s=observeSessionStats(s,point(20100,200));
 assert.equal(s.accelerationGainKmh,0);
 s=observeSessionStats(s,point(20200,50));
 assert.equal(s.brakingLossKmh,0);
 s=observeSessionStats(s,point(21200,40));
 assert.equal(s.brakingLossKmh,10);
 assert.equal(sessionStatsSnapshot(s,21200).brakingShare,1);
});

test('slow acceleration survives dense GPS callbacks without accumulating sub-threshold jitter', () => {
 const ramp=step=>{
  let s;
  for(let t=0;t<=10000;t+=step) s=observeSessionStats(s,point(t,20+t/1000));
  return s.accelerationGainKmh;
 };
 assert.ok(Math.abs(ramp(100)-ramp(1000)) < 1);
 assert.ok(ramp(100) >= 9);
 let s;
 [20,20.4,20.1,20.5,20.2].forEach((speed,i)=>s=observeSessionStats(s,point(i*1000,speed)));
 assert.equal(s.accelerationGainKmh,0);
 assert.equal(s.brakingLossKmh,0);
});

test('runtime evidence preserves unsupported and inactive states instead of displaying false zeros', () => {
 const empty=sessionRuntimeSnapshot();
 assert.equal(empty.longTasks.count,null);
 assert.equal(empty.events.retryCount,null);
 assert.equal(empty.engine.rpm,null);
 const unavailable=sessionRuntimeSnapshot({
  longTasks:{supported:false,count:0,maximumDurationMs:0},
  engine:{active:false,status:'ready',rpm:600,gear:1,load:0},
 });
 assert.equal(unavailable.longTasks.count,null);
 assert.equal(unavailable.engine.rpm,null);
 assert.equal(unavailable.engine.load,null);
});

test('runtime evidence admits measured zero counts and ready simulated engine values', () => {
 const snapshot=sessionRuntimeSnapshot({
  longTasks:{supported:true,count:0,maximumDurationMs:null},
  events:{scope:'session',retryCount:0,audioModeChanges:3},
  engine:{active:true,status:'ready',rpm:600,gear:1,load:0},
 });
 assert.equal(snapshot.longTasks.count,0);
 assert.equal(snapshot.longTasks.maximumDurationMs,null);
 assert.equal(snapshot.events.retryCount,0);
 assert.equal(snapshot.events.scope,'session');
 assert.deepEqual(snapshot.engine,{active:true,rpm:600,gear:1,load:0});
 const loading=sessionRuntimeSnapshot({engine:{active:true,status:'loading',rpm:600,gear:1,load:0.5},events:{retryCount:4}});
 assert.equal(loading.engine.rpm,null);
 assert.equal(loading.events.scope,'retained');
 const invalid=sessionRuntimeSnapshot({longTasks:{supported:true,count:-1},events:{retryCount:Infinity},engine:{active:true,status:'ready',rpm:NaN,gear:1.5,load:2}});
 assert.equal(invalid.longTasks.count,null);
 assert.equal(invalid.events.retryCount,null);
 assert.equal(invalid.engine.rpm,null);
 assert.equal(invalid.engine.gear,null);
 assert.equal(invalid.engine.load,null);
});

test('map fallback never replaces available GPS or turns a mixed compacted bin into a GPS fix', () => {
 const map={altitudeM:null,groundElevationM:123};
 assert.equal(chartAltitudeValue(map),123);assert.equal(chartAltitudeSource(map),'map');
 assert.equal(chartAltitudeValue({...map,altitudeM:0}),0);assert.equal(chartAltitudeSource({...map,altitudeM:0}),'gps');
 assert.equal(chartAltitudeValue({...map,heightContainsGap:true}),null);
 let session=[];
 for(let i=0;i<5;i++) session=appendAtlasSessionJourneySample(session,{capturedAtMs:i*2100,speedKmh:36,
   altitudeM:i===0?150:null,groundElevationM:i===0?null:123,terrainCell:i===0?null:'45.46,9.19'},4);
 assert.equal(session[0].heightContainsGap,true);assert.equal(chartAltitudeValue(session[0]),null);
 assert.equal(session[0].speedKmh,36);assert.equal(chartAltitudeSource(session[1]),'map');
});
