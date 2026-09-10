import {discoverDistanceMetres} from '../../discover/discover-model.js';
import {radarPointUrl} from './radar-model.js';
const wrap=longitude=>((longitude+540)%360)-180;
export function radarViewportQuery(center,corners){
  const point={latitude:center.lat??center.latitude,longitude:wrap(center.lng??center.longitude)};
  const requiredNm=(Math.max(...corners.map(p=>discoverDistanceMetres(point,{latitude:p.lat??p.latitude,longitude:wrap(p.lng??p.longitude)})))+2000)/1852;
  const radiusNm=Math.min(250,Math.max(5,Math.ceil(requiredNm/5)*5));
  return {...point,radiusNm,requiredNm,key:radarPointUrl(point,radiusNm)};
}
export function radarMinimumZoom(latitude,width,height){
  return Math.max(5,Math.log2(156543.03392*Math.cos(Math.min(85,Math.abs(latitude))*Math.PI/180)*Math.hypot(width,height)/2/(225*1852)));
}
