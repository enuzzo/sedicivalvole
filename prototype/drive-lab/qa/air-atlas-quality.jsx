import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import AirAtlasField from '../src/environments/radar/air-atlas-field.jsx';
import {getFluxTheme} from '../src/flux-themes.js';
import '../src/styles.css';

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (url.origin === location.origin && url.pathname === '/api/radar-data.php') {
    return Response.json({now: Date.now(), ac: [[.02,.03],[-.04,.07],[.06,-.05],[-.06,-.02]].map(([lat,lon],i)=>({hex:`abc12${i}`,lat:45.46+lat,lon:9.19+lon,seen_pos:0,seen:0,flight:`SYNTH${i+1}`,t:'A320',alt_baro:22000,alt_geom:22100,gs:350,track:80+i*70,type:'adsb_icao'}))});
  }
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return new Response('',{status:503});
  return originalFetch(input, options);
};
const noop = () => {};
function AirQualityProbe() {
  const [position,setPosition] = useState({latitude:45.46,longitude:9.19,accuracyM:5,capturedAtMs:performance.now(),heading:0,speedKmh:0});
  useEffect(()=>{const timer=setInterval(()=>setPosition(p=>({...p,capturedAtMs:performance.now()})),1000);return()=>clearInterval(timer);},[]);
  return <main className="app controls-awake" data-appearance="dark">
    <AirAtlasField position={position} gpsState="live" theme={getFluxTheme('red')} reducedMotion={false} onRenderer={noop} onFrame={noop} onRuntimeError={console.error}/>
    <strong style={{position:'absolute',zIndex:50,top:0,left:0,padding:8,background:'#171717',color:'#fff',font:'13px sans-serif'}}>LOCAL QA · 4 synthetic aircraft · no live feed or device GPS</strong>
  </main>;
}
createRoot(document.getElementById('root')).render(<AirQualityProbe/>);
