import {useEffect,useMemo,useRef,useState} from 'react';
import {atlasMapPixelRatio} from '../atlas/atlas-model.js';
import {radarFlightAvailability,radarCameraHeight,FLIGHT_CAMERA_PITCH,radarFlightFov,createFlightTerrainStyle} from './radar-flight-model.js';

/** A reconstructed nose camera; the existing radar remains visible as its inset. */
export default function RadarFlightView({gl,plane,readSample,palette,reducedMotion,onClose,onFrame}){
  const host=useRef(null),mapRef=useRef(null),latest=useRef({plane,readSample,onFrame});
  latest.current={plane,readSample,onFrame};
  const [natural,setNatural]=useState(true),[state,setState]=useState({message:'Loading 3D terrain…',ready:false});
  const [zoom,setZoom]=useState(0);
  const zoomRef=useRef(zoom);zoomRef.current=zoom;
  const [retry,setRetry]=useState(0);
  const style=useMemo(()=>createFlightTerrainStyle(palette,natural),[palette,natural]);
  const styleRef=useRef(style);styleRef.current=style;
  useEffect(()=>{
    if(!gl||!host.current)return;
    let disposed=false,frame,timer,failures=0,terrainReady=false,styleReady=false,lastUi=0,lastFrame=0,rendered=false,failed=false;
    const failedTiles=new Set();
    let cameraHeight=null,lastGroundCheck=Number.NEGATIVE_INFINITY,ground=0,lastCamera=null,lastRender=0;
    let cameraFov=radarFlightFov(zoomRef.current),lastSample=null;
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
      const tileKey=event.tile?.tileID?.key;
      if(event.tile?.state==='loaded'&&tileKey!=null)failedTiles.delete(`${event.sourceId}:${tileKey}`);
      if(event.sourceDataType==='metadata')failedTiles.delete(`${event.sourceId}:metadata`);
    });
    map.on('idle',()=>{if(terrainReady&&!failedTiles.size){failed=false;failures=0;clearTimeout(timer);timer=null;}});
    map.on('style.load',()=>{styleReady=true;});
    map.on('render',()=>{
      if(!document.hidden){const canvas=map.getCanvas(),time=performance.now();latest.current.onFrame(time,lastRender?time-lastRender:1000/60,'WebGL2 · Air Atlas terrain',canvas.width,canvas.height);lastRender=time;}
    });
    const animate=time=>{
      if(disposed||document.hidden)return;
      const current=latest.current,reason=radarFlightAvailability(current.plane,time);
      const receivedSample=current.readSample(time);
      if(!reason&&receivedSample)lastSample=receivedSample;
      const sample=reason?lastSample:receivedSample;
      if(styleReady&&terrainReady&&sample){
        if(time-lastGroundCheck>500){
          const elevation=map.queryTerrainElevation([sample.longitude,sample.latitude]);
          if(Number.isFinite(elevation))ground=elevation;
          lastGroundCheck=time;
        }
        const height=radarCameraHeight(sample,ground);
        if(height&&Number.isFinite(sample.trackDegrees)){
          const dt=lastFrame?Math.min(0.1,(time-lastFrame)/1000):0;
          const targetFov=radarFlightFov(zoomRef.current);
          cameraFov=reducedMotion?targetFov:cameraFov+(targetFov-cameraFov)*(1-Math.exp(-dt/0.18));
          if(Math.abs(cameraFov-targetFov)<0.001)cameraFov=targetFov;
          if(Math.abs(map.getVerticalFieldOfView()-cameraFov)>0.0001)map.setVerticalFieldOfView(cameraFov);
          cameraHeight=cameraHeight===null?height.cameraM:cameraHeight+(height.cameraM-cameraHeight)*(1-Math.exp(-dt/0.45));
          // Ground changes may never put the camera below the exaggerated surface.
          cameraHeight=Math.max(ground+40,cameraHeight);
          const options=map.calculateCameraOptionsFromCameraLngLatAltRotation([sample.longitude,sample.latitude],cameraHeight,sample.trackDegrees,FLIGHT_CAMERA_PITCH,0);
          const identity=[sample.longitude.toFixed(8),sample.latitude.toFixed(8),sample.trackDegrees.toFixed(3),cameraHeight.toFixed(2),cameraFov.toFixed(4)].join(':');
          if(identity!==lastCamera){map.jumpTo(options);lastCamera=identity;}rendered=true;
          if(time-lastUi>500){setState({ready:true,message:reason||(failed?'Terrain unavailable · retrying':sample.motion==='held'?'Position held · waiting for observation':sample.motion==='buffering'?'Buffering measured flight · 5s delay':'Live tracking · 5s delay'),
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
      <div className="flight-zoom-controls" aria-label="Flight camera zoom">
        <button aria-label="Zoom in flight view" disabled={zoom>=1} onClick={()=>setZoom(value=>Math.min(1,value+0.5))}>+</button>
        <button aria-label="Reset flight view" onClick={()=>setZoom(0)}>RESET</button>
        <button aria-label="Zoom out flight view" disabled={zoom<=-1} onClick={()=>setZoom(value=>Math.max(-1,value-0.5))}>−</button>
      </div>
      {state.message.includes('unavailable')?<button onClick={()=>setRetry(v=>v+1)}>RETRY TERRAIN</button>:null}
    </div>
    <div className="flight-view-state" role="status"><strong>{state.message}</strong><span>Terrain ×1.25 · reconstructed view</span><span>{state.reference??'Altitude'} · approximate camera height{state.adjusted?' · clearance adjusted':''}</span></div>
  </>;
}
