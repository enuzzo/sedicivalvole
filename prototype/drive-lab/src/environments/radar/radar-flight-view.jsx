import {useEffect,useMemo,useRef,useState} from 'react';
import {atlasMapPixelRatio} from '../atlas/atlas-model.js';
import {radarFlightAvailability,radarCameraHeight,FLIGHT_CAMERA_PITCH,FLIGHT_TERRAIN_EXAGGERATION,createFlightTerrainStyle} from './radar-flight-model.js';

/** A reconstructed nose camera; the existing radar remains visible as its inset. */
export default function RadarFlightView({gl,plane,readSample,palette,reducedMotion,onClose,onFrame}){
  const host=useRef(null),mapRef=useRef(null),latest=useRef({plane,readSample,onFrame});
  latest.current={plane,readSample,onFrame};
  const [natural,setNatural]=useState(true),[state,setState]=useState({message:'Loading 3D terrain…',ready:false});
  const [retry,setRetry]=useState(0);
  const style=useMemo(()=>createFlightTerrainStyle(palette,natural),[palette,natural]);
  const styleRef=useRef(style);styleRef.current=style;
  useEffect(()=>{
    if(!gl||!host.current)return;
    let disposed=false,frame,timer,failures=0,terrainReady=false,lastUi=0,lastFrame=0,rendered=false,failed=false;
    const failedTiles=new Set();
    let cameraHeight=null,lastGroundCheck=0,ground=0,lastCamera=null,lastRender=0;
    const p=latest.current.plane;
    const map=new gl.Map({container:host.current,style:styleRef.current,center:[p.longitude,p.latitude],zoom:11,
      pitch:0,maxPitch:75,minZoom:2,maxZoom:18,centerClampedToGround:false,interactive:false,
      attributionControl:false,antialias:false,fadeDuration:0,renderWorldCopies:false,
      pixelRatio:atlasMapPixelRatio(window.devicePixelRatio)});
    mapRef.current=map;
    const recover=()=>{
      timer=null;if(disposed||document.hidden||navigator.onLine===false)return;
      failures++;failedTiles.clear();
      if(map.isStyleLoaded()) {map.refreshTiles('flight-terrain');map.refreshTiles('openfreemap');}
      else map.setStyle(styleRef.current,{diff:false});
    };
    const error=event=>{
      if(disposed)return;
      failed=true;
      if(failedTiles.size<256)failedTiles.add(`${event?.sourceId||'unknown'}:${event?.tile?.tileID?.key??'metadata'}`);
      setState(previous=>({...previous,message:'Terrain unavailable · retrying'}));
      if(!timer&&!document.hidden&&navigator.onLine!==false)timer=setTimeout(recover,Math.min(300000,15000*2**Math.min(failures,5)));
    };
    map.on('error',error);
    map.on('sourcedata',event=>{
      if(event.sourceId==='flight-terrain'&&event.tile?.dem)terrainReady=true;
      if(event.tile?.state==='loaded')failedTiles.delete(`${event.sourceId}:${event.tile.tileID.key}`);
      if(event.sourceDataType==='metadata')failedTiles.delete(`${event.sourceId}:metadata`);
    });
    map.on('idle',()=>{if(terrainReady&&!failedTiles.size){failed=false;failures=0;clearTimeout(timer);timer=null;}});
    map.on('style.load',()=>{terrainReady=false;cameraHeight=null;});
    map.on('render',()=>{
      if(!document.hidden){const canvas=map.getCanvas(),time=performance.now();latest.current.onFrame(time,lastRender?time-lastRender:1000/60,'WebGL2 · Air Atlas terrain',canvas.width,canvas.height);lastRender=time;}
    });
    const animate=time=>{
      if(disposed||document.hidden)return;
      const current=latest.current,reason=radarFlightAvailability(current.plane,time);
      const sample=current.readSample(time);
      if(terrainReady&&!reason&&sample&&map.isStyleLoaded()){
        if(time-lastGroundCheck>500){ground=map.queryTerrainElevation([sample.longitude,sample.latitude])??0;lastGroundCheck=time;}
        const height=radarCameraHeight(sample,ground);
        if(height&&Number.isFinite(sample.trackDegrees)){
          const dt=lastFrame?Math.min(0.1,(time-lastFrame)/1000):0;
          cameraHeight=cameraHeight===null?height.cameraM:cameraHeight+(height.cameraM-cameraHeight)*(1-Math.exp(-dt/0.45));
          // Ground changes may never put the camera below the exaggerated surface.
          cameraHeight=Math.max(ground+40,cameraHeight);
          const options=map.calculateCameraOptionsFromCameraLngLatAltRotation([sample.longitude,sample.latitude],cameraHeight,sample.trackDegrees,FLIGHT_CAMERA_PITCH,0);
          const identity=[sample.longitude.toFixed(8),sample.latitude.toFixed(8),sample.trackDegrees.toFixed(3),cameraHeight.toFixed(2)].join(':');
          if(identity!==lastCamera){map.jumpTo(options);lastCamera=identity;}rendered=true;
          if(time-lastUi>500){setState({ready:true,message:failed?'Terrain unavailable · retrying':sample.motion==='held'?'Position held · waiting for observation':'Measured flight · 5s delay',
            reference:height.reference,adjusted:height.adjusted});lastUi=time;}
        }
      }else if(time-lastUi>500){setState(previous=>({...previous,ready:rendered,message:reason||(failed?'Terrain unavailable · retrying':navigator.onLine===false?'Offline · terrain held':'Loading 3D terrain…')}));lastUi=time;}
      lastFrame=time;
      frame=requestAnimationFrame(animate);
    };
    const wake=()=>{
      cancelAnimationFrame(frame);clearTimeout(timer);timer=null;lastFrame=0;
      if(!document.hidden){map.resize();if(navigator.onLine!==false&&(failed||!terrainReady))recover();frame=requestAnimationFrame(animate);}
    };
    const resize=new ResizeObserver(()=>{lastCamera=null;map.resize();});resize.observe(host.current);
    document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);window.addEventListener('offline',wake);
    frame=requestAnimationFrame(animate);
    return()=>{disposed=true;cancelAnimationFrame(frame);clearTimeout(timer);resize.disconnect();
      document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('offline',wake);
      map.remove();mapRef.current=null;};
  },[gl,plane.id,retry,reducedMotion]);
  useEffect(()=>{mapRef.current?.setStyle(style);},[style]);
  useEffect(()=>{const close=event=>{if(event.key==='Escape'){event.preventDefault();onClose();}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[onClose]);
  return <>
    <div className={`flight-terrain${state.ready?' is-ready':''}`} ref={host} aria-label="Reconstructed aircraft terrain view" />
    <div className="flight-view-toolbar">
      <button onClick={onClose}>← RADAR</button>
      <button aria-label="Use natural terrain colors" aria-pressed={natural} onClick={()=>setNatural(v=>!v)}>{natural?'NATURAL':'PALETTE'}</button>
      {state.message.includes('unavailable')?<button onClick={()=>setRetry(v=>v+1)}>RETRY TERRAIN</button>:null}
    </div>
    <div className="flight-view-state" role="status"><strong>{state.message}</strong><span>Terrain ×1.25 · reconstructed view</span><span>{state.reference??'Altitude'} · approximate camera height{state.adjusted?' · clearance adjusted':''}</span></div>
  </>;
}
