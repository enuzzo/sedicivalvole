const text=(value,max=120)=>typeof value==='string'?value.replace(/[\x00-\x1f]/g,'').trim().slice(0,max):'';
function allowedUrl(value,host,path){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname===host&&!u.username&&!u.password&&u.pathname.startsWith(path)?u.href:null;}catch{return null;}}
export function radarPhotoUrl(aircraft){
  if(!/^[0-9a-f]{6}$/.test(aircraft?.id))return null;
  const params=new URLSearchParams();if(aircraft.registration)params.set('reg',aircraft.registration);if(aircraft.typeCode)params.set('type',aircraft.typeCode);
  return `/api/radar-photo.php?hex=${aircraft.id}&${params}`;
}
export function normalizeRadarPhoto(payload){
  for(const photo of (Array.isArray(payload?.photos)?payload.photos:[]).slice(0,5)){
    const src=allowedUrl(photo.thumbnail?.src,'t.plnspttrs.net','/');
    const link=allowedUrl(photo.link,'www.planespotters.net','/photo/');const photographer=text(photo.photographer);
    if(src&&link&&photographer)return {src,link,photographer};
  }return null;
}
export function radarRouteUrl(aircraft){
  if(!/^[A-Z0-9]{2,12}$/.test(aircraft?.callsign)||!Number.isFinite(aircraft.latitude)||!Number.isFinite(aircraft.longitude))return null;
  return `/api/radar-data.php?kind=route&callsign=${aircraft.callsign}&lat=${aircraft.latitude.toFixed(3)}&lon=${aircraft.longitude.toFixed(3)}`;
}
export function normalizeRadarRoute(payload,callsign){
  if(payload?.callsign!==callsign||payload.plausible!==true||!Array.isArray(payload._airports))return null;
  const airports=payload._airports.slice(0,8).map(p=>({code:text(p.iata||p.icao,4),name:text(p.name),city:text(p.location),latitude:p.lat,longitude:p.lon}))
    .filter(p=>/^[A-Z0-9]{3,4}$/.test(p.code)&&Number.isFinite(p.latitude)&&Math.abs(p.latitude)<=90&&Number.isFinite(p.longitude)&&Math.abs(p.longitude)<=180);
  if(airports.length<2)return null;
  return {origin:airports[0],destination:airports.at(-1),via:airports.slice(1,-1),source:'ADSB.lol',confidence:'Plausible route',departure:null,arrival:null};
}

/** Catalogue geometry is selected only from reported ICAO type; no model inferred from callsign. */
export function radarShapeCode(aircraft,codes){
  if(codes.has(aircraft.typeCode))return aircraft.typeCode;
  return null;
}

export function normalizeRadarSchedule(payload,hex){
  const value=payload?.schedule;
  if(value?.hex!==hex||value.source!=='AirLabs'||!['departureAirport','arrivalAirport'].every(key=>/^[A-Z0-9]{3,4}$/.test(value[key])))return null;
  const result={source:'AirLabs',hex,departureAirport:value.departureAirport,arrivalAirport:value.arrivalAirport};
  for(const key of ['departure','arrival']){
    const time=value[key];result[key]=time&&/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(time.time)&&['scheduled','estimated'].includes(time.kind)&&time.zone==='airport local'?{time:time.time,kind:time.kind,zone:time.zone}:null;
  }return result;
}
