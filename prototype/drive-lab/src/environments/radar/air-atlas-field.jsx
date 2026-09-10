import {useEffect,useMemo,useRef,useState} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {atlasMapPixelRatio,validAtlasPosition,paletteToAtlasCss} from '../atlas/atlas-model.js';
import {normalizeRadarSnapshot,radarPointUrl,RADAR_EXPIRE_MS,RADAR_FRESH_MS} from './radar-model.js';
import {radarJson,createRadarPoller} from './radar-client.js';
import {radarPhotoUrl,radarRouteUrl,normalizeRadarPhoto,normalizeRadarRoute,radarShapeCode} from './radar-detail.js';

import {radarFallbackMask,radarCategory} from './radar-symbols.js';
import RadarFlightView from './radar-flight-view.jsx';
import {radarFlightAvailability} from './radar-flight-model.js';
import types from '../../../public/third-party/aircraft-types/types.json';
import shapeCatalogue from '../../../public/third-party/aircraft-shapes/catalogue.json';
import {appendRadarObservation, sampleRadarTrack} from './radar-motion.js';
import {discoverDistanceMetres} from '../../discover/discover-model.js';
import {createAirAtlasStyle,radarTelemetryRows} from './radar-presentation.js';

function AirportCode({airport}){
  return <strong className="air-atlas-airport-code">{airport?.country?<img className="air-atlas-country-flag" src={airport.country.flag} width="24" height="18" alt={`${airport.country.name} flag`} title={airport.country.name}/>:null}{airport?.code||'—'}</strong>;
}

function clockSafe(position){return Number.isFinite(position?.capturedAtMs)&&performance.now()-position.capturedAtMs<15000;}
const detailCache=new Map();
function remember(key,value){if(detailCache.size>=64)detailCache.delete(detailCache.keys().next().value);detailCache.set(key,{value,expires:Date.now()+600000});}
function subscribeLifecycle(loader){
  const wake=()=>document.hidden||navigator.onLine===false?loader.pause():loader.wake();
  document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);window.addEventListener('offline',wake);
  void loader.start();
  return()=>{loader.dispose();document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('offline',wake);};
}
function useAircraftDetail(aircraft){
  const [detail,setDetail]=useState({});const ref=useRef(aircraft);ref.current=aircraft;
  const identity=aircraft?`${aircraft.id}:${aircraft.callsign}:${aircraft.registration}:${aircraft.typeCode}`:'';
  useEffect(()=>{
    setDetail({});if(!identity)return;
    const cleanups=['photo','route'].map(kind=>{
      const key=`${kind}:${identity}`,cached=detailCache.get(key);
      if(cached&&cached.expires>Date.now()){setDetail(prev=>({...prev,[kind]:cached.value,[`${kind}Status`]:'ready'}));return()=>{};}
      setDetail(prev=>({...prev,[`${kind}Status`]:'loading'}));
      const loader=createRadarPoller({intervalMs:600000,canLoad:()=>!document.hidden&&navigator.onLine!==false&&performance.now()-ref.current?.observedAtMs<RADAR_EXPIRE_MS,
        load:async signal=>{const current=ref.current,url=kind==='photo'?radarPhotoUrl(current):radarRouteUrl(current);if(!url)return null;
          const payload=await radarJson(url,{signal,maximumBytes:32768,headers:{'X-Air-Atlas':'1'}});return kind==='photo'?normalizeRadarPhoto(payload):normalizeRadarRoute(payload,current.callsign);},
        onResult:value=>{remember(key,value);setDetail(prev=>({...prev,[kind]:value}));},
        onStatus:status=>setDetail(prev=>({...prev,[`${kind}Status`]:status})),
      });return subscribeLifecycle(loader);
    });return()=>cleanups.forEach(cleanup=>cleanup());
  },[identity]);
  return detail;
}

