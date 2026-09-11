import {paletteToAtlasCss,createAtlasStyle} from '../atlas/atlas-model.js';

/** Preserve Atlas cartography while reducing labels for aircraft identification. */
export function createAirAtlasStyle(palette, appearance = 'palette', labels = false) {
  const style = createAtlasStyle(palette, appearance === 'natural' ? 'standard' : 'palette');
  const get = id => style.layers.find(layer => layer.id === id);
  // Lift the actual cartography independently of the dark instrument panels.
  const mix = (a,b,t) => `rgb(${a.map((v,i)=>Math.round((v*(1-t)+b[i]*t)*255)).join(',')})`;
  if (appearance !== 'natural') {
    get('atlas-background').paint['background-color'] = mix(palette.base,[0.75,0.79,0.8],0.28);
    get('atlas-landcover').paint = {'fill-color':mix(palette.secondary,[0.65,0.76,0.65],0.5),'fill-opacity':0.34};
    get('atlas-landuse').paint = {'fill-color':mix(palette.secondary,[0.8,0.8,0.71],0.5),'fill-opacity':0.3};
    get('atlas-water').paint = {'fill-color':mix(palette.secondary,[0.55,0.77,0.91],0.68),'fill-opacity':0.85};
  }
  const boundaryInk = appearance === 'natural' ? '#65756e' : '#e2e8dc';
  style.layers.splice(style.layers.findIndex(layer=>layer.id==='atlas-roads-underlay'),0,
    {id:'radar-country-borders',type:'line',source:'openfreemap','source-layer':'boundary',
      filter:['all',['==',['get','admin_level'],2],['!=',['get','maritime'],1],['!=',['get','disputed'],1]],
      paint:{'line-color':boundaryInk,'line-width':1.5,'line-opacity':0.7}},
    {id:'radar-regional-borders',type:'line',source:'openfreemap','source-layer':'boundary',minzoom:5,
      filter:['all',['<=',['get','admin_level'],6],['any',['>',['get','admin_level'],2],['==',['get','disputed'],1]],['!=',['get','maritime'],1]],
      paint:{'line-color':boundaryInk,'line-width':1,'line-opacity':0.55,'line-dasharray':[4,3]}});
  const layer = style.layers.find(layer => layer.id === 'atlas-place-labels');
  layer.layout.visibility = labels ? 'visible' : 'none';
  layer.layout['text-padding'] = 18;
  layer.filter = ['step', ['zoom'], ['in', ['get', 'class'], ['literal', ['city']]], 10,
    ['in', ['get', 'class'], ['literal', ['city', 'town']]], 12,
    ['in', ['get', 'class'], ['literal', ['city', 'town', 'village']]]];
  for(const road of style.layers.filter(layer=>layer['source-layer']==='transportation')) {
    road.filter=['in',['get','class'],['literal',['motorway','trunk','primary']]];
  }
  // River polygons do not expose reliable width. Retain them only at close zoom;
  // lakes and oceans remain visible throughout the radar overview.
  style.layers.find(layer=>layer.id==='atlas-water').filter=['any',
    ['!=',['get','class'],'river'],['>=',['zoom'],12]];
  const water=style.layers.find(layer=>layer.id==='atlas-water').paint['fill-color'];
  const ink=style.layers.find(layer=>layer.id==='atlas-place-labels').paint;
  style.layers.push(
    {id:'radar-airport-ground',type:'fill',source:'openfreemap','source-layer':'aeroway',
      filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':water,'fill-opacity':0.65}},
    {id:'radar-runways',type:'line',source:'openfreemap','source-layer':'aeroway',
      filter:['==',['get','class'],'runway'],paint:{'line-color':ink['text-color'],'line-width':2,'line-opacity':0.75}},
    {id:'radar-airports',type:'symbol',source:'openfreemap','source-layer':'aerodrome_label',
      layout:{'text-field':['coalesce',['get','iata'],['get','icao'],['get','name:latin'],['get','name']],
        'text-font':['Noto Sans Regular'],'text-size':13,'text-padding':8},
      paint:{'text-color':ink['text-color'],'text-halo-color':ink['text-halo-color'],'text-halo-width':1.5}}
  );
  style.sources['radar-trails']={type:'geojson',data:{type:'FeatureCollection',features:[]}};
  style.layers.push({id:'radar-trails',type:'line',source:'radar-trails',
    paint:{'line-color':paletteToAtlasCss(palette).accent,'line-width':1.5,
      'line-opacity':0.32,'line-dasharray':[2,3]}});
  style.sources['radar-home-trail']={type:'geojson',data:{type:'FeatureCollection',features:[]}};
  for (const [id,color,width] of [['casing','#142f41',4],['line','#ffffff',2]]) {
    style.layers.push({id:`radar-home-trail-${id}`,type:'line',source:'radar-home-trail',
      paint:{'line-color':color,'line-width':width,'line-opacity':0.85,'line-dasharray':[2,3]}});
  }
  return style;
}

const value = (number, unit, digits = 0) => Number.isFinite(number)
  ? `${number.toLocaleString('en', {maximumFractionDigits: digits})} ${unit}` : 'Not available';
/** Labels retain the upstream measurement reference; no inferred flight plan. */
export function radarTelemetryRows(plane) {
  return [
    ['Pressure altitude', value(plane.altitudeFeet, 'ft')],
    ['Geometric altitude · WGS84', value(plane.geometricAltitudeFeet, 'ft')],
    ['Ground speed', value(plane.groundSpeedKnots, 'kt')],
    ['Indicated airspeed', value(plane.indicatedSpeedKnots, 'kt')],
    ['True airspeed', value(plane.trueSpeedKnots, 'kt')],
    ['Mach', value(plane.mach, '', 3).trim()],
    ['Ground track · true', value(plane.trackDegrees, '°', 1)],
    ['Heading · magnetic', value(plane.magneticHeadingDegrees, '°', 1)],
    ['Heading · true / provider derived', value(plane.trueHeadingDegrees, '°', 1)],
    ['Climb / descent · barometric', value(plane.verticalRate, 'ft/min')],
    ['Climb / descent · geometric', value(plane.geometricRate, 'ft/min')],
    ['Bank angle · negative left', value(plane.rollDegrees, '°', 1)],
    ['Selected altitude · MCP/FCU', value(plane.selectedAltitudeFeet, 'ft')],
    ['Altimeter setting', value(plane.altimeterHpa, 'hPa', 1)],
    ['Wind direction · calculated', value(plane.windDirectionDegrees, '°')],
    ['Wind speed · calculated', value(plane.windSpeedKnots, 'kt')],
    ['Outside temperature · calculated', value(plane.outsideTemperatureC, '°C')],
    ['Transponder squawk', plane.squawk ?? 'Not available'],
    ['Position source', ({adsb_icao:'ADS-B',adsb_icao_nt:'ADS-B non-transponder',adsr_icao:'ADS-R',tisb_icao:'TIS-B',adsc:'ADS-C',mlat:'MLAT · multilateration',other:'Other / unspecified',mode_s:'Mode S'})[plane.positionSource] ?? 'Not available'],
  ];
}
