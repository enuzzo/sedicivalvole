import {createAtlasStyle} from '../atlas/atlas-model.js';

/** Preserve Atlas cartography while reducing labels for aircraft identification. */
export function createAirAtlasStyle(palette, appearance = 'palette', labels = false) {
  const style = createAtlasStyle(palette, appearance === 'natural' ? 'standard' : 'palette');
  const layer = style.layers.find(layer => layer.id === 'atlas-place-labels');
  layer.layout.visibility = labels ? 'visible' : 'none';
  layer.layout['text-padding'] = 18;
  layer.filter = ['step', ['zoom'], ['in', ['get', 'class'], ['literal', ['city']]], 10,
    ['in', ['get', 'class'], ['literal', ['city', 'town']]], 12,
    ['in', ['get', 'class'], ['literal', ['city', 'town', 'village']]]];
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
