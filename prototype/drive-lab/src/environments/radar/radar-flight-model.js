import {createAirAtlasStyle} from './radar-presentation.js';
/** Original camera model; displayed height is approximate, not terrain clearance. */
export const FLIGHT_TERRAIN_EXAGGERATION=1.25;
export const FLIGHT_CAMERA_PITCH=60;
export function radarFlightAvailability(plane,now) {
  if(!plane)return 'Select an aircraft';
  if(now-plane.observedAtMs>30000)return 'Waiting for a fresh position';
  if(plane.onGround)return 'Aircraft is on the ground';
  if(!Number.isFinite(plane.trackDegrees))return 'Waiting for ground track';
  if(!Number.isFinite(plane.geometricAltitudeFeet)&&!Number.isFinite(plane.altitudeFeet))return 'Waiting for altitude';
  return null;
}
export function radarCameraHeight(sample,exaggeratedTerrainM) {
  const geometric=Number.isFinite(sample?.geometricAltitudeFeet);
  const feet=geometric?sample.geometricAltitudeFeet:sample?.altitudeFeet;
  if(!Number.isFinite(feet)||!Number.isFinite(exaggeratedTerrainM))return null;
  const altitudeM=feet*0.3048,groundM=exaggeratedTerrainM/FLIGHT_TERRAIN_EXAGGERATION;
  // Preserve approximate clearance when exaggerating the ground; never claim
  // WGS84 ellipsoid / pressure altitude are a surveyed MSL terrain reference.
  const clearance=Math.max(90,altitudeM-groundM);
  return {cameraM:exaggeratedTerrainM+clearance,altitudeM,
    adjusted:altitudeM-groundM<90,reference:geometric?'GPS ellipsoid':'Pressure altitude'};
}

export function createFlightTerrainStyle(palette,natural=true){
  const style=createAirAtlasStyle(palette,natural?'natural':'palette',true);
  style.sources['flight-terrain']={type:'raster-dem',tiles:['https://tiles.mapterhorn.com/{z}/{x}/{y}.webp'],
    tileSize:512,encoding:'terrarium',maxzoom:12,attribution:'© Mapterhorn — https://mapterhorn.com/attribution/'};
  style.terrain={source:'flight-terrain',exaggeration:FLIGHT_TERRAIN_EXAGGERATION};
  const index=style.layers.findIndex(layer=>layer.id==='atlas-water');
  style.layers.splice(index,0,{id:'flight-relief',type:'hillshade',source:'flight-terrain',paint:{
    'hillshade-exaggeration':0.35,'hillshade-shadow-color':natural?'#38433d':'#020505',
    'hillshade-highlight-color':natural?'#eff3df':'#b7c9c2','hillshade-accent-color':'#596b5c'}});
  return style;
}

