# Changelog

All notable changes to `sedicivalvole` are documented here. The format follows Keep a Changelog and the project uses Semantic Versioning. `VERSION` is the only SemVer source of truth.

## Unreleased

### Added

- A structured, Git-ignored `_references/` library preserving the original bootstrap ZIP and extracted contents.
- Versioned product specification, source audit, adversarial review, technical direction, deployment notes, licensing decision log, and roadmap.
- Root and prototype `AGENTS.md` rules, including the English-only repository/interface convention.
- A neutral Tesla capability harness for viewport, DPR, GPU, WebGL2, storage, GPS speed, AudioContext, AudioWorklet, and event reporting without coordinates.
- Exactly three visual directions and the selected direction 1 luminous-axis asset.
- A touch-first Drive Lab with WebGL2 motion, hue, reduced-motion fallback, GPS/demo source abstraction, keyboard simulator, Stop/Mute, Brake, and integrated diagnostics.
- A 16-step synthesized audio spike with saturating tempo, arrangement layers, motion cues, delay, limiter, and deterministic signal tests.
- SiteGround passive-FTP deployment scripts that parse `.env` as data and sanitize output.
- A continuous low energy wave whose frequency and gain rise smoothly with speed, plus extra speed-gated kick and hi-hat subdivisions.
- A compact-view `DIAG` entry point, a scrollable diagnostics panel, split/expanded viewport history, richer GPS/audio/runtime evidence, and a bounded chronological event log.
- A same-origin PHP `Send Diagnostic` endpoint with a fixed recipient, schema/body validation, coordinate-key rejection, rate limiting, and sanitized responses.
- A clean public GitHub repository at `github.com/enuzzo/sedicivalvole`, initialized from a reviewed snapshot without private bootstrap history.
- A confirmed two-mode product architecture: `Engine` for selectable engine emulation and `Flux` for speed-reactive music and generative WebGL fields.

### Changed

- Reworked the audio after user listening feedback: reduced the dominant noise bed and replaced the weak continuous tone with speed-dependent rhythmic and harmonic layers.
- Named the current adaptive music mode `Flux` and exposed that identity in the splash, live header, page metadata, and diagnostic report.
- Changed the development publication target from an isolated diagnostics path to the canonical site root.
- Changed all code, comments, documentation, operational text, and interface copy to English; Italian is reserved for direct user/assistant conversation.
- Defined canonical-root deployment as the default workflow during the private development phase, with post-upload live verification still mandatory.
- Defined frequent verified commits, push-when-configured, Dropbox-only implementation, and safe fresh-session handoff as durable agent workflow rules.
- Hardened canonical-root deployment to identify the existing app read-only and retain previous content-addressed assets during cache overlap instead of breaking clients with cached HTML.
- Added a no-store PHP root entry so the canonical URL can bypass stale static HTML while preserving content-addressed assets and the Sites-compatible HTML build.
- Documented SiteGround's stale canonical HTML behavior, retained both valid bundles, and stopped after the provider rejected an unauthenticated cache purge.
- Replaced the community viewport assumption with photographed Tesla evidence: `773 × 601` split-view viewport, `1254 × 784` logical screen, and DPR `1.53`.

### Fixed

- Corrected the SiteGround remote path after confirming the FTP account home sits above `sedicivalvole.app/public_html`.
- Removed the previously uploaded wrong FTP-home diagnostics tree after exact-name validation and explicit authorization.
- Prevented keyboard simulation from intercepting controls that own arrow or Space input.
- Added smoothing, deadband, saturating energy/tempo, and a discrete brake cooldown to avoid jitter and frantic high-speed tempo.

### Security

- `.env`, local variants, and `_references/` are ignored by Git.
- FTP credentials remain in memory and are never printed or placed in process arguments.
- GPS coordinates are discarded and never included in the report.
- Plain FTP on port 21 remains a known risk because credentials and content are unencrypted.
- The diagnostic recipient is stored in an ignored local PHP configuration rather than public source code.

No dated releases exist yet.
