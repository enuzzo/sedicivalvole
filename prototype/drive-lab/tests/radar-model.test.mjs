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

import {createAirAtlasStyle,radarTelemetryRows} from '../src/environments/radar/radar-presentation.js';
test('extended telemetry preserves measurement references, zero values and rejects malformed values',()=>{
 const [plane]=normalize([{...aircraft,alt_baro:18000,alt_geom:18700,baro_rate:0,geom_rate:-640,ias:240,tas:370,gs:344,mach:.62,mag_heading:153,true_heading:155,roll:0,nav_altitude_mcp:10000,nav_qnh:1013.2,wd:270,ws:25,oat:-20,squawk:'1000',type:'mlat'}]);
 assert.equal(plane.altitudeFeet,18000);assert.equal(plane.geometricAltitudeFeet,18700);
 assert.equal(plane.verticalRate,0);assert.equal(plane.geometricRate,-640);assert.equal(plane.rollDegrees,0);
 assert.equal(plane.indicatedSpeedKnots,240);assert.equal(plane.trueSpeedKnots,370);assert.equal(plane.groundSpeedKnots,344);
 assert.equal(plane.magneticHeadingDegrees,153);assert.equal(plane.trueHeadingDegrees,155);
 assert.equal(radarTelemetryRows(plane).find(([key])=>key==='Position source')[1],'MLAT · multilateration');
 const [bad]=normalize([{...aircraft,alt_geom:'18000',ias:-1,tas:Infinity,mach:10,mag_heading:360,roll:200,nav_qnh:0,squawk:'8888',type:'<script>'}]);
 for(const key of ['geometricAltitudeFeet','indicatedSpeedKnots','trueSpeedKnots','mach','magneticHeadingDegrees','rollDegrees','altimeterHpa','squawk','positionSource'])assert.equal(bad[key],null,key);
 assert.ok(radarTelemetryRows(bad).every(([,v])=>v==='Not available'));
});
test('Air Atlas labels default off and stay bounded when enabled without changing Atlas style',()=>{
 const palette={base:[0,0,0],mid:[.1,.1,.1],light:[1,1,1],accent:[1,.2,.1],secondary:[.1,.5,1]};
 const hidden=createAirAtlasStyle(palette).layers.find(l=>l.id==='atlas-place-labels');
 const visible=createAirAtlasStyle(palette,'natural',true).layers.find(l=>l.id==='atlas-place-labels');
 assert.notEqual(createAirAtlasStyle(palette).layers[0].paint['background-color'],createAirAtlasStyle(palette,'natural').layers[0].paint['background-color']);
 assert.equal(hidden.layout.visibility,'none');assert.equal(visible.layout.visibility,'visible');
 assert.ok(visible.layout['text-padding']>=18);assert.match(JSON.stringify(visible.filter),/city.*town.*village/);
});
test('PHP adapter forwards the bounded extended telemetry through JS normalization',()=>{
 const file=new URL('../public/api/radar-data.php',import.meta.url).pathname;
 const payload={now:epochNowMs,ac:[{...aircraft,alt_geom:19000,ias:250,mag_heading:20,squawk:'1000',type:'adsb_icao',private:'omit',oat:{bad:true}}]};
 const code=`define('RADAR_DATA_LIBRARY_ONLY',true);require ${JSON.stringify(file)};$d=json_decode(stream_get_contents(STDIN),true);echo json_encode(radar_data_filter($d,'nearby'));`;
 const result=JSON.parse(execFileSync('php',['-r',code],{input:JSON.stringify(payload),encoding:'utf8'}));
 const [plane]=normalize(result.ac);assert.equal(plane.geometricAltitudeFeet,19000);assert.equal(plane.indicatedSpeedKnots,250);assert.equal(plane.magneticHeadingDegrees,20);assert.equal(plane.positionSource,'adsb_icao');assert.equal(plane.outsideTemperatureC,null);assert.equal(result.ac[0].private,undefined);
});

