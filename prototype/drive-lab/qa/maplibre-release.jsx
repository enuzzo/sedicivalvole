import React from 'react';
import {createRoot} from 'react-dom/client';
import * as gl from '../src/maplibre-runtime.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import {createAtlasStyle} from '../src/environments/atlas/atlas-model.js';
import {createAirAtlasStyle} from '../src/environments/radar/radar-presentation.js';
import {createFlightTerrainStyle} from '../src/environments/radar/radar-flight-model.js';
import RadarFlightView from '../src/environments/radar/radar-flight-view.jsx';
import {captureReportMap} from '../src/reports/report-map.js';

const palette={base:[0,0,0],mid:[.2,.2,.2],light:[1,1,1],accent:[.87,.18,.12],secondary:[.2,.5,.7]};
const route=[{latitude:45.46,longitude:9.19},{latitude:45.48,longitude:9.22}];
const output=document.querySelector('#result'),host=document.querySelector('#map');
const check=(condition,label)=>{if(!condition)throw new Error(label);output.textContent+=`PASS ${label}\n`;};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function loaded(map){
 let timer;
 try {await Promise.race([map.once('idle'),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Map load timeout')),20000);})]);}
 finally {clearTimeout(timer);}
 check(map.isStyleLoaded()&&map.areTilesLoaded(),'style and tiles loaded');
}

document.querySelector('#run').onclick=async()=>{
 const button=document.querySelector('#run');button.disabled=true;output.textContent='';
 try {
  for(const [name,style] of [['ATLAS',createAtlasStyle(palette,'standard')],['Air Atlas',createAirAtlasStyle(palette,'palette',true)],['Fly With',createFlightTerrainStyle(palette)]]){
   const errors=[];const map=new gl.Map({container:host,style,center:[9.19,45.46],zoom:10,attributionControl:false});
   try {map.on('error',e=>errors.push(e.error.message));await loaded(map);check(errors.length===0,`${name}: no map errors`);check(!!map.getCanvas().getContext('webgl2'),`${name}: WebGL2`);
    if(name==='ATLAS'){
     window.__attributionExecuted=false;
     map.addControl(new gl.AttributionControl({compact:false,customAttribution:'<details open onload="1" ontoggle="window.__attributionExecuted=true">QA attribution</details>'}));
     await delay(100);check(!window.__attributionExecuted&&!host.querySelector('[onload],[ontoggle]')&&host.textContent.includes('QA attribution'),'consecutive attribution handlers removed, text preserved');
    }
   }finally{map.remove();}
   check(host.children.length===0,`${name}: map disposed`);
  }
  const image=await captureReportMap(route,new AbortController().signal);
  check(image?.startsWith('data:image/jpeg')&&image.length>10000,'report JPEG capture');
  const original=HTMLCanvasElement.prototype.getContext;let root;
  HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:original.call(this,type,...args);};
  try {
   let failed=false;try{new gl.Map({container:host,style:{version:8,sources:{},layers:[]}});}catch(error){failed=error instanceof gl.GPUInitializationError;}
   check(failed&&host.children.length===0,'GPU failure throws and cleans partial container');
   check(await captureReportMap(route,new AbortController().signal)===null,'GPU failure omits report map');
   const mount=document.querySelector('#component');root=createRoot(mount);
   root.render(<RadarFlightView gl={gl} plane={{id:'qa',latitude:45.46,longitude:9.19}} readSample={()=>null} palette={palette} reducedMotion={true} onClose={()=>{}} onFrame={()=>{}}/>);
   await delay(250);check(mount.textContent.includes('WebGL2 unavailable · return to radar'),'Fly With retains explicit GPU fallback and return control');
  }finally{root?.unmount();HTMLCanvasElement.prototype.getContext=original;}
  check(!document.querySelector('[style*="left: -1200px"]'),'report temporary host disposed');
  output.textContent+='ALL MAP CHECKS PASSED';
 }catch(error){output.textContent+=`FAIL ${error.message}`;console.error(error);}
 finally{button.disabled=false;}
};
