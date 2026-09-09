import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRadarSnapshot,radarPointUrl} from '../src/environments/radar/radar-model.js';
const center={latitude:46.00185,longitude:8.74512};
const epochNowMs=1800000000000, receivedAtMs=200000;
const normalize=ac=>normalizeRadarSnapshot({now:epochNowMs,ac},{center,epochNowMs,receivedAtMs});
const aircraft={hex:'abc123',lat:46,lon:8.74,seen_pos:2};
test('radar query is bounded and rounds the requested centre',()=>{
 assert.equal(radarPointUrl(center),'https://api.adsb.lol/v2/point/46.00/8.75/27');
 assert.equal(radarPointUrl({...center,latitude:NaN}),null);
 assert.equal(radarPointUrl(center,1000),null);
});
test('radar keeps unknown telemetry unknown, measured age and ground state explicit',()=>{
 const [a]=normalize([{...aircraft,alt_baro:'ground'}]);
 assert.equal(a.trackDegrees,null);assert.equal(a.altitudeFeet,null);assert.equal(a.groundSpeedKnots,null);
 assert.equal(a.observedAtMs,198000);assert.equal(a.onGround,true);assert.equal(a.stale,false);
 assert.equal(normalize([{...aircraft,seen_pos:40}])[0].stale,true);
 assert.deepEqual(normalize([{...aircraft,seen_pos:121}]),[]);
});
test('radar rejects malformed, old, future and seconds-based envelopes',()=>{
 for(const now of [epochNowMs-121000,epochNowMs+6000,epochNowMs/1000,NaN]) assert.deepEqual(normalizeRadarSnapshot({now,ac:[aircraft]},{center,epochNowMs,receivedAtMs}),[]);
 for(const bad of [{lat:NaN},{lon:181},{hex:'<bad>'},{seen_pos:-1},{seen_pos:null}]) assert.deepEqual(normalize([{...aircraft,...bad}]),[]);
});
test('radar deduplicates stable identity by freshness and caps nearest aircraft',()=>{
 const list=Array.from({length:100},(_,i)=>({...aircraft,hex:i.toString(16).padStart(6,'0'),lat:46+i/1000}));
 const result=normalize(list.reverse());assert.equal(result.length,32);
 assert.equal(normalize([aircraft,{...aircraft,seen_pos:1}])[0].ageMs,1000);
 assert.deepEqual(normalize(list),normalize([...list].reverse()));
});
