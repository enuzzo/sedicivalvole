# Drivey.js integration boundary

- Upstream: <https://github.com/Rezmason/drivey>
- Imported commit: `5104cdade2a3158786b05b9b0680a50e942830cf`
- Runtime licence supplied by upstream: GNU GPL version 3 in `LICENSE`
- Project integration shell: `sedicivalvole.html`
- Integrity manifest: `UPSTREAM-SHA256SUMS.txt`

The imported runtime, levels, cameras, generated cars, road geometry, shaders,
Three.js modules, expression parser and theme loader are byte-identical to the
listed upstream commit. Sedici Valvole does not replace or redraw them. The
project-authored shell removes the original control bar from the embedded
presentation and exposes the already-created runtime to a same-origin parent
bridge. That bridge maps bounded road speed, music level, body-colour theme,
camera, traffic, reduced motion and braking UNDERWATER onto controls or
materials the original runtime already owns. The shell exposes the upstream
`Input` constructor so the product car remains under Drivey's automatic
road/curve steering; the parent bridge suppresses manual steering and clamps
only the player's random `weaving` value. The shell also augments the shared
runtime material at load time with a second project-owned tint uniform, allowing
each Sedici Valvole theme's native `accent` and `secondary` colours to remain
simultaneously visible. The upstream shader file itself remains byte-identical.

`legacy/` and `readme_assets/` are not imported because they are not required
by the selected modern runtime. In particular, no upstream screenshot or other
readme image is shipped in the product.

## Recorded licence ambiguity

The repository added its root GPLv3 `LICENSE` in commit
`f4f5ec66b53d99313a196e55783e209220886e31` on 2020-05-03. The current GitHub
repository also identifies itself as GPL-3.0. However, the byte-identical
`js/Drivey.js` still carries an older 2018 header saying that the port is for
non-profit use and that GPLv3 was only being considered. The conflicting text
is preserved exactly, not silently edited away. The current local integration
relies on the repository-level GPLv3 grant while keeping this ambiguity visible;
clarification from the upstream rights holders remains advisable before a use
whose commercial status is material.
