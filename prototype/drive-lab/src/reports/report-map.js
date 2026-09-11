import {createAtlasStyle} from '../environments/atlas/atlas-model.js';

export function reportRouteCoordinates(route) {
  let previous;
  return route.map(point => {
    let lon=point.longitude;
    if(previous!==undefined){while(lon-previous>180)lon-=360;while(lon-previous< -180)lon+=360;}
    previous=lon;
    return [lon,Math.max(-85,Math.min(85,point.latitude))];
  });
}

/** One on-demand print map, disposed on success, timeout, cancellation or context failure. */
export async function captureReportMap(route, signal) {
  if(route.length<2 || navigator.onLine===false || signal.aborted) return null;
  let importTimer,abortImport;
  const started=performance.now();
  let gl;
  try {
    ({default:gl}=await Promise.race([import('maplibre-gl'),new Promise((_,reject)=>{
      abortImport=()=>reject(new Error('Map capture cancelled'));
      signal.addEventListener('abort',abortImport,{once:true});
      importTimer=setTimeout(abortImport,12000);
    })]));
  } catch {return null;} finally {clearTimeout(importTimer);signal.removeEventListener('abort',abortImport);}
  if(signal.aborted) return null;
  const coordinates=reportRouteCoordinates(route);
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-1200px;top:0;width:1000px;height:900px;pointer-events:none;';
  host.setAttribute('aria-hidden','true');document.body.append(host);
  let map;
  try {
    return await new Promise(resolve=>{
      let finished=false,deadline;
      const finish=value=>{if(finished)return;finished=true;clearTimeout(deadline);signal.removeEventListener('abort',abort);resolve(value);};
      const abort=()=>finish(null);
      signal.addEventListener('abort',abort,{once:true});deadline=setTimeout(abort,Math.max(0,12000-(performance.now()-started)));
      try {
        const palette={base:[0,0,0],mid:[.2,.2,.2],light:[1,1,1],accent:[.87,.18,.12],secondary:[.2,.5,.7]};
        const style=createAtlasStyle(palette,'standard');
        style.layers=style.layers.filter(l=>l.type!=='fill-extrusion'&&!l.id.startsWith('atlas-travel')&&!l.id.startsWith('atlas-vehicle'));
        style.sources.printRoute={type:'geojson',data:{type:'Feature',properties:{},geometry:{type:'LineString',coordinates}}};
        for(const [id,color,width] of [['halo','#ffffff',9],['line','#d63729',5]])style.layers.push({id:`print-route-${id}`,type:'line',source:'printRoute',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':color,'line-width':width}});
        style.sources.printEnds={type:'geojson',data:{type:'FeatureCollection',features:[coordinates[0],coordinates.at(-1)].map((p,i)=>({type:'Feature',properties:{label:i?'FINISH':'START'},geometry:{type:'Point',coordinates:p}}))}};
        style.layers.push({id:'print-ends',type:'circle',source:'printEnds',paint:{'circle-radius':7,'circle-color':'#172c33','circle-stroke-color':'#fff','circle-stroke-width':3}},
          {id:'print-end-labels',type:'symbol',source:'printEnds',layout:{'text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':15,'text-offset':[0,1.4]},paint:{'text-color':'#172c33','text-halo-color':'#fff','text-halo-width':2}});
        map=new gl.Map({container:host,style,interactive:false,attributionControl:false,preserveDrawingBuffer:true,pixelRatio:1,fadeDuration:0,renderWorldCopies:false});
        const bounds=coordinates.reduce((b,p)=>b.extend(p),new gl.LngLatBounds(coordinates[0],coordinates[0]));
        map.fitBounds(bounds,{padding:85,maxZoom:15,duration:0});
        map.on('idle',()=>{if(map.isStyleLoaded()&&map.areTilesLoaded()){
          try {const image=map.getCanvas().toDataURL('image/jpeg',.85);finish(image.length<=800000?image:null);}catch{finish(null);}
        }});
        map.on('error',()=>finish(null));
        map.getCanvas().addEventListener('webglcontextlost',abort,{once:true});
      }catch{finish(null);}
    });
  } finally {map?.remove();host.remove();}
}
