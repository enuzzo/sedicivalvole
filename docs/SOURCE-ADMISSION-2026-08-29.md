# Visual Source Admission — 2026-08-29

Status: **approved; the DRIVEY boundary was superseded by the source-faithful
integration recorded below**.

This audit was completed before implementation. Each visual source was opened in
the in-app browser and captured at the Tesla `773 × 601` viewport. Repository
metadata and source trees were inspected without reading `.env` files or any
material under `_references/`.

The PRTCL, InfiniteTubes, and Primordial implementations remain original
AGPL-licensed project code under the clean-room boundaries recorded here. After
the initial Drivey implementation was rejected, the product owner instead
selected a source-faithful integration. DRIVEY therefore vendors the 51 files
required by the modern upstream runtime, unchanged and separately licensed,
while its sedicivalvole shell and external bridge remain project-authored AGPL
code. Attribution records provenance and does not relicense third-party work.

## Admission matrix

| Source | Audited identity | Evidence and licence status | Admitted mechanics | Excluded material |
|---|---|---|---|---|
| [Drivey](https://github.com/Rezmason/drivey) | commit `5104cdade2a3158786b05b9b0680a50e942830cf` | The repository supplies a root GNU GPL version 3 licence. The unchanged 2018 `js/Drivey.js` header still says non-profit use and that GPLv3 was being considered, so that conflict remains visible and upstream clarification is advisable where commercial status is material. Bundled three.js r115, expr-eval 2.0.2, and Hundred Rabbits Themes notices are preserved separately. | The complete modern road, level, traffic, generated-car, camera, material and rendering runtime: 51 byte-identical files protected by `UPSTREAM-SHA256SUMS.txt`, plus a separately authored sedicivalvole iframe shell and parent bridge. | `legacy/`, `readme_assets/`, screenshots and unnecessary upstream media. The original Driver, Chase and Satellite choices and native colour controls are hidden from the product surface rather than deleted from vendor source. |
| PRTCL | local commit `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` | The audited README states MIT and credits `© 2026 Netmilk Studio`, but the checkout contains no `LICENSE` file and `package.json` has no licence field. The user, as repository owner, directly authorized reuse and modification for this work. This record does not infer a different owner or broader grant. | Project-authored interpretations of Fractal Frequency, Murmuration, and Axiom, selected after rendered review. | The PRTCL runtime, preset source strings, UI, fonts, brand assets, screenshots, dependencies, and all other effects. |
| [InfiniteTubes](https://github.com/Mamboleoo/InfiniteTubes) | commit `a3b831b6c95bed4d803dfeed8b66ec76de333996` | The README carries the Codrops usage notice: integrated or built-upon use is permitted, while as-is resale, redistribution, republication, and pluginization are restricted. Visible credit is required for free plugins. | One project-authored tunnel system with Particles, Star Wars, and Triangle variants, based on rendered high-level motion and composition. | All upstream JavaScript and vendor libraries. The Star Wars `galaxyTexture.jpg` has no asset-specific provenance in the audited README and is explicitly excluded. The brick textures, Freepik pattern, blood-cell model, and every other asset are also excluded. |
| [GLSL: Primordial Soup](https://codepen.io/shubniggurath/pen/NXGbBo) | Pen `NXGbBo`, audited `2026-08-29` | The public Pen credits Liam Egan. CodePen's current public-Pen policy applies MIT by default. The Pen source also contains an attributed value-noise fragment by Inigo Quilez whose separate reuse terms were not established by this audit. | A clean-room, project-authored fluid scalar field based only on the rendered high-level mechanics: layered flow, colour islands, touch deformation, and speed-driven convergence. | The Pen's HTML, CSS, JavaScript, shader text, Three.js runtime, and the attributed noise function. |

## Selected PRTCL effects

- **Fractal Frequency** is the primary PRTCL variant. It retains independent
  Zoom, Particles, Colour Speed, and Size controls. A direct Particle Type
  control remains distinct from the shared Sedici Valvole palette control. Road
  speed drives particle size and depth travel; musical level and macro state
  drive colour phase and pulse.
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

1. DRIVEY runs its separately licensed, byte-identical vendor runtime inside a
   same-origin iframe controlled by a project-authored bridge. PRTCL,
   InfiniteTubes, and Primordial use separate project-authored renderer modules.
   All four share the existing Flux lifecycle, palette, diagnostics, reduced
   motion, frame accounting, and failure boundary.
2. PRTCL and InfiniteTubes are one catalog environment each, with contextual
   variants rather than unrelated demo entries.
3. OPEN, UNDERWATER, and BLOOM receive native per-renderer responses. Road speed
   and music remain separate inputs; no generic intensity control is introduced.
4. The PRTCL, InfiniteTubes, and Primordial renderers use only project-authored
   procedural geometry and colour. No unidentified raster or model is bundled.
5. Source credits remain in `THIRD_PARTY_NOTICES.md`, the product's source
   information, and the implementation comments where the study boundary needs
   to remain obvious.

## Verification gates

- Deterministic tests must cover mapping bounds, monotonic road response,
  variant selection, reduced motion, contextual-control accessibility,
  renderer cleanup and source-admission pins. DRIVEY additionally requires
  byte-for-byte verification of every manifest entry and proof that excluded
  directories are absent; the other three require proof that no vendor runtime
  or asset was imported.
- Muted browser QA must cover every variant at `773 × 601`, the three effect
  macros, console state, and bounded frame/memory behaviour.
- The final Product Design gate must compare each rendered source capture and
  implemented capture together at the same viewport. Automated evidence cannot
  claim human visual, listening, or real-Tesla acceptance.
