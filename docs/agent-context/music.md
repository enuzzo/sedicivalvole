# Flux score, Soundtrack and FX

Read only for the named subsystem. These are active owner constraints, not proof of implementation or live acceptance. Paths below are repository-relative unless linked. Later explicit owner decisions supersede older studies.

Flux is an authored adaptive score: retain arrangement, low end, rhythm, harmony, timbre and spatial progression rather than oscillator pings, a noise bed or linear BPM escalation. Maintain `docs/MUSIC-CRAFT.md` in the same session for diagnosed faults, researched techniques and score improvements, including why the listener noticed them. Assert testable musical invariants; remove craft advice that constrains without cause.

- JUNCTION must not equate road energy with a permanently loud break. Keep rest free of beat and bassline, introduce a quiet native-tempo break near `13 km/h`, cap the authored tempo ladder at `168 BPM`, and grow intensity primarily through orchestration, dynamics, punctuation and effects. Randomness may mix only complete, tempo-, harmony- and rhythm-compatible authored takes at eight-bar boundaries; paired decks must share one exact rhythmic spine, every encoded clip must be self-contained, and recent-family memory must prefer material the listener has not just heard. Use sample-accurate starts, never repeat the same primary take immediately, and never choose a bass, melody note or tonal accent without checking it against the voiced chord. Keep the six-clip decoded-memory bound and never publish an isolated source loop or stem.

- The running Music drawer has one persistent `Play the Road` / `Soundtrack` switch. Soundtrack gives compact equal hierarchy to `Illobo Featured` and `Jamendo Library`, rotates its displayed playlist and cover preview on a stable 30-minute window, and states that cadence. Jamendo pace, genre, and exact-track controls start playback immediately; pace is catalogue discovery only and never road-speed automation or playback-rate control. All fixed recordings stay at authored `1×`. Footer MUTE and FX are universal across both music sources; FX off silences OPEN/UNDERWATER/BLOOM audio processing without suppressing the same macros in visuals.

- Soundtrack selection must never block `START`. Enter the visual immediately,
  state truthfully when remote music data is pending or the browser reports a
  constrained connection, and start prepared audio automatically when it
  arrives. Mute follows the same launch path; it is not a hidden bypass.

- Keep exactly three transient Soundtrack media roles. The current role owns `preload=auto`; adjacent roles begin at metadata-only and may promote to audio only after the current recording has `6 s` of forward buffer or reports enough data. PREVIOUS must rewind and reuse a healthy retained media element instead of destroying its browser buffer. Every initial, manual, or automatic change starts the target silently, waits for the same buffer floor inside the bounded transport deadline, rewinds it, and only then makes it audible; the committed outgoing track and metadata remain intact during that wait. Browser Media Session owns stable session-lifetime play, pause, previous, and next handlers, and rapid transport commands execute in exact order. In Soundtrack, the black source module shows speed only—no `FLUX`, BPM or energy.

- At the `773 × 601` Tesla viewport, Music preserves the Swiss Compact role hierarchy and uses deliberate vertical scrolling whenever the available content no longer fits: Pace and Genre are whole-surface one-tap chips with standard media icons, and track rows are whole-surface controls. Never recover a no-scroll composition by taking typography below its semantic role or primary controls below their touch geometry. Play the Road lists only the three scores that can actually play, each with concise listener-facing copy and its own coherent cover; roadmap-only scores stay out of the running drawer. Illobo tracks use a coherent title-specific cover collection while the two supplied Illobo marks remain the playlist identity.

- In the current dark Music drawer, the Now Playing chart icon must be visibly white and `NOW PLAYING` must remain on one line. Preserve the pinned black `chart-bar.svg` source unchanged: DARK applies its white presentation non-destructively, and future `LIGHT / DARK / AUTO` tokens must select the appropriate contrast without duplicating or recolouring the vendor asset.

- Treat the vehicle-macro snapshot as a typed boundary: audible consumers read `snapshot.values`, never undeclared top-level aliases. Soundtrack and NIGHTSHIFT share the two-stage perceptual UNDERWATER model. The current four-effect graph is only a published baseline: the mandatory revision has exactly eight manual effects, retains Flanger/Reverb/Echo, removes Chorus, and adds five differentiated processors including progressive manual Underwater plus deliberate low/high-frequency transformations. All eight share one level-bounded post-source graph across Play the Road and Soundtrack; do not restore the retired Beat Repeat worklet.

- The selected manual-effects surface is **FX Deck**: a persistent footer `MIX` control opens a compact non-modal overlay above the footer while the visual keeps running. Expand it to a readable `2 × 4` touch layout; make every `100%` state highly distorted and unmistakable without click, silence, clipping, runaway feedback, or destructive level jumps. Retain independent depth sliders and one reset, persist values when switching between Play the Road and Soundtrack, and never return these controls to the bottom of the Music drawer. The deck may pin the controls open but must never enter the application's inert modal boundary.

- Speed raises energy through a smoothed saturating curve. Past the tempo knee, deepen arrangement instead of creating a frantic march.

- Keep continuous speed/energy parameters separate from bar-quantized structural events. Use smoothing, hysteresis, dwell, crossfades, a tempo knee, and musically controlled deceleration.
## Owner weak-network music feedback — 2026-09-08

Ship music control glyphs in the initial application payload, with visible
loading/retrying feedback instead of blank controls. Retain transport while
waiting for the catalogue. Recover artwork on network/foreground return and
republish native metadata. Verify native play/pause/previous/next through the
actual app handlers; do not equate API registration with Tesla button visibility.
Preserve the native invocation/outcome log and fixed recordings at 1x.

Now Playing uses the single footer animated/inert container and retracts with chrome; suppress it for Atlas and open menus/popups/passenger panels. Do not restore an independent overlay.

Consult [music craft](../MUSIC-CRAFT.md) for composition/acoustics and [Soundtrack source policy](../SOUNDTRACK-SOURCE-POLICY.md) for media acquisition/retention.
