import play from "../public/third-party/tabler-icons/player-play-filled.svg?raw";
import pause from "../public/third-party/tabler-icons/player-pause-filled.svg?raw";
import previous from "../public/third-party/tabler-icons/player-skip-back-filled.svg?raw";
import next from "../public/third-party/tabler-icons/player-skip-forward-filled.svg?raw";
import levels from "../public/third-party/tabler-icons/chart-bar.svg?raw";

const icons = { play, pause, previous, next, levels };
// Trusted, unchanged, locally vendored MIT icons travel in the initial app chunk.
export function MediaGlyph({ name }) {
  return <span className={`media-glyph is-${name}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: icons[name] }} />;
}
