import {validAtlasPosition} from '../atlas/atlas-model.js';

/** A first display fix is independent of motion and journey accuracy gates. */
export function radarDisplayFix(coords, capturedAtMs) {
  if (!validAtlasPosition(coords)) return null;
  return {latitude:coords.latitude,longitude:coords.longitude,capturedAtMs,
    accuracyM:Number.isFinite(coords.accuracy)&&coords.accuracy>=0?coords.accuracy:null,
    heading:null,speedKmh:null};
}

export function radarLocationPresentation(position, gpsState, permission, now) {
  if (validAtlasPosition(position)) {
    if(permission==='denied'||gpsState==='permission denied')return {message:'Last known location · Location permission denied'};
    const age=now-position.capturedAtMs;
    if (age>30000) return {message:'Last known location · waiting for GPS update'};
    if (!Number.isFinite(position.accuracyM)||position.accuracyM>250)
      return {message:`Approximate location${Number.isFinite(position.accuracyM)?` · ±${Math.round(position.accuracyM).toLocaleString('en')} m`:''} · refining GPS`};
    return {message:''};
  }
  if (permission==='denied'||gpsState==='permission denied')
    return {message:'Location permission denied · allow Location in browser settings',action:'RETRY GPS'};
  if (gpsState==='unavailable') return {message:'Location is unavailable in this browser',action:'RETRY GPS'};
  if (permission==='granted'||gpsState==='live'||gpsState?.startsWith('GPS active'))
    return {message:'Location allowed · waiting for the first position. Reception may improve after moving a few metres.',action:'RETRY GPS'};
  if (gpsState==='permission requested') return {message:'Requesting location · waiting for browser response'};
  if (['timeout','signal unavailable'].includes(gpsState))
    return {message:'Waiting for a location signal · check browser Location permission',action:'RETRY GPS'};
  return {message:'Allow Location to find nearby aircraft',action:'ENABLE GPS'};
}
