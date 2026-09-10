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
