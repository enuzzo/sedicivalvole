import { isAdmittedSoundtrackPolicy } from "./catalog-store.js";
import { sampleSoundtrackTransition } from "./transition-model.js";

export const SOUNDTRACK_ATTRIBUTION_SCHEMA = "sedicivalvole.soundtrack-attribution.v1";

const AUDIBLE_GAIN_EPSILON = 1e-6;
const PRIMARY_TIE_EPSILON = 1e-9;

const asText = (value) => typeof value === "string" ? value.trim() : "";

const httpsUrl = (value) => {
  try {
    const url = new URL(asText(value));
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

const roundedGain = (value) => Math.round(Math.max(0, value) * 10000) / 10000;

export function createSoundtrackCredit(entry) {
  const policy = entry?.policy;
  if (!entry?.key || !isAdmittedSoundtrackPolicy(policy)) return null;
  const shareUrl = httpsUrl(policy.item.shareUrl);
  const licenceUrl = httpsUrl(policy.licence.url);
  if (!shareUrl || !licenceUrl) return null;

  return Object.freeze({
    key: entry.key,
    source: asText(entry.source),
    itemId: asText(policy.item.id),
    title: asText(policy.item.title),
    artistName: asText(policy.item.artistName),
    albumName: asText(policy.item.albumName) || null,
    imageUrl: httpsUrl(policy.item.imageUrl),
    providerCredit: asText(policy.providerCredit),
    directContentUrl: shareUrl,
    qrDestination: shareUrl,
    licence: Object.freeze({
      label: asText(policy.licence.label),
      url: licenceUrl,
    }),
    obligations: Object.freeze([
      ...new Set((policy.obligations ?? []).map(asText).filter(Boolean)),
    ]),
    directBacklinkRequired: policy.directBacklinkRequired === true,
  });
}

const asEntryMap = (entries) => new Map(
  (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.key)
    .map((entry) => [entry.key, entry]),
);

const relation = ({ key, gain, targetKey, credit }) => Object.freeze({
  key,
  gain: roundedGain(gain),
  isTarget: key === targetKey,
  credit,
});

export function deriveSoundtrackAttribution({ transitionState, at, entries } = {}) {
  const sampled = sampleSoundtrackTransition(transitionState, at);
  if (sampled.status === "invalid") {
    return Object.freeze({
      schema: SOUNDTRACK_ATTRIBUTION_SCHEMA,
      status: "invalid-transition",
      playbackAllowed: false,
      creditDisplayRequired: false,
      transitioning: false,
      targetKey: null,
      primary: null,
      secondary: Object.freeze([]),
      audibleKeys: Object.freeze([]),
      missingCreditKeys: Object.freeze([]),
      providerCredits: Object.freeze([]),
      streamUrlsExposed: false,
      automaticModeFallback: false,
    });
  }

  const entryMap = asEntryMap(entries);
  const audible = Object.entries(sampled.gains)
    .filter(([, gain]) => gain > AUDIBLE_GAIN_EPSILON)
    .sort(([leftKey, leftGain], [rightKey, rightGain]) => {
      const difference = rightGain - leftGain;
      if (Math.abs(difference) > PRIMARY_TIE_EPSILON) return difference;
      if (leftKey === sampled.targetKey) return -1;
      if (rightKey === sampled.targetKey) return 1;
      return leftKey.localeCompare(rightKey);
    });

  const missingCreditKeys = [];
  const relations = [];
  for (const [key, gain] of audible) {
    const credit = createSoundtrackCredit(entryMap.get(key));
    if (!credit) {
      missingCreditKeys.push(key);
      continue;
    }
    relations.push(relation({ key, gain, targetKey: sampled.targetKey, credit }));
  }

  const incomplete = missingCreditKeys.length > 0;
  const providerCredits = [...new Set(
    relations.map((item) => item.credit.providerCredit).filter(Boolean),
  )];
  return Object.freeze({
    schema: SOUNDTRACK_ATTRIBUTION_SCHEMA,
    status: incomplete
      ? "incomplete-attribution"
      : audible.length > 1 ? "transitioning" : audible.length === 1 ? "audible" : "silent",
    playbackAllowed: audible.length > 0 && !incomplete,
    creditDisplayRequired: audible.length > 0,
    transitioning: audible.length > 1,
    targetKey: sampled.targetKey,
    primary: relations[0] ?? null,
    secondary: Object.freeze(relations.slice(1)),
    audibleKeys: Object.freeze(audible.map(([key]) => key)),
    missingCreditKeys: Object.freeze(missingCreditKeys),
    providerCredits: Object.freeze(providerCredits),
    streamUrlsExposed: false,
    automaticModeFallback: false,
  });
}
