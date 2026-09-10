/** Measured, bounded track playback. No dead reckoning after the latest fix. */
import {discoverDistanceMetres} from '../../discover/discover-model.js';
export const RADAR_PLAYBACK_DELAY_MS = 5000;
const wrap = angle => ((angle % 360) + 360) % 360;
const delta = (a,b) => ((b-a+540)%360)-180;
export function appendRadarObservation(history, plane) {
  const last=history.at(-1);
  // Replayed envelopes and rounded seen_pos must not advance an old position.
  if(last && (plane.observedAtMs<=last.observedAtMs+100
    || (plane.latitude===last.latitude && plane.longitude===last.longitude))) return history;
  const next={latitude:plane.latitude,longitude:plane.longitude,observedAtMs:plane.observedAtMs,
    trackDegrees:plane.trackDegrees,altitudeFeet:plane.altitudeFeet,geometricAltitudeFeet:plane.geometricAltitudeFeet};
  const gap=last?next.observedAtMs-last.observedAtMs:0;
  // Never draw a long lost-signal bridge or an implausible receiver jump.
  if(last && (gap>15000 || discoverDistanceMetres(last,next)/(gap/1000)>650)) return [next];
  return [...history,next].filter(point=>next.observedAtMs-point.observedAtMs<=300000).slice(-256);
}
export function sampleRadarTrack(history, now, reducedMotion=false) {
  if(!history.length)return null;
  const time=now-(reducedMotion?0:RADAR_PLAYBACK_DELAY_MS),last=history.at(-1);
  if(time>=last.observedAtMs)return {...last,motion:'held'};
  if(time<=history[0].observedAtMs)return {...history[0],motion:'buffering'};
  let low=1,high=history.length-1;
  while(low<high){const middle=(low+high)>>1;if(history[middle].observedAtMs<time)low=middle+1;else high=middle;}
  const right=low,a=history[right-1],b=history[right];
  const t=(time-a.observedAtMs)/(b.observedAtMs-a.observedAtMs);
  const bearing=wrap(Math.atan2(delta(a.longitude,b.longitude)*Math.cos(a.latitude*Math.PI/180),b.latitude-a.latitude)*180/Math.PI);
  const start=Number.isFinite(a.trackDegrees)?a.trackDegrees:bearing;
  const end=Number.isFinite(b.trackDegrees)?b.trackDegrees:bearing;
  const altitude=key=>Number.isFinite(a[key])&&Number.isFinite(b[key])?a[key]+(b[key]-a[key])*t:null;
  return {longitude:((a.longitude+delta(a.longitude,b.longitude)*t+540)%360)-180,
    latitude:a.latitude+(b.latitude-a.latitude)*t,trackDegrees:wrap(start+delta(start,end)*t),
    altitudeFeet:altitude('altitudeFeet'),geometricAltitudeFeet:altitude('geometricAltitudeFeet'),
    observedAtMs:time,motion:'interpolated'};
}

/** Up to 5 km of received flight, ending at the delayed display position. */
export function radarTrailCoordinates(history, now, reducedMotion=false) {
  const sample=sampleRadarTrack(history,now,reducedMotion);
  if(!sample)return [];
  const points=history.filter(p=>p.observedAtMs<sample.observedAtMs&&now-p.observedAtMs<=300000);
  points.push(sample);
  const result=[points.at(-1)];let distance=0;
  for(let index=points.length-2;index>=0;index--){
    const point=points[index],last=result[0];
    // Avoid a world-spanning line at the date line.
    if(Math.abs(point.longitude-last.longitude)>180)break;
    const segment=discoverDistanceMetres(point,last);
    if(distance+segment>5000){
      const fraction=(5000-distance)/segment;
      result.unshift({latitude:last.latitude+(point.latitude-last.latitude)*fraction,
        longitude:last.longitude+(point.longitude-last.longitude)*fraction});break;
    }
    distance+=segment;result.unshift(point);
  }
  return result.length>1?result.map(p=>[p.longitude,p.latitude]):[];
}
