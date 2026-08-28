// Archived with the rejected Register visual. This module is not active code.
import { ROAD_SPEED_CEILING_KMH } from "../../../../prototype/drive-lab/src/signal-model.js";

export const REGISTER_STEPS_PER_BOUNDARY = 16 * 8;

export function registerBoundaryKey(snapshot) {
  if (!snapshot) return "silent:0";
  const scoreId = snapshot.scoreId ?? snapshot.score ?? "unknown";
  if (scoreId === "junction") {
    return `junction:${Math.max(0, Math.floor(Number(snapshot.boundaryRevision) || 0))}`;
  }
  const step = Math.max(0, Math.floor(Number(snapshot.step) || 0));
  return `${scoreId}:${Math.floor(step / REGISTER_STEPS_PER_BOUNDARY)}`;
}

export function speedToRegisterFamily(speedKmh) {
  const energy = Math.min(1, Math.max(0, (Number(speedKmh) || 0) / ROAD_SPEED_CEILING_KMH));
  if (energy < 0.28) return 0;
  if (energy < 0.68) return 1;
  return 2;
}

export function accelerationToMisregistration(accelerationMps2, motionPhase = "cruise") {
  if (motionPhase === "release" || motionPhase === "brake") return 0;
  const acceleration = Math.max(0, Number(accelerationMps2) || 0);
  if (acceleration < 1.1) return 0;
  if (acceleration < 2.2) return 1;
  if (acceleration < 4.2) return 2;
  return 3;
}

export function physicalMisregistrationCssPx(level, devicePixelRatio = 1) {
  const boundedLevel = Math.min(3, Math.max(0, Math.floor(Number(level) || 0)));
  if (boundedLevel === 0) return 0;
  const ratio = Math.max(1, Number(devicePixelRatio) || 1);
  return (boundedLevel * 2) / ratio;
}
