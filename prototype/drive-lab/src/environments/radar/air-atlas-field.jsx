import {radarViewportQuery,radarMinimumZoom} from './radar-viewport.js';
import {createRadarLens,radarLensOffset} from './radar-lens.js';
import {createLoadRecovery} from '../../load-recovery.js';
import {appendHomeObservation,homeTrailFeature} from './radar-home-trail.js';
import {radarLocationPresentation} from './radar-location.js';
import {useEffect,useMemo,useRef,useState} from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {atlasMapPixelRatio,validAtlasPosition,paletteToAtlasCss} from '../atlas/atlas-model.js';
import {normalizeRadarSnapshot,radarPointUrl,radarAircraftUrl,RADAR_LIMIT,RADAR_EXPIRE_MS,RADAR_FRESH_MS} from './radar-model.js';
import {radarJson,createRadarPoller} from './radar-client.js';
import {radarPhotoUrl,radarRouteUrl,normalizeRadarPhoto,normalizeRadarRoute,radarShapeCode} from './radar-detail.js';

import {radarFallbackMask,radarCategory} from './radar-symbols.js';
import RadarFlightView from './radar-flight-view.jsx';
import {radarFlightAvailability} from './radar-flight-model.js';
import types from '../../../public/third-party/aircraft-types/types.json';
import shapeCatalogue from '../../../public/third-party/aircraft-shapes/catalogue.json';
import {appendRadarObservation, sampleRadarTrack, radarTrailCoordinates} from './radar-motion.js';
import {discoverDistanceMetres} from '../../discover/discover-model.js';
import {createAirAtlasStyle,radarTelemetryRows} from './radar-presentation.js';