import {radarAirportCountry} from '../src/environments/radar/radar-detail.js';
test('airport flags use only an explicitly supplied supported country, never inferred airport or aircraft codes',()=>{
 const airport={iata:'MAN',icao:'EGCC',name:'Manchester',location:'Manchester',lat:53.35,lon:-2.27};
 const route=country=>normalizeRadarRoute({callsign:'RYR1',plausible:true,_airports:[{...airport,countryiso2:country},{...airport,iata:'BGY',countryiso2:'IT'}]},'RYR1');
 assert.equal(route('GB').origin.country.name,'United Kingdom');assert.equal(route('GB').destination.country.flag,'/third-party/country-flags/it.svg');
 for(const bad of [undefined,null,'ZZ','EU','gb','GB/../it','',{},'GB<script>'])assert.equal(route(bad).origin.country,null);
 assert.equal(radarAirportCountry('XK').code,'XK');
});
test('every locally bundled country flag retains its pinned upstream bytes and MIT notice',()=>{
 const root=new URL('../public/third-party/country-flags/',import.meta.url);
 const inventory=JSON.parse(readFileSync(new URL('inventory.json',root)));
 assert.equal(inventory.files.length,250);assert.match(readFileSync(new URL('LICENSE',root),'utf8'),/Copyright \(c\) 2013 Panayiotis Lipiridis/);
 for(const item of inventory.files){
  const bytes=readFileSync(new URL(item.file,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
  assert.ok(radarAirportCountry(item.code));assert.doesNotMatch(bytes.toString(),/<script|<foreignObject|<image|\bonload=/i);
 }
});
test('route PHP adapter forwards valid country codes and rejects malformed country metadata',()=>{
 const file=new URL('../public/api/radar-data.php',import.meta.url).pathname;
 const payload={callsign:'RYR1',plausible:true,_airports:[{iata:'MAN',countryiso2:'GB'},{iata:'BGY',countryiso2:'../IT'},{countryiso2:['IT']}]};
 const code=`define('RADAR_DATA_LIBRARY_ONLY',true);require ${JSON.stringify(file)};$d=json_decode(stream_get_contents(STDIN),true);echo json_encode(radar_data_filter($d,'route'));`;
 const result=JSON.parse(execFileSync('php',['-r',code],{input:JSON.stringify(payload),encoding:'utf8'}));
 assert.equal(result._airports[0].countryiso2,'GB');assert.equal(result._airports[1].countryiso2,undefined);assert.equal(result._airports[2].countryiso2,undefined);
});

import {appendRadarObservation,sampleRadarTrack} from '../src/environments/radar/radar-motion.js';
import {radarCategory,radarFallbackMask} from '../src/environments/radar/radar-symbols.js';
test('five-second playback uses measured history and interpolates headings across north',()=>{
 const a={latitude:46,longitude:8,observedAtMs:1000,trackDegrees:350,altitudeFeet:1000};
 const b={...a,longitude:8.01,observedAtMs:5000,trackDegrees:10,altitudeFeet:1200};
 const history=appendRadarObservation(appendRadarObservation([],a),b);
 const sample=sampleRadarTrack(history,8000);
 assert.ok(Math.abs(sample.longitude-8.005)<1e-9);assert.equal(sample.trackDegrees,0);assert.equal(sample.altitudeFeet,1100);
 assert.equal(sample.motion,'interpolated');assert.equal(sampleRadarTrack(history,11000).longitude,8.01);
 assert.equal(sampleRadarTrack(history,8000,true).motion,'held');
 assert.equal(appendRadarObservation(history,{...b,observedAtMs:8000}),history);
 assert.equal(appendRadarObservation(history,{...a,observedAtMs:3000}),history);
 assert.equal(appendRadarObservation(history,{...b,longitude:9,observedAtMs:25000}).length,1);
});
test('complete pinned type database classifies rotorcraft before any heading exists',()=>{
 const root=new URL('../public/third-party/aircraft-types/',import.meta.url);
 const types=JSON.parse(readFileSync(new URL('types.json',root)));
 const inventory=JSON.parse(readFileSync(new URL('inventory.json',root)));
 for(const f of inventory.files)assert.equal(createHash('sha256').update(readFileSync(new URL(f.file,root))).digest('hex'),f.sha256);
 assert.equal(Object.keys(types).length,2788);
 assert.equal(radarCategory({typeCode:'AS50',trackDegrees:null},types),'helicopter');
 assert.equal(radarCategory({typeCode:'A139'},types),'helicopter');
 assert.equal(radarCategory({typeCode:'C172'},types),'light');
 assert.equal(radarCategory({typeCode:'PARA'},types),'parachute');
 assert.equal(radarCategory({typeCode:'SHIP'},types),'airship');
 assert.equal(radarCategory({typeCode:'DRON'},types),'drone');
 assert.equal(radarCategory({typeCode:'GLID'},types),'glider');
 for(const category of ['A7','B1','B2','B6','C1','C3','A0'])assert.match(radarFallbackMask({category},types),/^url\("data:image\/svg\+xml,/);
});
test('radar-only transport excludes rail and ferry while airport layers ignore place toggle',()=>{
 const palette={base:[0,0,0],mid:[.1,.1,.1],light:[1,1,1],accent:[1,.2,.1],secondary:[.1,.5,1]};
 const style=createAirAtlasStyle(palette);
 for(const road of style.layers.filter(l=>l['source-layer']==='transportation'))assert.deepEqual(road.filter,['in',['get','class'],['literal',['motorway','trunk','primary']]]);
 assert.ok(style.layers.some(l=>l.id==='radar-runways'));
 assert.equal(style.layers.find(l=>l.id==='radar-airports').layout.visibility,undefined);
 const types=JSON.parse(readFileSync(new URL('../public/third-party/aircraft-types/types.json',import.meta.url)));
 for(const typeCode of Object.keys(types))assert.ok(radarFallbackMask({typeCode},types).includes('svg'));
});

import {radarFlightAvailability,radarCameraHeight,createFlightTerrainStyle} from '../src/environments/radar/radar-flight-model.js';
test('nose camera requires fresh airborne position, track and altitude',()=>{
 const p={observedAtMs:10000,trackDegrees:0,altitudeFeet:5000};
 assert.equal(radarFlightAvailability(p,10000),null);
 assert.match(radarFlightAvailability(p,41000),/fresh/);
 assert.match(radarFlightAvailability({...p,onGround:true},10000),/ground/);
 assert.match(radarFlightAvailability({...p,trackDegrees:null},10000),/track/);
 assert.match(radarFlightAvailability({...p,altitudeFeet:null},10000),/altitude/);
});
test('terrain exaggeration preserves approximate clearance and labels adjusted camera heights',()=>{
 const normal=radarCameraHeight({altitudeFeet:5000},1250);
 assert.equal(normal.cameraM,1774);assert.equal(normal.adjusted,false);assert.equal(normal.reference,'Pressure altitude');
 const low=radarCameraHeight({geometricAltitudeFeet:1000},1250);
 assert.equal(low.cameraM,1340);assert.equal(low.adjusted,true);assert.equal(low.reference,'GPS ellipsoid');
 assert.equal(radarCameraHeight({},1000),null);
 const palette={base:[0,0,0],mid:[.1,.1,.1],light:[1,1,1],accent:[1,.2,.1],secondary:[.1,.5,1]};
 const style=createFlightTerrainStyle(palette);
 assert.equal(style.terrain.exaggeration,1.25);assert.equal(style.sources['flight-terrain'].encoding,'terrarium');
 assert.equal(style.sources['flight-terrain'].tileSize,512);
});
