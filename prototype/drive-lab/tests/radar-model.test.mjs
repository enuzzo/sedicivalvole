import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRadarSnapshot,radarPointUrl} from '../src/environments/radar/radar-model.js';
const center={latitude:46.00185,longitude:8.74512};
const epochNowMs=1800000000000, receivedAtMs=200000;
const normalize=ac=>normalizeRadarSnapshot({now:epochNowMs,ac},{center,epochNowMs,receivedAtMs});
const aircraft={hex:'abc123',lat:46,lon:8.74,seen_pos:2};
test('radar query is bounded and rounds the requested centre',()=>{
 assert.equal(radarPointUrl(center),'/api/radar-data.php?kind=nearby&lat=46.00&lon=8.75');
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

import {normalizeRadarPhoto,normalizeRadarRoute,radarPhotoUrl,radarShapeCode} from '../src/environments/radar/radar-detail.js';
import {createRadarPoller,radarJson} from '../src/environments/radar/radar-client.js';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

test('photo metadata requires an attributed allowlisted image and original link',()=>{
  const photo={thumbnail:{src:'https://t.plnspttrs.net/a.jpg'},link:'https://www.planespotters.net/photo/1',photographer:'Photographer'};
  assert.equal(normalizeRadarPhoto({photos:[photo]}).photographer,'Photographer');
  assert.equal(normalizeRadarPhoto({photos:[{...photo,photographer:''}]}),null);
  assert.equal(normalizeRadarPhoto({photos:[{...photo,thumbnail:{src:'https://evil.test/a.jpg'}}]}),null);
  assert.equal(radarPhotoUrl({id:'../bad'}),null);
});
test('route requires the selected callsign, valid endpoints and explicit plausibility',()=>{
  const payload={callsign:'DLA6CM',plausible:true,_airports:[{iata:'FRA',name:'Frankfurt',location:'Frankfurt',lat:50,lon:8},{iata:'MXP',name:'Malpensa',location:'Milan',lat:45,lon:8}]};
  assert.equal(normalizeRadarRoute(payload,'DLA6CM').destination.code,'MXP');
  assert.equal(normalizeRadarRoute(payload,'OTHER'),null);
  assert.equal(normalizeRadarRoute({...payload,plausible:false},'DLA6CM'),null);
  assert.equal(normalizeRadarRoute(payload,'DLA6CM').departure,null);
});
test('all 182 artwork originals match pinned hashes and have normalized standalone SVGs',()=>{
  const root=new URL('../public/third-party/aircraft-shapes/',import.meta.url);
  const inventory=JSON.parse(readFileSync(new URL('inventory.json',root)));
  const catalogue=JSON.parse(readFileSync(new URL('catalogue.json',root)));
  assert.equal(inventory.files.length,182);assert.equal(catalogue.length,182);
  for(const item of inventory.files){
    assert.equal(createHash('sha256').update(readFileSync(new URL(item.source,root))).digest('hex'),item.sha256);
    const svg=readFileSync(new URL(`normalized/${item.code}.svg`,root),'utf8');
    assert.match(svg,/viewBox="[-.\d e+]+"/);assert.doesNotMatch(svg,/<script|<image|<foreignObject|\bonload=/i);
    const bounds=/viewBox="([^"]+)"/.exec(svg)[1].split(' ').map(Number);assert.ok(bounds.every(Number.isFinite)&&bounds[2]>0&&bounds[3]>0);
  }
  const codes=new Set(catalogue.map(p=>p.code));assert.equal(radarShapeCode({typeCode:'E195'},codes),'E195');
  assert.equal(radarShapeCode({typeCode:'UNKNOWN',callsign:'A320'},codes),null);
});
test('poller never overlaps and discards a disposed response',async()=>{
  let finish,calls=0,results=0;const scheduled=[];
  const loader=createRadarPoller({load:()=>{calls++;return new Promise(r=>finish=r);},onResult:()=>results++,onStatus:()=>{},schedule:(fn,ms)=>{scheduled.push({fn,ms});return scheduled.length;},cancel:()=>{}});
  const pending=loader.start();loader.wake();assert.equal(calls,1);loader.dispose();finish([]);await pending;assert.equal(results,0);
});
test('poller respects server cooldown across foreground recovery',async()=>{
  let clock=0,calls=0;const timers=[];
  const loader=createRadarPoller({load:async()=>{calls++;const error=new Error();error.retryAfterMs=90000;throw error;},onResult:()=>{},onStatus:()=>{},now:()=>clock,schedule:(fn,ms)=>{timers.push({fn,ms});return timers.length;},cancel:()=>{}});
  await loader.start();assert.equal(timers.at(-1).ms,90000);clock=1000;loader.wake();assert.equal(calls,1);assert.equal(timers.at(-1).ms,89000);loader.dispose();
});
test('HTTP reader rejects streamed overflow without parsing or retaining it',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response(new Uint8Array(50));
  try{await assert.rejects(radarJson('https://example.test',{maximumBytes:10}),/too large/);}finally{globalThis.fetch=original;}
});
test('schedule adapter rejects mismatched aircraft and preserves airport-local time semantics',()=>{
  const file=new URL('../public/api/radar-flight.php',import.meta.url).pathname;
  const date=new Date().toISOString().slice(0,10);
  const payload={hex:'3006b5',dep_iata:'FRA',arr_iata:'MXP',dep_time:`${date} 18:10`,arr_estimated:`${date} 19:35`};
  const code=`define('RADAR_FLIGHT_LIBRARY_ONLY',true);require ${JSON.stringify(file)};$d=json_decode(stream_get_contents(STDIN),true);echo json_encode([radar_flight_schedule($d,'3006b5'),radar_flight_schedule($d,'abcdef')]);`;
  const [value,mismatch]=JSON.parse(execFileSync('php',['-r',code],{input:JSON.stringify(payload),encoding:'utf8'}));
  assert.equal(value.departure.kind,'scheduled');assert.equal(value.arrival.kind,'estimated');assert.equal(value.arrival.zone,'airport local');assert.equal(mismatch,null);
});

