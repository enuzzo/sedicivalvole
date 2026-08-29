# Visual Source Admission — 2026-08-29

Status: **approved for project-authored integration with the boundaries below**.

This audit was completed before implementation. Each visual source was opened in
the in-app browser and captured at the Tesla `773 × 601` viewport. Repository
metadata and source trees were inspected without reading `.env` files or any
material under `_references/`.

The new Sedici Valvole renderers are original AGPL-licensed project code. No
Drivey, InfiniteTubes, CodePen, or PRTCL source file, runtime, texture, model,
font, screenshot, or other asset is copied into the product. Attribution records
the visual study; it does not relicense the referenced work.

## Admission matrix

| Source | Audited identity | Evidence and licence status | Admitted mechanics | Excluded material |
|---|---|---|---|---|
| [Drivey](https://github.com/Rezmason/drivey) | commit `5104cdade2a3158786b05b9b0680a50e942830cf` | Repository includes the GNU GPL version 3 licence text. The audited files do not provide one common asset-specific grant for screenshots, SVG diagrams, the original Drivey lineage, or bundled libraries. | A project-authored forward road grammar, wireframe presentation, and Driver / Hood / Rear camera choices, based on the rendered public demo. | All upstream code, levels, screenshots, diagrams, libraries, audio references, and assets. |
| PRTCL | local commit `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` | The audited README states MIT and credits `© 2026 Netmilk Studio`, but the checkout contains no `LICENSE` file and `package.json` has no licence field. The user, as repository owner, directly authorized reuse and modification for this work. This record does not infer a different owner or broader grant. | Project-authored interpretations of Fractal Frequency, Murmuration, and Axiom, selected after rendered review. | The PRTCL runtime, preset source strings, UI, fonts, brand assets, screenshots, dependencies, and all other effects. |
| [InfiniteTubes](https://github.com/Mamboleoo/InfiniteTubes) | commit `a3b831b6c95bed4d803dfeed8b66ec76de333996` | The README carries the Codrops usage notice: integrated or built-upon use is permitted, while as-is resale, redistribution, republication, and pluginization are restricted. Visible credit is required for free plugins. | One project-authored tunnel system with Particles, Star Wars, and Triangle variants, based on rendered high-level motion and composition. | All upstream JavaScript and vendor libraries. The Star Wars `galaxyTexture.jpg` has no asset-specific provenance in the audited README and is explicitly excluded. The brick textures, Freepik pattern, blood-cell model, and every other asset are also excluded. |
| [GLSL: Primordial Soup](https://codepen.io/shubniggurath/pen/NXGbBo) | Pen `NXGbBo`, audited `2026-08-29` | The public Pen credits Liam Egan. CodePen's current public-Pen policy applies MIT by default. The Pen source also contains an attributed value-noise fragment by Inigo Quilez whose separate reuse terms were not established by this audit. | A clean-room, project-authored fluid scalar field based only on the rendered high-level mechanics: layered flow, colour islands, touch deformation, and speed-driven convergence. | The Pen's HTML, CSS, JavaScript, shader text, Three.js runtime, and the attributed noise function. |

## Selected PRTCL effects

- **Fractal Frequency** is the primary PRTCL variant. It retains independent
  Zoom, Particles, Colour Speed, and Size controls. Road speed drives particle
  size and depth travel; musical level and macro state drive colour phase and
  pulse.
- **Murmuration** was selected because its horizontal flock waveform gives
  musical movement without recreating the rejected central starburst.
- **Axiom** was selected because its perspective landscape has forward depth,
  central convergence, and a restrained Swiss grid that can respond clearly to
  road speed.
- **Electromagnetic Field** was rejected for this integration because its bright
  two-pole burst repeats the starburst language already rejected for Flux.
- **Perlin Noise** was not selected because its object-centric sphere has weaker
  road and horizon continuity than Murmuration or Axiom.

## Runtime and attribution contract

1. Drivey, PRTCL, InfiniteTubes, and Primordial use separate renderer modules but
   share the existing Flux environment lifecycle, palette, diagnostics, reduced
   motion, frame accounting, and failure boundary.
2. PRTCL and InfiniteTubes are one catalog environment each, with contextual
   variants rather than unrelated demo entries.
3. OPEN, UNDERWATER, and BLOOM receive native per-renderer responses. Road speed
   and music remain separate inputs; no generic intensity control is introduced.
4. The InfiniteTubes and Primordial renderers use only project-authored
   procedural geometry and colour. No unidentified raster or model is bundled.
5. Source credits remain in `THIRD_PARTY_NOTICES.md`, the product's source
   information, and the implementation comments where the study boundary needs
   to remain obvious.

## Verification gates

- Deterministic tests must cover mapping bounds, monotonic road response,
  variant selection, reduced motion, contextual-control accessibility,
  renderer cleanup, source-admission pins, and the absence of imported vendor
  assets.
- Muted browser QA must cover every variant at `773 × 601`, the three effect
  macros, console state, and bounded frame/memory behaviour.
- The final Product Design gate must compare each rendered source capture and
  implemented capture together at the same viewport. Automated evidence cannot
  claim human visual, listening, or real-Tesla acceptance.
