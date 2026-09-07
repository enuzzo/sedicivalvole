import { FLUX_VISUAL_CHOICES, SHADERGRADIENT_ENVIRONMENTS, isShaderGradientEnvironmentId } from './flux-environments.js';
import { SOUNDTRACK_GENRE_OPTIONS, normalizeSoundtrackSelection, soundtrackSelectionSignature } from './soundtrack/library-model.js';

export function luckySoundtrackGenre(previousId = null, random = Math.random) {
  const choices = SOUNDTRACK_GENRE_OPTIONS.filter(item => item.id !== previousId);
  let unit = 0;
  try { const value = Number(random()); unit = Number.isFinite(value) ? Math.max(0, Math.min(.999999, value)) : 0; } catch {}
  return normalizeSoundtrackSelection({ kind: 'genre', id: choices[Math.floor(unit * choices.length)].id });
}

/** Every visit starts with a fresh genre; exact choices apply to this visit. */
export function initialLaunchSoundtrack(selection, random = Math.random) {
  return luckySoundtrackGenre(normalizeSoundtrackSelection(selection).id, random);
}

/** Roll real visual families equally. Passenger tools remain deliberate choices. */
export function luckyLaunchVisual(previousId = null, random = Math.random) {
  const previousFamily = isShaderGradientEnvironmentId(previousId) ? 'shadergradient' : previousId;
  const choices = FLUX_VISUAL_CHOICES.filter(item => !['atlas', 'discover', 'stats', previousFamily].includes(item.id));
  const pick = items => {
    let unit = 0;
    try { const value = Number(random()); unit = Number.isFinite(value) ? Math.max(0, Math.min(.999999, value)) : 0; } catch {}
    return items[Math.floor(unit * items.length)];
  };
  const next = pick(choices);
  return next.kind === 'family' ? pick(SHADERGRADIENT_ENVIRONMENTS).id : next.id;
}

/** A loading catalogue may still retain the previous queue. Never resume it. */
export function soundtrackLaunchReady(snapshot, selection) {
  return Boolean(snapshot?.current && ['prepared', 'paused', 'playing', 'buffering'].includes(snapshot.status)
    && soundtrackSelectionSignature(snapshot.library?.selection) === soundtrackSelectionSignature(selection));
}

export function prepareExactSoundtrackStart(controller, selection) {
  const snapshot = controller.getSnapshot();
  if (soundtrackLaunchReady(snapshot, selection)) return controller.resume();
  const pendingMatch = snapshot.status === 'loading'
    && soundtrackSelectionSignature(snapshot.library?.selection) === soundtrackSelectionSignature(selection);
  if (!pendingMatch) void controller.load({ selection });
  // The existing foreground recovery owner resumes the selected queue when ready.
  return Promise.resolve(controller.getSnapshot());
}
