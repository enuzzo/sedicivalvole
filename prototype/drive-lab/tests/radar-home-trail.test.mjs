import test from 'node:test';
import assert from 'node:assert/strict';
import {appendHomeObservation,homeTrailFeature,HOME_TRAIL_AGE_MS} from '../src/environments/radar/radar-home-trail.js';
import {reportRouteCoordinates} from '../src/reports/report-map.js';
import {createAirAtlasStyle} from '../src/environments/radar/radar-presentation.js';
import {discoverDistanceMetres} from '../src/discover/discover-model.js';
const point=(t,latitude=46+t/10000000)=>({latitude,longitude:9,capturedAtMs:t,accuracyM:5,speedKmh:36});
test('home trail follows only measured moving fixes and expires without inventing positions',()=>{
 let h=[];for(let t=0;t<=120000;t+=2000)h=appendHomeObservation(h,point(t),t);
 assert.ok(h.length>1&&h.length<=128);
 const distance=h.slice(1).reduce((d,p,i)=>d+discoverDistanceMetres(h[i],p),0);assert.ok(distance<=1000);
 assert.equal(h.at(-1).latitude,point(120000).latitude);
 assert.deepEqual(appendHomeObservation(h,point(120000),120000),h);
 assert.equal(homeTrailFeature(h,120000+HOME_TRAIL_AGE_MS+1).features.length,0);
 assert.deepEqual(appendHomeObservation(h,{...point(122000),accuracyM:10000},122000),[]);
 assert.deepEqual(appendHomeObservation(h,point(122000),140000),[]);
 assert.equal(appendHomeObservation(h,point(122000,47),122000).length,1);
 assert.equal(appendHomeObservation(h,point(160000),160000).length,1);
 assert.deepEqual(appendHomeObservation(h,{...point(122000),speedKmh:0},122000),h.filter(p=>122000-p.capturedAtMs<=HOME_TRAIL_AGE_MS));
});
test('print map unwraps dateline bounds and clamps only the Mercator display latitude',()=>{
 const route=[{latitude:46,longitude:179.9},{latitude:90,longitude:-179.9}];
 assert.deepEqual(reportRouteCoordinates(route),[[179.9,46],[180.1,85]]);assert.equal(route[1].longitude,-179.9);
});
test('radar palette has visible water, real administrative borders and a separate home trail',()=>{
 const style=createAirAtlasStyle({base:[0,0,0],mid:[.1,.1,.1],light:[1,1,1],accent:[1,.2,.1],secondary:[.1,.5,1]});
 assert.ok(style.layers.find(l=>l.id==='atlas-water').paint['fill-opacity']>=.8);
 assert.equal(style.layers.find(l=>l.id==='radar-country-borders')['source-layer'],'boundary');
 assert.ok(style.layers.find(l=>l.id==='radar-home-trail-line').paint['line-dasharray']);
});
