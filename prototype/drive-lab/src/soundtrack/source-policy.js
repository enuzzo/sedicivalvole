const DECISIONS = new Set(["allow", "deny", "unknown"]);

export const SOURCE_CAPABILITY = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  UNKNOWN: "unknown",
});

const UNKNOWN_CAPABILITIES = Object.freeze({
  inAppSelection: SOURCE_CAPABILITY.UNKNOWN,
  sourceStreaming: SOURCE_CAPABILITY.UNKNOWN,
  audioEffects: SOURCE_CAPABILITY.UNKNOWN,
  hostedCopy: SOURCE_CAPABILITY.UNKNOWN,
});

const CREATIVE_COMMONS_CODES = new Set([
  "by",
  "by-sa",
  "by-nd",
  "by-nc",
  "by-nc-sa",
  "by-nc-nd",
]);

const JAMENDO_DISCOVERY_PACES = new Set(["verylow", "low", "medium", "high", "veryhigh"]);

const asText = (value) => typeof value === "string" ? value.trim() : "";

const normalizedTags = (values) => Object.freeze([
  ...new Set((Array.isArray(values) ? values : [])
    .map((value) => asText(value).toLowerCase())
    .filter(Boolean)),
].slice(0, 24));

const safeHttpsUrl = (value, allowedHost) => {
  try {
    const url = new URL(asText(value));
    if (url.protocol !== "https:" || !allowedHost(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
};

const creativeCommonsUrl = (value) => {
  try {
    const url = new URL(asText(value));
    const hostname = url.hostname.toLowerCase();
    if (!["http:", "https:"].includes(url.protocol)
      || !["creativecommons.org", "www.creativecommons.org"].includes(hostname)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
};

const jamendoHost = (hostname) => hostname === "jamendo.com"
  || hostname.endsWith(".jamendo.com")
  || hostname === "jamen.do";

const copyCapabilities = (capabilities = UNKNOWN_CAPABILITIES) => Object.freeze({
  inAppSelection: capabilities.inAppSelection,
  sourceStreaming: capabilities.sourceStreaming,
  audioEffects: capabilities.audioEffects,
  hostedCopy: capabilities.hostedCopy,
});

const unknownPolicy = (reason) => Object.freeze({
  admitted: false,
  licence: null,
  capabilities: copyCapabilities(),
  obligations: Object.freeze([]),
  reasons: Object.freeze([reason]),
});

export function creativeCommonsPolicy(licenceUrl) {
  const url = creativeCommonsUrl(licenceUrl);
  if (!url) return unknownPolicy("unknown-licence");

  const match = url.pathname.match(/^\/licenses\/([a-z-]+)\/(\d+(?:\.\d+)?)\/?$/i);
  const code = match?.[1]?.toLowerCase();
  const version = match?.[2];
  if (!CREATIVE_COMMONS_CODES.has(code) || !version) {
    return unknownPolicy("unknown-licence");
  }

  const noDerivatives = code.endsWith("-nd");
  const shareAlike = code.endsWith("-sa");
  const nonCommercial = code.includes("-nc");
  const capabilities = copyCapabilities({
    inAppSelection: noDerivatives ? SOURCE_CAPABILITY.DENY : SOURCE_CAPABILITY.ALLOW,
    sourceStreaming: noDerivatives ? SOURCE_CAPABILITY.DENY : SOURCE_CAPABILITY.ALLOW,
    audioEffects: noDerivatives ? SOURCE_CAPABILITY.DENY : SOURCE_CAPABILITY.ALLOW,
    hostedCopy: SOURCE_CAPABILITY.UNKNOWN,
  });
  const obligations = ["attribution"];
  if (nonCommercial) obligations.push("noncommercial-only");
  if (shareAlike) obligations.push("share-adaptations-alike");

  return Object.freeze({
    admitted: capabilities.inAppSelection === SOURCE_CAPABILITY.ALLOW
      && capabilities.sourceStreaming === SOURCE_CAPABILITY.ALLOW,
    licence: Object.freeze({
      code,
      version,
      label: `CC ${code.toUpperCase()} ${version}`,
      url: `https://creativecommons.org/licenses/${code}/${version}/`,
    }),
    capabilities,
    obligations: Object.freeze(obligations),
    reasons: Object.freeze(noDerivatives ? ["no-derivatives-excluded"] : []),
  });
}

export function evaluateJamendoTrack(track) {
  if (!track || typeof track !== "object" || Array.isArray(track)) {
    return unknownPolicy("invalid-track");
  }

  const requiredText = [track.id, track.name, track.artist_name];
  if (requiredText.some((value) => !asText(value))) {
    return unknownPolicy("missing-credit-metadata");
  }

  const streamUrl = safeHttpsUrl(track.audio, jamendoHost);
  const shareUrl = safeHttpsUrl(track.shareurl, jamendoHost);
  if (!streamUrl || !shareUrl) {
    return unknownPolicy("invalid-source-url");
  }

  const licencePolicy = creativeCommonsPolicy(track.license_ccurl);
  if (!licencePolicy.admitted) return licencePolicy;

  const imageUrl = safeHttpsUrl(track.image, jamendoHost);
  const discoveryPace = asText(track.musicinfo?.speed).toLowerCase();
  return Object.freeze({
    ...licencePolicy,
    source: "jamendo",
    providerCredit: "Provided by Jamendo",
    directBacklinkRequired: true,
    item: Object.freeze({
      id: asText(track.id),
      title: asText(track.name),
      artistId: asText(track.artist_id) || null,
      artistName: asText(track.artist_name),
      albumName: asText(track.album_name) || null,
      streamUrl: streamUrl.href,
      shareUrl: shareUrl.href,
      imageUrl: imageUrl?.href ?? null,
      pace: JAMENDO_DISCOVERY_PACES.has(discoveryPace) ? discoveryPace : null,
      genres: normalizedTags(track.musicinfo?.tags?.genres),
    }),
  });
}

export function directGrantPolicy({ source, evidenceRef, capabilities } = {}) {
  const normalizedSource = asText(source);
  const normalizedEvidence = asText(evidenceRef);
  const complete = capabilities && Object.keys(UNKNOWN_CAPABILITIES).every((key) => (
    DECISIONS.has(capabilities[key])
  ));
  if (!normalizedSource || !normalizedEvidence || !complete) {
    return unknownPolicy("incomplete-direct-grant");
  }

  const normalizedCapabilities = copyCapabilities(capabilities);
  const admitted = normalizedCapabilities.inAppSelection === SOURCE_CAPABILITY.ALLOW
    && normalizedCapabilities.sourceStreaming === SOURCE_CAPABILITY.ALLOW;
  return Object.freeze({
    admitted,
    source: normalizedSource,
    evidenceRef: normalizedEvidence,
    licence: Object.freeze({ code: "direct-grant", version: null, label: "Direct grant", url: null }),
    capabilities: normalizedCapabilities,
    obligations: Object.freeze(["source-specific-credit"]),
    reasons: Object.freeze(admitted ? [] : ["direct-grant-denies-required-capability"]),
  });
}

export const allowsSoundtrackEffects = (policy) => (
  policy?.admitted === true
  && policy.capabilities?.audioEffects === SOURCE_CAPABILITY.ALLOW
);
