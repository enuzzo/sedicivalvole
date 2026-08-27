import {
  chooseJunctionVariation,
  junctionSectionForEnergy,
  parseJunctionBank,
} from "./junction-bank.js";

const BANK_URL = `/audio/junction.svb?build=${encodeURIComponent(__APP_BUILD__)}`;
const REVIEW_INTERVAL_MS = 100;

export function createJunctionPlayer(context, destination, onSnapshot) {
  let active = false;
  let energy = 0;
  let brake = 0;
  let media = null;
  let objectUrl = null;
  let manifest = null;
  let source = null;
  let filter = null;
  let gain = null;
  let loading = null;
  let currentSection = null;
  let bankBytes = 0;

  function snapshot() {
    const sectionId = currentSection?.id ?? junctionSectionForEnergy(energy, brake > 0.2);
    const sceneIndex = currentSection && manifest
      ? manifest.sections.indexOf(currentSection)
      : -1;
    return {
      scoreId: "junction",
      scoreLabel: "JUNCTION",
      scene: Math.max(0, sceneIndex),
      sceneId: sectionId,
      section: sectionId.toUpperCase(),
      sectionTake: currentSection?.take ?? null,
      halfTime: false,
      tempo: manifest?.bpm ?? 168,
      energy,
      decelerationState: brake > 0.2 ? "release" : "cruise",
      activeLanes: sectionId === "rest" ? ["bass", "harmony"] : ["breaks", "bass", "harmony"],
      source: "sampled-production",
      bankLoaded: Boolean(manifest),
      bankBytes,
      playing: Boolean(media && !media.paused),
    };
  }

  async function load() {
    if (manifest) return;
    if (loading) return loading;
    loading = (async () => {
      const response = await fetch(BANK_URL, { cache: "force-cache" });
      if (!response.ok) throw new Error(`JUNCTION bank request failed (${response.status})`);
      const parsed = parseJunctionBank(await response.arrayBuffer());
      manifest = parsed.manifest;
      bankBytes = parsed.audioBytes;
      objectUrl = URL.createObjectURL(parsed.audio);
      media = new Audio(objectUrl);
      media.preload = "auto";
      media.playsInline = true;
      source = context.createMediaElementSource(media);
      filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 18000;
      filter.Q.value = 0.65;
      gain = context.createGain();
      gain.gain.value = 0.92;
      source.connect(filter).connect(gain).connect(destination);
      const target = chooseJunctionVariation(
        manifest.sections,
        junctionSectionForEnergy(energy, brake > 0.2),
      );
      currentSection = target;
      media.currentTime = target.startSeconds;
      if (active) await media.play();
    })().catch((error) => {
      console.error("[junction] the rendered music bank did not load", error);
      throw error;
    });
    return loading;
  }

  function moveAtBoundary() {
    if (!active || !media || !manifest || media.readyState < 2) return;
    if (!currentSection) currentSection = manifest.sections[0];
    const end = currentSection.startSeconds + currentSection.durationSeconds;
    if (media.currentTime < end - 0.08 && !media.ended) return;
    const id = junctionSectionForEnergy(energy, brake > 0.2);
    currentSection = chooseJunctionVariation(
      manifest.sections,
      id,
      currentSection.take,
    );
    media.currentTime = currentSection.startSeconds + 0.015;
    media.play().catch(() => {});
  }

  const timer = window.setInterval(() => {
    moveAtBoundary();
    if (active) onSnapshot?.(snapshot());
  }, REVIEW_INTERVAL_MS);

  return {
    async setActive(nextActive) {
      active = nextActive;
      if (!active) {
        media?.pause();
        return;
      }
      await load();
      await media?.play();
    },
    setEnergy(nextEnergy) {
      energy = Math.min(1, Math.max(0, Number(nextEnergy) || 0));
    },
    setBrake(nextBrake) {
      brake = Math.min(1, Math.max(0, Number(nextBrake) || 0));
      if (filter) {
        const frequency = 18000 + (430 - 18000) * brake;
        filter.frequency.setTargetAtTime(frequency, context.currentTime, brake > 0.2 ? 0.08 : 0.22);
      }
    },
    getState: snapshot,
    destroy() {
      window.clearInterval(timer);
      media?.pause();
      source?.disconnect();
      filter?.disconnect();
      gain?.disconnect();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
  };
}