function RadarIcon({kind}) {
  const paths = {refresh:'M20 7v5h-5 M20 12a8 8 0 1 0-2.4 5.7',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5 M9 3v16 M15 5v16',home:'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',plus:'M5 12h14 M12 5v14',minus:'M5 12h14'};
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}

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

export default function AirAtlasField({position,gpsState,theme,reducedMotion,onRenderer,onFrame,onRuntimeError,onRetryLocation}){
  const [labels,setLabels]=useState(false),[appearance,setAppearance]=useState('palette');
  const colors=paletteToAtlasCss(theme.palette);
  const selectionColor=theme.palette.accent.reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0)>0.6?'#151515':'#fff';
  const actionLuminance=theme.palette.accent.reduce((sum,c,i)=>sum+(c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4)*[0.2126,0.7152,0.0722][i],0);
  const followHome=useRef(true),homeMarker=useRef(null),homeHistory=useRef([]),mapRecovery=useRef(null);
  const mapCamera=useRef(null);
  useEffect(()=>{homeHistory.current=appendHomeObservation(homeHistory.current,position,performance.now());},[position]);
  const [flightView,setFlightView]=useState(false);
  const flightViewRef=useRef(false);flightViewRef.current=flightView;
  const radarCamera=useRef(null),lens=useRef(null);
  const [northUp,setNorthUp]=useState(true),[expanded,setExpanded]=useState(false);
  const headingFresh=Number.isFinite(position?.heading)&&position?.speedKmh>3&&clockSafe(position);
  const bearing=northUp||!headingFresh?0:position.heading;
  const host=useRef(null),mapRef=useRef(null),library=useRef(null),markers=useRef(new Map());
  const latest=useRef({position,theme});latest.current={position,theme,appearance,labels};
  const [map,setMap]=useState(null),[planes,setPlanes]=useState([]),[selectedId,setSelectedId]=useState(null);
  const [status,setStatus]=useState('loading'),[clock,setClock]=useState(()=>performance.now());
  const catalogue=shapeCatalogue;
  const [showList,setShowList]=useState(false),[mapRetry,setMapRetry]=useState(0);
  const [mapError,setMapError]=useState(false),[photoFailed,setPhotoFailed]=useState(false);
  const lastSelected=useRef(null),selectedIdRef=useRef(selectedId);selectedIdRef.current=selectedId;
  const queryRef=useRef(null),pollerRef=useRef(null),queryGeneration=useRef(0),lastTargetCheck=useRef({id:null,time:0});
  const [areaPending,setAreaPending]=useState(false);
  const [coverage,setCoverage]=useState(null),[feedAt,setFeedAt]=useState(null),[truncated,setTruncated]=useState(false);
  const canStart=validAtlasPosition(position);
  const [permission,setPermission]=useState('unknown');
  useEffect(()=>{
    let disposed=false,permissionStatus;
    const update=()=>{if(!disposed)setPermission(permissionStatus.state);};
    // Some embedded browsers do not expose Permissions API. Actual fixes still work.
    Promise.resolve().then(()=>navigator.permissions?.query({name:'geolocation'})).then(result=>{
      if(disposed||!result)return;permissionStatus=result;update();result.addEventListener('change',update);
    }).catch(()=>{});
    return()=>{disposed=true;permissionStatus?.removeEventListener('change',update);};
  },[]);
  const locationPresentation=radarLocationPresentation(position,gpsState,permission,clock);
  const codes=useMemo(()=>new Set(catalogue.map(p=>p.code)),[catalogue]);
  const activePlanes=planes.filter(p=>{
    if(clock-p.observedAtMs>RADAR_EXPIRE_MS)return false;
    if(flightView&&p.id===selectedId)return true;
    if(!map)return true;
    const point=map.project([p.longitude,p.latitude]),container=map.getContainer();
    return point.x>=-24&&point.x<=container.clientWidth+24&&point.y>=-24&&point.y<=container.clientHeight+24;
  });
  const selected=planes.find(p=>p.id===selectedId)??(lastSelected.current?.id===selectedId?lastSelected.current:null);
  if(selected)lastSelected.current=selected;
  const detail=useAircraftDetail(selected);
  useEffect(()=>setPhotoFailed(false),[selectedId,detail.photo?.src]);
  useEffect(()=>{setExpanded(false);if(selectedId)pollerRef.current?.refresh();},[selectedId]);
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
      load:async signal=>{
        const generation=queryGeneration.current;
        const area=queryRef.current??{...latest.current.position,radiusNm:27};
        const center=latest.current.position;
        const payload=await radarJson(radarPointUrl(area,area.radiusNm),{signal,maximumBytes:4194304,headers:{'X-Air-Atlas':'1'}});
        if(!Array.isArray(payload?.ac)||!Number.isFinite(payload.now)||Math.abs(Date.now()-payload.now)>120000)throw Error('Stale radar response');
        let next=normalizeRadarSnapshot(payload,{center,epochNowMs:Date.now(),receivedAtMs:performance.now()});
        const id=selectedIdRef.current,current=next.find(p=>p.id===id);
        // Follow the selected aircraft even after it leaves the map query or its position grows old.
        if(id&&(!current||(current.stale&&(lastTargetCheck.current.id!==id||performance.now()-lastTargetCheck.current.time>=10000)))){
          lastTargetCheck.current={id,time:performance.now()};
          try{
            const selectedPayload=await radarJson(radarAircraftUrl(id),{signal,maximumBytes:131072,headers:{'X-Air-Atlas':'1'}});
            const targeted=normalizeRadarSnapshot(selectedPayload,{center,epochNowMs:Date.now(),receivedAtMs:performance.now()}).find(p=>p.id===id);
            if(targeted&&(!current||targeted.observedAtMs>=current.observedAtMs))next=[...next.filter(p=>p.id!==id),targeted];
          }catch(error){if(signal.aborted)throw error;}
        }
        return {next,generation,area,feedAt:performance.now()-Math.max(0,Date.now()-payload.now),truncated:payload.truncated===true};
      },
      onResult:result=>{
        if(result.generation!==queryGeneration.current)return;
        setAreaPending(false);setFeedAt(result.feedAt);setTruncated(result.truncated);
        setPlanes(previous=>{
          const previousById=new Map(previous.map(p=>[p.id,p]));
          const {next,area}=result,seen=new Set(next.map(p=>p.id));
          const held=previous.filter(p=>!seen.has(p.id)&&(p.id===selectedIdRef.current||
            (performance.now()-p.observedAtMs<RADAR_EXPIRE_MS&&discoverDistanceMetres(area,p)<=area.radiusNm*1852)));
          return [...next.map(p=>{const old=previousById.get(p.id);return {
            ...(old&&old.observedAtMs>p.observedAtMs?{...p,...old}:p),
            typeCode:p.typeCode||old?.typeCode||'',category:p.category||old?.category||'',signalAtMs:Number.isFinite(p.signalAtMs)&&Number.isFinite(old?.signalAtMs)?Math.max(p.signalAtMs,old.signalAtMs):p.signalAtMs??old?.signalAtMs??null,missingFromFeed:false};}),
            ...held.map(p=>({...p,missingFromFeed:true}))].slice(0,RADAR_LIMIT+1);
        });
      },onStatus:value=>{setStatus(value);if(value==='retrying')setAreaPending(false);},
    });pollerRef.current=loader;
    const cleanup=subscribeLifecycle(loader);return()=>{pollerRef.current=null;cleanup();};
  },[canStart]);
  useEffect(()=>{
    if(!map)return;
    const update=()=>{
      if(flightViewRef.current)return;
      const container=map.getContainer(),center=map.getCenter();
      const minZoom=radarMinimumZoom(center.lat,container.clientWidth,container.clientHeight);
      if(Math.abs(map.getMinZoom()-minZoom)>0.01)map.setMinZoom(minZoom);
      const area=radarViewportQuery(center,[[0,0],[container.clientWidth,0],[0,container.clientHeight],[container.clientWidth,container.clientHeight]].map(point=>map.unproject(point)));
      if(area.requiredNm>250){map.setMinZoom(Math.min(14,map.getZoom()+Math.log2(area.requiredNm/245)));return;}
      setCoverage(area);
      if(queryRef.current?.key!==area.key){queryRef.current=area;queryGeneration.current++;setAreaPending(true);pollerRef.current?.refresh();}
    };
    map.on('moveend',update);map.on('resize',update);update();
    return()=>{map.off('moveend',update);map.off('resize',update);};
  },[map,flightView]);
  useEffect(()=>{
    if(!canStart)return;
    const recovery=createLoadRecovery({now:performance.now.bind(performance),schedule:setTimeout,cancel:clearTimeout,
      canRetry:()=>!document.hidden&&navigator.onLine!==false,
      retry:()=>setMapRetry(v=>v+1)});
    mapRecovery.current=recovery;
    const wake=()=>{if(!document.hidden&&navigator.onLine!==false)recovery.wake();};
    window.addEventListener('online',wake);document.addEventListener('visibilitychange',wake);
    return()=>{recovery.dispose();mapRecovery.current=null;window.removeEventListener('online',wake);document.removeEventListener('visibilitychange',wake);};
  },[canStart]);
  useEffect(()=>{
    if(!canStart||!host.current){onRenderer('Air Atlas · waiting for GPS');return;}
    let disposed=false,mapFailed=false,resize,visibility,loadDeadline;
    const recovery=mapRecovery.current;
    setMapError(false);
    import('../../maplibre-runtime.js').then(gl=>{
      if(disposed)return;library.current=gl;
      const point=latest.current.position;
      const instance=new gl.Map({container:host.current,style:createAirAtlasStyle(latest.current.theme.palette,appearance,labels),
        center:mapCamera.current?.center??[point.longitude,point.latitude],zoom:mapCamera.current?.zoom??9,bearing:mapCamera.current?.bearing??0,pitch:0,maxPitch:0,minZoom:5,maxZoom:14,
        attributionControl:false,canvasContextAttributes:{antialias:false},fadeDuration:0,pixelRatio:atlasMapPixelRatio(window.devicePixelRatio),renderWorldCopies:false});
      mapRef.current=instance;setMap(instance);
      instance.dragRotate.disable();instance.touchZoomRotate.disableRotation();
      const home=document.createElement('div');home.className='air-atlas-home';home.setAttribute('aria-label','Your location');home.title='You · current GPS location';
      homeMarker.current=new gl.Marker({element:home,rotationAlignment:'map'}).setLngLat([point.longitude,point.latitude]).addTo(instance);
      lens.current=createRadarLens(instance);
      instance.on('dragstart',()=>{followHome.current=false;});
      instance.on('load',()=>{if(!disposed)onRenderer('Air Atlas · MapLibre');});
      instance.on('render',()=>{if(!document.hidden&&!flightViewRef.current){const canvas=instance.getCanvas();onFrame(performance.now(),1000/60,'WebGL2 · MapLibre',canvas.width,canvas.height);}});
      instance.on('error',()=>{if(!disposed){mapFailed=true;setMapError(true);recovery.fail();}});
      instance.on('idle',()=>{if(!disposed&&!mapFailed&&instance.isStyleLoaded()){setMapError(false);clearTimeout(loadDeadline);recovery.succeed();}});
      loadDeadline=setTimeout(()=>{if(!disposed&&!instance.isStyleLoaded()){setMapError(true);recovery.fail();}},20000);
      resize=new ResizeObserver(()=>instance.resize());resize.observe(host.current);
      visibility=()=>{if(!document.hidden){instance.resize();instance.triggerRepaint();}};
      document.addEventListener('visibilitychange',visibility);
    }).catch(error=>{if(!disposed){setMapError(true);recovery.fail();onRuntimeError?.(error);}});
    return()=>{disposed=true;clearTimeout(loadDeadline);if(mapRef.current)mapCamera.current={center:mapRef.current.getCenter(),zoom:mapRef.current.getZoom(),bearing:mapRef.current.getBearing()};resize?.disconnect();if(visibility)document.removeEventListener('visibilitychange',visibility);
      lens.current?.dispose();lens.current=null;
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
  },[map,planes,selectedId,codes,clock,types,coverage]);
  useEffect(()=>{
    if(!map)return;
    let frame,lastMini=0,lastTrails=0,lastTrailData='',lastHomeData='',lastHomeOffset=null;
    const animate=()=>{
      if(document.hidden)return;
      const time=performance.now();
      for(const entry of markers.current.values()){
        const sample=sampleRadarTrack(entry.history,time,reducedMotion);
        if(!sample)continue;
        const screen=map.project([sample.longitude,sample.latitude]),container=map.getContainer();
        const selected=entry.button.dataset.aircraftId===selectedIdRef.current;
        const draw=!entry.lastScreen||Math.hypot(screen.x-entry.lastScreen.x,screen.y-entry.lastScreen.y)>=0.05||entry.lastBearing!==map.getBearing()||entry.lastHeading!==sample.trackDegrees||entry.lastLens!==lens.current?.active;
        if(draw){entry.marker.setLngLat([sample.longitude,sample.latitude]);entry.lastScreen=screen;entry.lastDraw=time;entry.lastBearing=map.getBearing();entry.lastHeading=sample.trackDegrees;entry.lastLens=lens.current?.active;
        entry.marker.setOffset(lens.current?.active?radarLensOffset(screen,container.clientWidth,container.clientHeight):[0,0]);
        if(flightViewRef.current&&entry.button.dataset.aircraftId===selectedIdRef.current&&time-lastMini>250){map.easeTo({center:[sample.longitude,sample.latitude],zoom:9,bearing:0,duration:300});lastMini=time;}
        const heading=sample.trackDegrees;
        entry.shape.style.transform=Number.isFinite(heading)?`rotate(${heading-map.getBearing()}deg)`:'none';}
        entry.button.dataset.motion=sample.motion;
        const home=latest.current.position;
        if(selected)entry.distance.textContent=validAtlasPosition(home)?`${!Number.isFinite(home.accuracyM)||home.accuracyM>250?'≈ ':''}${(discoverDistanceMetres(home,sample)/1000).toFixed(1)} km`:'';
      }
      if(homeMarker.current&&validAtlasPosition(latest.current.position)){
        const home=latest.current.position,screen=map.project([home.longitude,home.latitude]),container=map.getContainer();
        const offset=lens.current?.active?radarLensOffset(screen,container.clientWidth,container.clientHeight):[0,0];
        if(!lastHomeOffset||offset.some((v,i)=>Math.abs(v-lastHomeOffset[i])>.05)){homeMarker.current.setOffset(offset);lastHomeOffset=offset;}
      }
      if(time-lastTrails>=1000&&map.isStyleLoaded()){
        const features=[];
        for(const [id,entry] of markers.current){
          const coordinates=radarTrailCoordinates(entry.history,time,reducedMotion);
          if(coordinates.length>1)features.push({type:'Feature',properties:{id},geometry:{type:'LineString',coordinates}});
        }
        const trailData=JSON.stringify({type:'FeatureCollection',features});
        if(trailData!==lastTrailData){map.getSource('radar-trails')?.setData(JSON.parse(trailData));lastTrailData=trailData;}
        const homeData=JSON.stringify(homeTrailFeature(homeHistory.current,time));
        if(homeData!==lastHomeData){map.getSource('radar-home-trail')?.setData(JSON.parse(homeData));lastHomeData=homeData;}lastTrails=time;
      }
      frame=requestAnimationFrame(animate);
    };
    const wake=()=>{cancelAnimationFrame(frame);if(!document.hidden)animate();};
    const resetTrails=()=>{lastTrailData='';lastHomeData='';};map.on('styledata',resetTrails);
    document.addEventListener('visibilitychange',wake);animate();
    return()=>{cancelAnimationFrame(frame);map.off('styledata',resetTrails);document.removeEventListener('visibilitychange',wake);};
  },[map,reducedMotion]);
  useEffect(()=>{if(!map||flightView)return;map.easeTo({...(followHome.current&&validAtlasPosition(position)?{center:[position.longitude,position.latitude]}:{}),bearing,duration:reducedMotion?0:700});},[map,position?.latitude,position?.longitude,bearing,reducedMotion,flightView]);
  useEffect(()=>{if(homeMarker.current&&validAtlasPosition(position)){homeMarker.current.setLngLat([position.longitude,position.latitude]).setRotation(headingFresh?position.heading:0);homeMarker.current.getElement().classList.toggle('is-direction-unknown',!headingFresh);}},[map,position,headingFresh]);
  useEffect(()=>{homeMarker.current?.getElement().classList.toggle('is-stale',!clockSafe(position));},[clock,position]);
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
  return <section className={`air-atlas-field${selected&&!flightView?' has-detail':''}${flightView?' is-flight-view':''}`} aria-label="Air Atlas radar" onPointerDown={event=>{if(event.target.closest('button,a,details,.air-atlas-credit-line,.air-atlas-detail'))event.stopPropagation();}} style={{"--radar-ring":selectionColor,"--radar-button-ink":actionLuminance>0.179?'#000':'#fff',"--radar-accent":colors.accent,"--radar-secondary":colors.secondary,"--radar-base":colors.background}}>
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
    {!canStart?<div className="atlas-waiting"><strong>AIR ATLAS</strong><span>{locationPresentation.message}</span>{locationPresentation.action?<button onClick={onRetryLocation}>{locationPresentation.action}</button>:null}</div>:!flightView?<>
      <div className="air-atlas-toolbar" aria-label="Air Atlas map controls">
        <button onClick={()=>{setShowList(v=>!v);setSelectedId(null);}} aria-expanded={showList} aria-controls="air-atlas-list">{activePlanes.length} AIRCRAFT</button>
        <button aria-label="Show place labels" aria-pressed={labels} onClick={()=>setLabels(v=>!v)}>LABELS {labels?'ON':'OFF'}</button>
        <div className="air-atlas-controls">
          <button className="air-atlas-refresh" aria-label="Refresh aircraft" title="Refresh aircraft positions" onClick={()=>{lastTargetCheck.current={id:null,time:0};setAreaPending(true);pollerRef.current?.refresh();}}><RadarIcon kind="refresh"/><span>UPDATE</span></button>
          <button aria-label="Use natural map colors" title={appearance==='natural'?'Natural map · switch to palette':'Show natural map colors'} aria-pressed={appearance==='natural'} onClick={()=>setAppearance(v=>v==='palette'?'natural':'palette')}><RadarIcon kind="map"/></button>
          <button aria-label="Follow driving direction" title={northUp?'North up · follow driving direction':'Driving direction · switch to north up'} aria-pressed={!northUp} onClick={()=>setNorthUp(v=>!v)}>{northUp?'N':'↑'}</button>
          <button aria-label="Zoom in" onClick={()=>map?.zoomIn()}><RadarIcon kind="plus"/></button>
          <button aria-label="Reset radar view" title="Recenter on you and resume following" onClick={reset}><RadarIcon kind="home"/></button>
          <button aria-label="Zoom out" onClick={()=>map?.zoomOut()}><RadarIcon kind="minus"/></button>
        </div>
      </div>
      <div className="air-atlas-status" role="status">{mapError?<button className="air-atlas-map-retry" onClick={()=>setMapRetry(v=>v+1)}>RETRY MAP</button>:null}{locationPresentation.message||(!northUp&&!headingFresh?'Waiting for driving direction · north up':navigator.onLine===false?'Offline · positions held':status==='loading'?'Finding aircraft…':status==='retrying'?'Feed unavailable · retrying':areaPending?'Updating visible area…':`ADSB.lol · visible area${coverage?' · '+Math.round(coverage.radiusNm*1.852)+' km radius':''} · feed ${feedAt===null?'pending':Math.max(0,Math.floor((clock-feedAt)/1000))+'s ago'}${truncated?' · result limit reached':''}`)}</div>
      {showList?<div id="air-atlas-list" className="air-atlas-list" aria-label="Nearby aircraft">{activePlanes.length?activePlanes.map(p=><button key={p.id} onClick={()=>{setSelectedId(p.id);setShowList(false);}}>{p.callsign||p.registration||p.id}<span>{p.typeCode||'Unknown'} · {(p.distanceMetres/1000).toFixed(0)} km</span></button>):<p>No recent aircraft in range.</p>}</div>:null}
    </>:null}
    {selected&&!flightView?<div className={`air-atlas-detail${expanded?' is-expanded':''}`} aria-label="Selected aircraft detail">
      <div className="air-atlas-detail-scroll" tabIndex={0} role="region" aria-label="Aircraft information and live telemetry" onClick={event=>{if(!event.target.closest('button,a')&&!expanded)setExpanded(true);}}>
      <div className="air-atlas-photo">{detail.photo&&!photoFailed?<><a href={detail.photo.link} target="_blank" rel="noreferrer"><img src={detail.photo.src} alt={`${selected.registration||selected.typeCode||'Selected aircraft'} photograph`} referrerPolicy="no-referrer" onError={()=>setPhotoFailed(true)} /></a><a href={detail.photo.link} target="_blank" rel="noreferrer">© {detail.photo.photographer}</a></>:<span>{detail.photoStatus==='loading'?'Loading photo…':detail.photoStatus==='retrying'?'Photo retrying…':'Photo unavailable'}</span>}</div>
      <div className="air-atlas-flight"><strong>{selected.callsign||selected.registration||selected.id.toUpperCase()}</strong><span>{selected.registration||'Registration unknown'} · {selected.typeCode||'Type unknown'}</span>
        <span>{selected.altitudeFeet===null?'Altitude unknown':`${Math.round(selected.altitudeFeet*0.3048).toLocaleString('en')} m baro`} · {selected.groundSpeedKnots===null?'Speed unknown':`${Math.round(selected.groundSpeedKnots*1.852)} km/h`}</span>
        <small>{age>120?'POSITION LOST':age>30?'LAST POSITION':'POSITION'} · {age}s ago{selected.signalAtMs!=null?` · signal ${Math.max(0,Math.round((clock-selected.signalAtMs)/1000))}s ago`:''}{selected.missingFromFeed?' · outside latest feed':''}</small></div>
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
      <div className="air-atlas-detail-actions"><button className="air-atlas-camera" disabled={!!cameraUnavailable} title={cameraUnavailable||'Reconstructed terrain view'} aria-label="View from aircraft" onClick={()=>{setExpanded(false);setFlightView(true);}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9V4h5M16 4h5v5M21 16v4h-5M8 20H3v-4M7 13l5-6 5 6M12 7v10M8 17h8"/></svg><span>FLY WITH</span></button><button className="air-atlas-expand" aria-label={expanded?'Collapse aircraft detail':'Expand aircraft detail'} aria-expanded={expanded} aria-controls="air-atlas-extra" onClick={()=>setExpanded(v=>!v)}>{expanded?<><span>Scroll for live telemetry</span><strong>LESS ↑</strong></>:'FLIGHT DETAILS ↑'}</button>
      <button className="air-atlas-close" aria-label="Close aircraft detail" onClick={()=>setSelectedId(null)}>×</button></div>
    </div>:null}
    <div className="air-atlas-attribution">
      <div className="air-atlas-credit-line" role="region" aria-label="Map source credits" tabIndex={0}>
        <a href="https://www.adsb.lol/docs/open-data/api/" target="_blank" rel="noreferrer">ADSB.lol</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a> · <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="/third-party/aircraft-shapes/LICENSE" target="_blank" rel="noreferrer">Shapes © RexKramer1</a>{flightView?<span className="flight-terrain-credit"> · <a href="https://mapterhorn.com/attribution/" target="_blank" rel="noreferrer">Terrain © Mapterhorn</a></span>:null}
      </div>
      <details className="air-atlas-data-use"><summary>Rounded area shared</summary><p>Rounded map area shared for traffic · photos on selection</p></details>
    </div>
  </section>;
}
