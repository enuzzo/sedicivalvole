// Run against the Vite dev server: verify the real React camera loop with pending map tiles.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const page=await browser.newPage({viewport:{width:773,height:601}});const errors=[];page.on('pageerror',e=>(errors.push(e.message),console.log(e.message)));
await page.route('**/flight-motion-qa',r=>r.fulfill({contentType:'text/html',body:'<div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/flight-motion-fixture.js"></script>'}));
await page.route('**/flight-motion-fixture.js',r=>r.fulfill({contentType:'text/javascript',body:`
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
const {createRoot}=ReactDOM;
import Flight from '/src/environments/radar/radar-flight-view.jsx';
window.calls=[];window.stale=false;window.groundMissing=false;
class Map {
 constructor(){this.events={};this.fov=36.87;this.canvas=document.createElement('canvas');window.camera=this;setTimeout(()=>this.ready(),50);}
 ready(){this.events['style.load']?.();this.events.sourcedata?.({sourceId:'openfreemap',tile:{state:'loaded'}});this.events.sourcedata?.({sourceId:'flight-terrain',tile:{dem:{},state:'loaded',tileID:{key:1}}});}
 on(name,fn){this.events[name]=fn;}isStyleLoaded(){return false;}
 getCanvas(){return this.canvas;}queryTerrainElevation(){return window.groundMissing?null:500;}
 getVerticalFieldOfView(){return this.fov;}setVerticalFieldOfView(v){this.fov=v;}
 calculateCameraOptionsFromCameraLngLatAltRotation(point,alt,bearing,pitch){return {point,alt,bearing,pitch};}
 jumpTo(options){window.calls.push({...options,time:performance.now(),fov:this.fov});this.events.render?.();}
 resize(){}refreshTiles(){}setStyle(){setTimeout(()=>this.ready(),30);}remove(){}
}
const now=performance.now(),plane={id:'abc123',observedAtMs:now,trackDegrees:90,altitudeFeet:5000,latitude:46,longitude:8.75};
window.staleFlight=()=>{plane.observedAtMs=-100000;};
createRoot(document.getElementById('root')).render(React.createElement(Flight,{gl:{Map},plane,
 readSample:time=>({latitude:46,longitude:8.75+(time-now)*.0000005,trackDegrees:90,altitudeFeet:5000,motion:'interpolated'}),
 palette:{base:[0,0,0],mid:[.1,.1,.1],light:[1,1,1],accent:[1,0,0],secondary:[0,1,0]},onClose(){},onFrame(){}}));
` }));
await page.goto(new URL('/flight-motion-qa',process.env.QA_URL||'http://127.0.0.1:5176/').href);
await page.waitForFunction(()=>window.calls?.length>20);
const baseline=await page.evaluate(()=>({count:calls.length,last:calls.at(-1)}));
await page.evaluate(()=>{groundMissing=true;});
await page.getByRole('button',{name:'Zoom in flight view'}).click();await page.waitForTimeout(800);
const closer=await page.evaluate(()=>calls.at(-1));if(!(closer.fov<baseline.last.fov&&closer.point[0]>baseline.last.point[0]))throw Error('Zoom stopped motion');
if(Math.abs(closer.alt-baseline.last.alt)>1)throw Error('Missing DEM tile changed camera altitude');
await page.getByRole('button',{name:'Zoom out flight view'}).click();await page.waitForTimeout(800);
await page.getByRole('button',{name:'Zoom out flight view'}).click();await page.waitForTimeout(800);
if(await page.evaluate(()=>calls.at(-1).fov)<=36.87)throw Error('Zoom out failed');
await page.getByRole('button',{name:'Reset flight view'}).click();await page.waitForTimeout(1200);
if(Math.abs(await page.evaluate(()=>calls.at(-1).fov)-36.87)>.02)throw Error('Reset failed');
await page.evaluate(()=>staleFlight());await page.waitForTimeout(200);
const held=await page.evaluate(()=>calls.at(-1).point);
await page.getByRole('button',{name:'Zoom in flight view'}).click();await page.waitForTimeout(600);
const stale=await page.evaluate(()=>calls.at(-1));if(JSON.stringify(stale.point)!==JSON.stringify(held)||stale.fov>=36.87)throw Error('Stale pose must hold while zoom remains usable');
if(errors.length)throw Error(errors.join('\n'));
console.log('PASS continuous per-frame camera while isStyleLoaded=false, missing DEM hold, zoom in/out/reset, stale pose zoom',await page.evaluate(()=>calls.length));await browser.close();
