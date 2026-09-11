// Session-only use, sampled from the active renderer and confirmed audio clock.
const LIMITS = { tracks: 64, genres: 32, visuals: 32, palettes: 32 };
const clean = (value, size) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, size) : '';

export function createSessionExperience() {
  return { observedMs: 0, listeningMs: 0, unlistedTrackMs: 0, tracks: [], genres: [], visuals: [], palettes: [], last: null };
}

function item(value, kind) {
  if (!value) return null;
  const id = clean(value.id, 100), label = clean(value.label, 120);
  if (!id || !label) return null;
  return { id, label, ...(kind === 'tracks' ? { detail: clean(value.detail, 120) } : {}),
    ...(kind === 'palettes' ? { colors: (value.colors ?? []).filter(c => /^#[a-f\d]{6}$/i.test(c)).slice(0, 3) } : {}) };
}

function add(state, kind, value, ms) {
  if (!value || ms <= 0) return;
  let row = state[kind].find(row => row.id === value.id);
  if (!row && state[kind].length < LIMITS[kind]) state[kind].push(row = { ...value, ms: 0 });
  if (row) row.ms += ms;
  else if (kind === 'tracks') state.unlistedTrackMs += ms;
}

export function observeSessionExperience(state, sample, nowMs) {
  if (!Number.isFinite(nowMs) || (state.last && nowMs <= state.last.at)) return state;
  const current = { at: nowMs, visible: sample.visible === true,
    track: item(sample.track, 'tracks'), genre: item(sample.genre, 'genres'),
    visual: item(sample.visual, 'visuals'), palette: item(sample.palette, 'palettes'),
    clockMs: Number.isFinite(sample.clockMs) ? sample.clockMs : null };
  const previous = state.last;
  state.last = current;
  const gap = previous ? nowMs - previous.at : 0;
  if (!previous?.visible || !current.visible || gap <= 0 || gap > 5000) return state;
  const dt = Math.min(gap, 86400000 - state.observedMs);
  if (dt <= 0) return state;
  state.observedMs += dt;
  add(state, 'visuals', previous.visual, dt);
  add(state, 'palettes', previous.palette, dt);
  // A paused/stalled clock, source switch or backwards seek is not listening.
  if (previous.track && previous.track.id === current.track?.id
    && previous.clockMs !== null && current.clockMs !== null) {
    const advance = current.clockMs - previous.clockMs;
    if (advance > 0 && advance <= gap * 1.5 + 250) {
      const heard = Math.min(dt, advance);
      state.listeningMs += heard;
      add(state, 'tracks', previous.track, heard);
      add(state, 'genres', previous.genre, heard);
    }
  }
  return state;
}

export function sessionExperienceSnapshot(state) {
  const snapshot = { observedMs: state.observedMs, listeningMs: state.listeningMs, unlistedTrackMs: state.unlistedTrackMs };
  for (const [kind, limit] of Object.entries(LIMITS)) snapshot[kind] = state[kind].slice(0, limit)
    .map(row => ({ ...item(row, kind), ms: row.ms }))
    .sort((a, b) => b.ms - a.ms || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return snapshot;
}