test('traffic adapter fixes destination, rounds location and rejects arbitrary parameters',()=>{
  const file=new URL('../public/api/radar-data.php',import.meta.url).pathname;
  const code=`define('RADAR_DATA_LIBRARY_ONLY',true);require ${JSON.stringify(file)};echo json_encode([radar_data_query(['kind'=>'nearby','lat'=>'46.001','lon'=>'8.745']),radar_data_query(['kind'=>'route','lat'=>'46.001','lon'=>'8.745','callsign'=>'DLA6CM']),radar_data_query(['kind'=>'nearby','lat'=>['46'],'lon'=>'8']),radar_data_query(['kind'=>'nearby','lat'=>'91','lon'=>'8']),radar_data_query(['kind'=>'nearby','lat'=>'46','lon'=>'8','url'=>'https://example.test'])]);`;
  const [nearby,route,...invalid]=JSON.parse(execFileSync('php',['-r',code],{encoding:'utf8'}));
  assert.equal(nearby.path,'/v2/point/46.00/8.75/27');assert.equal(route.path,'/api/0/route/DLA6CM/46.001/8.745');
  assert.deepEqual(invalid,[null,null,null]);assert.match(nearby.key,/^[a-f0-9]{64}$/);
});
test('traffic adapter strips unrelated fields and bounds aircraft and airport rows',()=>{
  const file=new URL('../public/api/radar-data.php',import.meta.url).pathname;
  const payload={now:Date.now(),ac:Array.from({length:600},()=>({hex:'3006b5',lat:46,lon:8,seen_pos:0,private:'omit',flight:{invalid:true}}))};
  const code=`define('RADAR_DATA_LIBRARY_ONLY',true);require ${JSON.stringify(file)};$d=json_decode(stream_get_contents(STDIN),true);echo json_encode(radar_data_filter($d,'nearby'));`;
  const result=JSON.parse(execFileSync('php',['-r',code],{input:JSON.stringify(payload),encoding:'utf8'}));
  assert.equal(result.ac.length,512);assert.equal(result.ac[0].private,undefined);assert.equal(result.ac[0].flight,undefined);
});
