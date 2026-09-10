import test from 'node:test';
import assert from 'node:assert/strict';
import {radarDisplayFix,radarLocationPresentation} from '../src/environments/radar/radar-location.js';
import {appendRadarObservation,radarTrailCoordinates} from '../src/environments/radar/radar-motion.js';
import {discoverDistanceMetres} from '../src/discover/discover-model.js';
test('stationary coarse location can display immediately without supplying motion evidence',()=>{
 const fix=radarDisplayFix({latitude:46,longitude:9,accuracy:10000,speed:null},1000);
 assert.equal(fix.accuracyM,10000);assert.equal(fix.speedKmh,null);
 assert.match(radarLocationPresentation(fix,'GPS active · speed is null','unknown',1000).message,/Approximate/);
 assert.equal(radarLocationPresentation({...fix,accuracyM:5},'live','granted',1000).message,'');
 assert.match(radarLocationPresentation(fix,'timeout','granted',40000).message,/Last known/);
 assert.equal(radarDisplayFix({latitude:91,longitude:9},0),null);
});
test('permission granted, denied and unsupported are distinct from fix acquisition',()=>{
 assert.match(radarLocationPresentation(null,'permission requested','granted',0).message,/Location allowed/);
 assert.match(radarLocationPresentation(null,'permission denied','unknown',0).message,/denied/);
 assert.match(radarLocationPresentation(null,'permission requested','unknown',0).message,/Requesting/);
 assert.match(radarLocationPresentation(null,'GPS active · speed is null','unknown',0).message,/Location allowed/);
});
test('trails contain only past observed positions and stay within five kilometres',()=>{
 let history=[];
 for(let i=0;i<200;i++)history=appendRadarObservation(history,{latitude:46+i*.001,longitude:9,observedAtMs:i*2500});
 assert.ok(history.length<=121);
 const trail=radarTrailCoordinates(history,497500);
 assert.ok(trail.length>16);
 assert.equal(trail.at(-1)[1],46.197);
 const distance=trail.slice(1).reduce((sum,p,i)=>sum+discoverDistanceMetres({longitude:trail[i][0],latitude:trail[i][1]},{longitude:p[0],latitude:p[1]}),0);
 assert.ok(Math.abs(distance-5000)<1);
 const reset=appendRadarObservation(history,{latitude:47,longitude:9,observedAtMs:600000});
 assert.equal(radarTrailCoordinates(reset,600000).length,0);
 assert.equal(radarTrailCoordinates(history,1000000).length,0);
});

import {radarLensPoint,radarLensOffset,RADAR_LENS_STRENGTH} from '../src/environments/radar/radar-lens.js';
test('lens preserves centre/corners and shares its shader mapping with marker offsets',()=>{
 const width=773,height=601;
 for(const point of [{x:0,y:0},{x:width,y:height},{x:width/2,y:height/2}])assert.deepEqual(radarLensPoint(point,width,height),point);
 for(let x=0;x<width;x+=30)for(let y=0;y<height;y+=30){
  const point={x,y},warped=radarLensPoint(point,width,height),offset=radarLensOffset(point,width,height);
  assert.ok(Math.hypot(...offset)<11);
  const scale=Math.hypot(width/2,height/2),radius=Math.hypot(warped.x-width/2,warped.y-height/2)/scale;
  let r=radius;
  for(let i=0;i<5;i++)r-=(r*(1+RADAR_LENS_STRENGTH*(1-r*r))-radius)/(1+RADAR_LENS_STRENGTH-3*RADAR_LENS_STRENGTH*r*r);
  assert.ok(Math.abs(r-Math.hypot(x-width/2,y-height/2)/scale)<1e-6);
 }
});

import {radarFlightFov} from '../src/environments/radar/radar-flight-model.js';
test('flight optical zoom is bounded and reset preserves the original field of view',()=>{
 assert.ok(Math.abs(radarFlightFov(0)-36.87)<1e-9);
 assert.ok(radarFlightFov(1)<radarFlightFov(.5));
 assert.ok(radarFlightFov(-1)>radarFlightFov(-.5));
 assert.equal(radarFlightFov(999),radarFlightFov(1));
 assert.equal(radarFlightFov(-999),radarFlightFov(-1));
 assert.equal(radarFlightFov(NaN),radarFlightFov(0));
});

import {radarViewportQuery,radarMinimumZoom} from '../src/environments/radar/radar-viewport.js';
import {radarPointUrl,radarAircraftUrl,normalizeRadarSnapshot} from '../src/environments/radar/radar-model.js';
import {createRadarPoller} from '../src/environments/radar/radar-client.js';
test('viewport query covers its corners and radius grows with zoom-out',()=>{
 const center={lat:46,lng:9};
 const narrow=radarViewportQuery(center,[{lat:46.05,lng:8.9},{lat:45.95,lng:9.1}]);
 const wide=radarViewportQuery(center,[{lat:46.5,lng:8},{lat:45.5,lng:10}]);
 assert.ok(wide.radiusNm>narrow.radiusNm);assert.ok(wide.radiusNm>=wide.requiredNm);
 assert.match(wide.key,/radius=/);assert.ok(radarMinimumZoom(46,1920,1080)>radarMinimumZoom(46,773,601));
 assert.ok(radarViewportQuery({lat:0,lng:179.9},[{lat:.1,lng:-179.9},{lat:-.1,lng:179.7}]).radiusNm<30);
 assert.equal(radarPointUrl({latitude:0,longitude:0},251),null);
 assert.equal(radarAircraftUrl('abcdef'),'/api/radar-data.php?kind=aircraft&hex=abcdef');assert.equal(radarAircraftUrl('../secret'),null);
});
test('a fresh signal never resets an old position timestamp',()=>{
 const [plane]=normalizeRadarSnapshot({now:100000,ac:[{hex:'abcdef',lat:46,lon:9,seen_pos:60,seen:1}]},
  {center:{latitude:46,longitude:9},epochNowMs:102000,receivedAtMs:80000});
 assert.equal(plane.observedAtMs,18000);assert.equal(plane.signalAtMs,77000);assert.equal(plane.stale,true);
});
test('manual refresh queues behind an in-flight query and respects server backoff',async()=>{
 let now=0,resolve,calls=0;const timers=new Map();let id=0;
 const poller=createRadarPoller({now:()=>now,schedule:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},cancel:id=>timers.delete(id),
  load:()=>{calls++;return new Promise(r=>resolve=r);},onResult(){},onStatus(){}});
 const pending=poller.start();poller.refresh();poller.refresh();assert.equal(calls,1);now=1500;resolve([]);await pending;
 assert.ok([...timers.values()].some(t=>t.delay===0));poller.dispose();
 let retryCalls=0;const retry=createRadarPoller({now:()=>now,schedule:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},cancel:id=>timers.delete(id),
  load:async()=>{retryCalls++;throw Object.assign(Error('busy'),{retryAfterMs:60000});},onResult(){},onStatus(){}});
 await retry.start();retry.refresh();assert.equal(retryCalls,1);retry.dispose();
});