export default function AirAtlasField({position,theme,reducedMotion,onRenderer,onFrame,onRuntimeError,onRetryLocation}){
  const [labels,setLabels]=useState(false),[appearance,setAppearance]=useState('palette');
  const colors=paletteToAtlasCss(theme.palette);
  const selectionColor=theme.palette.accent.reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0)>0.6?'#151515':'#fff';
  const followHome=useRef(true),homeMarker=useRef(null);
  const [flightView,setFlightView]=useState(false);
  const flightViewRef=useRef(false);flightViewRef.current=flightView;
  const radarCamera=useRef(null);
  const [northUp,setNorthUp]=useState(true),[expanded,setExpanded]=useState(false);
  const headingFresh=Number.isFinite(position?.heading)&&position?.speedKmh>3&&clockSafe(position);
  const bearing=northUp||!headingFresh?0:position.heading;
  const host=useRef(null),mapRef=useRef(null),library=useRef(null),markers=useRef(new Map());
  const latest=useRef({position,theme});latest.current={position,theme};
  const [map,setMap]=useState(null),[planes,setPlanes]=useState([]),[selectedId,setSelectedId]=useState(null);
  const [status,setStatus]=useState('loading'),[clock,setClock]=useState(()=>performance.now());
  const catalogue=shapeCatalogue;
  const [showList,setShowList]=useState(false),[mapRetry,setMapRetry]=useState(0);
  const [mapError,setMapError]=useState(false),[photoFailed,setPhotoFailed]=useState(false);
  const lastSelected=useRef(null),selectedIdRef=useRef(selectedId);selectedIdRef.current=selectedId;
  const canStart=validAtlasPosition(position);
  const codes=useMemo(()=>new Set(catalogue.map(p=>p.code)),[catalogue]);
  const activePlanes=planes.filter(p=>clock-p.observedAtMs<=RADAR_EXPIRE_MS);
  const selected=planes.find(p=>p.id===selectedId)??(lastSelected.current?.id===selectedId?lastSelected.current:null);
  if(selected)lastSelected.current=selected;
  const detail=useAircraftDetail(selected);
  useEffect(()=>setPhotoFailed(false),[selectedId,detail.photo?.src]);
  useEffect(()=>setExpanded(false),[selectedId]);
  useEffect(()=>{
    if(!photoFailed)return;
    const retry=()=>{if(!document.hidden&&navigator.onLine!==false)setPhotoFailed(false);};
    const timer=setTimeout(retry,60000);window.addEventListener('online',retry);document.addEventListener('visibilitychange',retry);
    return()=>{clearTimeout(timer);window.removeEventListener('online',retry);document.removeEventListener('visibilitychange',retry);};
  },[photoFailed]);
  useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden)setClock(performance.now());},1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{
    if(!canStart)return;
    const loader=createRadarPoller({intervalMs:2500,canLoad:()=>!document.hidden&&navigator.onLine!==false&&validAtlasPosition(latest.current.position),
      load:async signal=>{const center=latest.current.position;const payload=await radarJson(radarPointUrl(center),{signal,headers:{'X-Air-Atlas':'1'}});
        if(!Array.isArray(payload?.ac)||!Number.isFinite(payload.now)||Math.abs(Date.now()-payload.now)>120000)throw Error('Stale radar response');
        return normalizeRadarSnapshot(payload,{center,epochNowMs:Date.now(),receivedAtMs:performance.now()});},
      onResult:next=>setPlanes(previous=>{
        const seen=new Set(next.map(p=>p.id));
        const held=previous.filter(p=>!seen.has(p.id)&&(p.id===selectedIdRef.current||performance.now()-p.observedAtMs<RADAR_EXPIRE_MS));
        return [...next.map(p=>{const old=previous.find(v=>v.id===p.id);return {...p,typeCode:p.typeCode||old?.typeCode||'',category:p.category||old?.category||''};}),...held].slice(0,64);
      }),onStatus:setStatus,
    });return subscribeLifecycle(loader);
  },[canStart]);
  useEffect(()=>{
    if(!canStart||!host.current){onRenderer('Air Atlas · waiting for GPS');return;}
    let disposed=false,resize,visibility;
    setMapError(false);
    import('maplibre-gl').then(({default:gl})=>{
      if(disposed)return;library.current=gl;
      const point=latest.current.position;
      const instance=new gl.Map({container:host.current,style:createAirAtlasStyle(latest.current.theme.palette,appearance,labels),
        center:[point.longitude,point.latitude],zoom:9,bearing:0,pitch:0,maxPitch:0,minZoom:5,maxZoom:14,
        attributionControl:false,antialias:false,fadeDuration:0,pixelRatio:atlasMapPixelRatio(window.devicePixelRatio),renderWorldCopies:false});
      mapRef.current=instance;setMap(instance);
      instance.dragRotate.disable();instance.touchZoomRotate.disableRotation();
      const home=document.createElement('div');home.className='air-atlas-home';home.setAttribute('aria-label','Your location');
      homeMarker.current=new gl.Marker({element:home,rotationAlignment:'map'}).setLngLat([point.longitude,point.latitude]).addTo(instance);
      instance.on('dragstart',()=>{followHome.current=false;});
      instance.on('load',()=>{if(!disposed)onRenderer('Air Atlas · MapLibre');});
      instance.on('render',()=>{if(!document.hidden&&!flightViewRef.current){const canvas=instance.getCanvas();onFrame(performance.now(),1000/60,'WebGL2 · MapLibre',canvas.width,canvas.height);}});
      instance.on('error',()=>{if(!disposed)setMapError(true);});
      instance.on('idle',()=>{if(!disposed&&instance.isStyleLoaded())setMapError(false);});
      resize=new ResizeObserver(()=>instance.resize());resize.observe(host.current);
      visibility=()=>{if(!document.hidden){instance.resize();instance.triggerRepaint();}};
      document.addEventListener('visibilitychange',visibility);
    }).catch(error=>{if(!disposed){setMapError(true);onRuntimeError?.(error);}});
    return()=>{disposed=true;resize?.disconnect();if(visibility)document.removeEventListener('visibilitychange',visibility);
      markers.current.forEach(({marker})=>marker.remove());markers.current.clear();mapRef.current?.remove();mapRef.current=null;setMap(null);};
  },[canStart,mapRetry,onRenderer,onFrame,onRuntimeError]);
  useEffect(()=>{if(map)map.setStyle(createAirAtlasStyle(theme.palette,appearance,labels));},[map,theme.palette,appearance,labels]);
  useEffect(()=>{
    if(!map||!library.current)return;
    const visible=new Set(activePlanes.map(p=>p.id));
    for(const [id,entry] of markers.current){if(!visible.has(id)){entry.marker.remove();markers.current.delete(id);}}
    for(const plane of activePlanes){
      let entry=markers.current.get(plane.id);
      if(!entry){const button=document.createElement('button');button.type='button';button.className='aircraft-marker';button.dataset.aircraftId=plane.id;
        const shape=document.createElement('span');const distance=document.createElement('small');distance.className='aircraft-distance';button.append(shape,distance);button.addEventListener('click',event=>{event.stopPropagation();setSelectedId(plane.id);setShowList(false);});
        const marker=new library.current.Marker({element:button,anchor:'center',subpixelPositioning:true}).setLngLat([plane.longitude,plane.latitude]).addTo(map);
        entry={marker,button,shape,distance,history:[]};markers.current.set(plane.id,entry);}
      const code=radarShapeCode(plane,codes);
      entry.shape.style.maskImage=code?`url('/third-party/aircraft-shapes/normalized/${encodeURIComponent(code)}.svg')`:radarFallbackMask(plane,types);
      entry.shape.style.webkitMaskImage=entry.shape.style.maskImage;
      entry.shape.className='';
      entry.button.dataset.symbol=code?'exact':radarCategory(plane,types);
      entry.button.title=code?`${plane.typeCode} silhouette`:`${radarCategory(plane,types)} silhouette · exact model shape unavailable`;
      entry.shape.dataset.heading=Number.isFinite(plane.trackDegrees)?'known':'unknown';
      entry.button.setAttribute('aria-label',`${plane.callsign||plane.registration||plane.id} · ${plane.typeCode||'Unknown type'}`);
      entry.button.setAttribute('aria-pressed',String(plane.id===selectedId));
      entry.button.classList.toggle('is-stale',clock-plane.observedAtMs>RADAR_FRESH_MS);
      entry.history=appendRadarObservation(entry.history,plane);
    }
  },[map,planes,selectedId,codes,clock,types]);
  useEffect(()=>{
    if(!map)return;
    let frame,lastMini=0;
    const animate=()=>{
      if(document.hidden)return;
      const time=performance.now();
      for(const entry of markers.current.values()){
        if(flightViewRef.current&&entry.button.dataset.aircraftId!==selectedIdRef.current)continue;
        const sample=sampleRadarTrack(entry.history,time,reducedMotion);
        if(!sample)continue;
        entry.marker.setLngLat([sample.longitude,sample.latitude]);
        if(flightViewRef.current&&time-lastMini>250){map.easeTo({center:[sample.longitude,sample.latitude],zoom:9,bearing:0,duration:300});lastMini=time;}
        const heading=sample.trackDegrees;
        entry.shape.style.transform=Number.isFinite(heading)?`rotate(${heading-map.getBearing()}deg)`:'none';
        entry.button.dataset.motion=sample.motion;
        const home=latest.current.position;
        entry.distance.textContent=validAtlasPosition(home)?`${(discoverDistanceMetres(home,sample)/1000).toFixed(1)} km`:'';
      }
      frame=requestAnimationFrame(animate);
    };
    const wake=()=>{cancelAnimationFrame(frame);if(!document.hidden)animate();};
    document.addEventListener('visibilitychange',wake);animate();
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',wake);};
  },[map,reducedMotion]);
  useEffect(()=>{if(!map||flightView)return;map.easeTo({...(followHome.current&&validAtlasPosition(position)?{center:[position.longitude,position.latitude]}:{}),bearing,duration:reducedMotion?0:700});},[map,position?.latitude,position?.longitude,bearing,reducedMotion,flightView]);
  useEffect(()=>{if(homeMarker.current&&validAtlasPosition(position)){homeMarker.current.setLngLat([position.longitude,position.latitude]).setRotation(headingFresh?position.heading:0);homeMarker.current.getElement().classList.toggle('is-direction-unknown',!headingFresh);}},[map,position,headingFresh]);
  useEffect(()=>{
    if(!map)return;
    if(flightView){radarCamera.current={center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing()};map.stop();}
    else if(radarCamera.current){map.jumpTo(radarCamera.current);radarCamera.current=null;}
    map.resize();
  },[map,flightView]);
  const cameraUnavailable=radarFlightAvailability(selected,clock);
  const readFlightSample=time=>sampleRadarTrack(markers.current.get(selectedId)?.history??[],time,reducedMotion);
  const reset=()=>{followHome.current=true;const point=latest.current.position;if(map&&validAtlasPosition(point))map.easeTo({center:[point.longitude,point.latitude],zoom:9,bearing,duration:reducedMotion?0:500});};
  const flightSample=flightView?readFlightSample(clock):null;
  const flightAltitude=flightSample?(flightSample.geometricAltitudeFeet??flightSample.altitudeFeet):(selected?.geometricAltitudeFeet??selected?.altitudeFeet);
  const flightDistance=flightSample&&validAtlasPosition(position)?discoverDistanceMetres(position,flightSample):selected?.distanceMetres;
  const age=selected?Math.max(0,Math.round((clock-selected.observedAtMs)/1000)):0;
  return <section className={`air-atlas-field${selected&&!flightView?' has-detail':''}${flightView?' is-flight-view':''}`} aria-label="Air Atlas radar" onPointerDown={event=>{if(event.target.closest('button,a,.air-atlas-detail'))event.stopPropagation();}} style={{"--radar-ring":selectionColor,"--radar-accent":colors.accent,"--radar-secondary":colors.secondary,"--radar-base":colors.background}}>
    {flightView&&selected?<RadarFlightView gl={library.current} plane={selected} readSample={readFlightSample} palette={theme.palette} reducedMotion={reducedMotion} onClose={()=>setFlightView(false)} onFrame={onFrame}/>:null}
    <div className="radar-map-shell">
      {flightView&&selected?<div className="flight-inset-heading"><strong>{selected.callsign||selected.registration||selected.id}</strong><span>{selected.typeCode||'Aircraft'} · N ↑</span></div>:null}
      <div ref={host} className="air-atlas-map" inert={flightView?true:undefined}/>
      {flightView&&selected?<div className="flight-inset-telemetry">
        <span><small>ALTITUDE</small><strong>{Number.isFinite(flightAltitude)?Math.round(flightAltitude*0.3048).toLocaleString('en')+' m':'—'}</strong></span>
        <span><small>GROUND SPEED</small><strong>{selected.groundSpeedKnots===null?'—':Math.round(selected.groundSpeedKnots*1.852)+' km/h'}</strong></span>
        <span><small>FROM YOU</small><strong>{Number.isFinite(flightDistance)?(flightDistance/1000).toFixed(1)+' km':'—'}</strong></span>
        <span><small>OBSERVATION</small><strong>{age}s ago</strong></span>
      </div>:null}
    </div>
    {!canStart?<div className="atlas-waiting"><strong>AIR ATLAS</strong><span>Location required to find nearby aircraft</span><button onClick={onRetryLocation}>ENABLE GPS</button></div>:!flightView?<>
      <div className="air-atlas-toolbar" aria-label="Air Atlas map controls">
        <button onClick={()=>{setShowList(v=>!v);setSelectedId(null);}} aria-expanded={showList} aria-controls="air-atlas-list">{activePlanes.length} AIRCRAFT</button>
        <button aria-label="Show place labels" aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>LABELS {labels?'ON':'OFF'}</button>
        {mapError?<button className="air-atlas-map-retry" onClick={()=>setMapRetry(v=>v+1)}>RETRY MAP</button>:<button aria-label="Use natural map colors" aria-pressed={appearance==='natural'} onClick={()=>setAppearance(v=>v==='palette'?'natural':'palette')}>{appearance==='natural'?'NATURAL':'PALETTE'}</button>}
        <div className="air-atlas-controls"><button aria-label="Follow driving direction" aria-pressed={!northUp} onClick={()=>setNorthUp(v=>!v)}>{northUp?'N':'↑'}</button><button aria-label="Zoom in" onClick={()=>map?.zoomIn()}>+</button><button aria-label="Reset radar view" onClick={reset}>RESET</button><button aria-label="Zoom out" onClick={()=>map?.zoomOut()}>−</button></div>
      </div>
      <div className="air-atlas-status" role="status">{!northUp&&!headingFresh?'Waiting for driving direction · north up':navigator.onLine===false?'Offline · positions held':status==='loading'?'Finding aircraft…':status==='retrying'?'Feed unavailable · retrying':'ADSB.lol · 50 km nearby · 5s buffer'}</div>
      {showList?<div id="air-atlas-list" className="air-atlas-list" aria-label="Nearby aircraft">{activePlanes.length?activePlanes.map(p=><button key={p.id} onClick={()=>{setSelectedId(p.id);setShowList(false);}}>{p.callsign||p.registration||p.id}<span>{p.typeCode||'Unknown'} · {(p.distanceMetres/1000).toFixed(0)} km</span></button>):<p>No recent aircraft in range.</p>}</div>:null}
    </>:null}
    {selected&&!flightView?<div className={`air-atlas-detail${expanded?' is-expanded':''}`} aria-label="Selected aircraft detail">
      <div className="air-atlas-detail-scroll" tabIndex={0} role="region" aria-label="Aircraft information and live telemetry" onClick={event=>{if(!event.target.closest('button,a')&&!expanded)setExpanded(true);}}>
      <div className="air-atlas-photo">{detail.photo&&!photoFailed?<><a href={detail.photo.link} target="_blank" rel="noreferrer"><img src={detail.photo.src} alt={`${selected.registration||selected.typeCode||'Selected aircraft'} photograph`} referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)} /></a><a href={detail.photo.link} target="_blank" rel="noreferrer">© {detail.photo.photographer}</a></>:<span>{detail.photoStatus==='loading'?'Loading photo…':detail.photoStatus==='retrying'?'Photo retrying…':'Photo unavailable'}</span>}</div>
      <div className="air-atlas-flight"><strong>{selected.callsign||selected.registration||selected.id.toUpperCase()}</strong><span>{selected.registration||'Registration unknown'} · {selected.typeCode||'Type unknown'}</span>
        <span>{selected.altitudeFeet===null?'Altitude unknown':`${Math.round(selected.altitudeFeet*0.3048).toLocaleString('en')} m baro`} · {selected.groundSpeedKnots===null?'Speed unknown':`${Math.round(selected.groundSpeedKnots*1.852)} km/h`}</span>
        <small>{age>120?'SIGNAL LOST':age>30?'STALE POSITION':'POSITION'} · {age}s ago</small></div>
      <div className="air-atlas-route">
        <div><span>DEPARTURE</span><AirportCode airport={detail.route?.origin}/><small>{detail.route?.origin.city||(detail.routeStatus==='loading'?'Finding route…':'Not available')}</small></div>
        <div><span>ARRIVAL</span><AirportCode airport={detail.route?.destination}/><small>{detail.route?.destination.city||'Not available'}</small></div>
        <small className="air-atlas-route-source">{detail.route?'ADSB.lol · plausible route':detail.routeStatus==='retrying'?'Route unavailable · retrying':'No verified route supplied'}</small>
      </div>

      {expanded?<div id="air-atlas-extra" className="air-atlas-extra">
        <div><span>DEPARTURE AIRPORT</span><strong>{detail.route?.origin.name||'Not available'}</strong></div>
        <div><span>ARRIVAL AIRPORT</span><strong>{detail.route?.destination.name||'Not available'}</strong></div>
        <div><span>AIRCRAFT</span><strong>{types[selected.typeCode]?.[0]||catalogue.find(p=>p.code===selected.typeCode)?.name||selected.typeCode||'Unknown type'}</strong></div>
        <div><span>DISTANCE</span><strong>{(selected.distanceMetres/1000).toFixed(1)} km</strong></div>
        <h3>Live telemetry</h3>
        <p>Latest supplied values. Fields may update at different times; missing values stay unavailable.</p>
        {radarTelemetryRows(selected).map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
        <div><span>ICAO ADDRESS</span><strong>{selected.id.toUpperCase()}</strong></div>
        <div><span>FLIGHT STATE</span><strong>{selected.onGround?'On ground':selected.altitudeFeet===null?'Unknown':'Airborne observation'}</strong></div>
        {detail.route?.via.length?<div><span>VIA</span><strong>{detail.route.via.map(p=>p.name||p.code).join(' · ')}</strong></div>:null}
      </div>:null}
      </div>
      <div className="air-atlas-detail-actions"><button className="air-atlas-camera" disabled={!!cameraUnavailable} title={cameraUnavailable||'Reconstructed terrain view'} aria-label="View from aircraft" onClick={()=>{setExpanded(false);setFlightView(true);}}>FLY WITH</button><button className="air-atlas-expand" aria-label={expanded?'Collapse aircraft detail':'Expand aircraft detail'} aria-expanded={expanded} aria-controls="air-atlas-extra" onClick={()=>setExpanded(v=>!v)}>{expanded?<><span>Scroll for live telemetry</span><strong>LESS ↑</strong></>:'FLIGHT DETAILS ↑'}</button>
      <button className="air-atlas-close" aria-label="Close aircraft detail" onClick={()=>setSelectedId(null)}>×</button></div>
    </div>:null}
    <div className="air-atlas-attribution"><a href="https://www.adsb.lol/docs/open-data/api/" target="_blank" rel="noreferrer">ADSB.lol</a> · <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="/third-party/aircraft-shapes/LICENSE" target="_blank" rel="noreferrer">Shapes © RexKramer1</a>{flightView?<><span className="flight-terrain-credit"> · <a href="https://mapterhorn.com/attribution/" target="_blank" rel="noreferrer">Terrain © Mapterhorn</a></span></>:null}<span>Rounded location shared for nearby traffic · photos on selection</span></div>
  </section>;
}
