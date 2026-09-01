# Third-Party Notices

The current Drive Lab uses third-party software dependencies, includes code translated from textStep under its author's direct authorization, and ships JUNCTION as original mixed music produced with the royalty-free MusicRadar material documented below. No loose sample, loop, one-shot, multisample, or source-pack file has entered the repository or any build.

Third-party components retain their original licences or direct permissions and
are not relicensed under the project's PolyForm grant.

| Component | Version | Copyright / authors | License | Changes | Location |
|---|---:|---|---|---|---|
| React | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| React DOM | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| Vite | 6.4.3 | Evan You and contributors | MIT | local configuration | `prototype/drive-lab/` |
| @vitejs/plugin-react | 5.0.4 | Vite contributors | MIT | none | `prototype/drive-lab/` |
| MapLibre GL JS | 5.7.1 | MapLibre contributors | BSD-3-Clause | lazy ATLAS renderer integration | `prototype/drive-lab/` |
| qrcode | 1.5.4 | Kazuhiko Arase and contributors | MIT | local passenger-link QR generation | `prototype/drive-lab/` |
| Simple Icons GitHub mark | current path | Simple Icons contributors | CC0-1.0 | small inline monochrome SVG identifying the public source link | `prototype/drive-lab/src/App.jsx` |
| [Tabler Icons — report, navigation, media, search, chart, map, chevron, external-link, and Wikipedia-brand icons](https://github.com/tabler/tabler-icons/tree/v3.46.0/icons) | 3.46.0 (icon metadata 1.0 / 1.39 / 2.0) | Copyright (c) 2020-2026 Paweł Kuna | MIT | official SVGs retained byte-identically; monochrome presentation, live ATLAS rotation, and the Now Playing pulse are applied by product CSS | `prototype/drive-lab/public/third-party/tabler-icons/` |
| Buy Me a Coffee QR and cup identity | user-supplied 2026-08-28 | Buy Me a Coffee / Coffee Inc. | service-generated brand material; trademark rights retained by the owner | supplied QR embedded unchanged; small interface cup redrawn for the trigger | `prototype/drive-lab/src/assets/bmc_qr.png`, `prototype/drive-lab/src/App.jsx` |
| Illobo LOBO identity marks | user-supplied 2026-08-31 | Lobo (`illobo`) | direct owner permission to use both supplied variants; all brand and trademark rights remain with Lobo | both SVGs retained byte-identically and presented as the Illobo Featured cover through a project-authored continuous four-second dissolve in each direction; no path or colour data is modified | `prototype/drive-lab/public/brand/illobo-featured-solid.svg`, `prototype/drive-lab/public/brand/illobo-featured-outline.svg` |
| Space Grotesk variable font | Google Fonts snapshot `2026-08-30`, upstream version 2.000 | Florian Karsten and the Space Grotesk Project Authors | SIL Open Font License 1.1 | locally hosted unmodified variable TrueType file for all reading text, values, controls, operational labels, LAB controls, and session-report typography | `prototype/drive-lab/public/fonts/` |
| Orbitron variable font | Google Fonts v35 | Matt McInerney and the Orbitron Project Authors | SIL Open Font License 1.1 | locally hosted unmodified variable WOFF2 used only for exact textual `sedicivalvole` wordmarks; the selected 16 Road mark retains its `16` converted at weight 750 into stable vector outlines | `prototype/drive-lab/public/fonts/`, `logo/` |
| OpenFreeMap public instance | continuously updated | OpenFreeMap contributors; OpenMapTiles and OpenStreetMap data contributors | service and data terms; attribution retained in-map | minimal palette-owned vector style and 3D building layer | `prototype/drive-lab/src/environments/atlas/` |
| [Open-Meteo Elevation API / Copernicus DEM GLO-90](https://open-meteo.com/en/docs/elevation-api) | Copernicus DEM 2021 GLO-90 | Open-Meteo; European Union, Copernicus programme | API data offered under CC BY 4.0; Copernicus acknowledgement retained | runtime-only terrain elevation for an approximately 100 m rounded location cell; no response is stored beyond the active ATLAS session | `prototype/drive-lab/src/environments/atlas/` |
| Localized Wikipedia API / PageImages | continuously updated | Wikimedia contributors and individual media authors | page and media-specific free licenses; selected article remains linked | runtime-only nearby abstracts and free-license thumbnails in the browser's supported language or the passenger's explicit selection; no content is stored or bundled | `prototype/drive-lab/src/environments/atlas/`, `prototype/drive-lab/src/discover/` |
| Infinite Lights / Interstate 7 | commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` | Daniel Velasquez / Anemolo and Codrops/Tympanus | Custom Codrops usage notice in the vendored README | vendored files are byte-identical; external sedicivalvole runtime bridge only | `prototype/drive-lab/public/third-party/infinite-lights/` |
| Three.js | r109, upstream-bundled build | Three.js authors | MIT | none | `prototype/drive-lab/public/third-party/infinite-lights/js/three.min.js` |
| postprocessing | 6.8.5 | Raoul van Rüschen | Zlib | none | `prototype/drive-lab/public/third-party/infinite-lights/js/postprocessing.min.js` |
| textStep (transport, DSP) | commit `cb107d198b730db60cff4a87c7fd5b8d1fae3fb2` | Lobo (`illobo`) | GNU GPL v2.0, plus the author's direct unrestricted authorization | translated from Rust to JavaScript; see the per-file list below | `prototype/drive-lab/src/score/` |

Transitive dependencies and integrity hashes are locked in `prototype/drive-lab/package-lock.json`. A public release must generate and verify the complete dependency notice set.

No standalone luminous-axis or Braun launch-detail raster is present in the
tracked source tree or production build output. Interface details and active
project-authored fields are code-generated visuals, not copied Product Design
reference assets.

### Visual sources admitted on 2026-08-29

Four external visual sources informed Flux studies. InfiniteTubes remains a
project-authored clean-room boundary; Primordial is now a retired historical
study. PRTCL uses only three
formula adaptations under the repository owner's direct authorization; its
runtime, UI, dependencies, brand and assets remain excluded. After the first
Drivey result was rejected, DRIVEY moved to a source-faithful integration of the
separately licensed upstream runtime. Original licences and usage notices remain
with every referenced or integrated work.

| Source | Audited identity | Authors / credit | Licence or permission evidence | Sedici Valvole treatment |
|---|---|---|---|---|
| [Drivey](https://github.com/Rezmason/drivey) | `5104cdade2a3158786b05b9b0680a50e942830cf` | Rezmason; original Drivey lineage credited upstream | repository includes GNU GPL version 3 text; the unchanged 2018 `js/Drivey.js` header still says non-profit use and that GPLv3 was being considered; bundled three.js r115, expr-eval 2.0.2, and Hundred Rabbits Themes retain their MIT notices | 51 byte-identical modern-runtime files are integrated behind a separate sedicivalvole shell and bridge; `legacy/`, `readme_assets/`, screenshots and unnecessary media are excluded |
| PRTCL | `2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` | audited README carried an obsolete studio attribution; project and repository creator is enuzzo | README states MIT but the audited checkout contains no `LICENSE` file; repository owner enuzzo supplied direct reuse and modification authorization for this work | Fractal Frequency, Murmuration, and Axiom formulas are adapted into a bounded project renderer; no PRTCL runtime, original preset file, UI, dependency, font, screenshot, brand asset, or other effect is included |
| [InfiniteTubes](https://github.com/Mamboleoo/InfiniteTubes) | `a3b831b6c95bed4d803dfeed8b66ec76de333996` | Louis Hoebregts for Codrops/Tympanus | custom Codrops integrated-use notice; as-is redistribution and pluginization restricted | Particles, Star Wars, and Triangle mechanics studied; original implementation only; all upstream assets excluded |
| [GLSL: Primordial Soup](https://codepen.io/shubniggurath/pen/NXGbBo) | Pen `NXGbBo`, rechecked 2026-08-29 | Liam Egan; embedded value-noise fragment credits Inigo Quilez | public Pen covered by [CodePen's current MIT default](https://blog.codepen.io/documentation/licensing/); separate terms for the embedded noise fragment were not established | rendered fluid mechanics studied; clean-room shader; no Pen or attributed noise source copied |

The complete admission evidence, rejected assets, selected PRTCL effects, and
runtime boundary are recorded in
[`docs/SOURCE-ADMISSION-2026-08-29.md`](docs/SOURCE-ADMISSION-2026-08-29.md).
The exact Drivey file hashes, bundled-library notices and unresolved header
ambiguity are preserved under
`prototype/drive-lab/public/third-party/drivey/`. Those manifest-listed files
are not relicensed under the sedicivalvole PolyForm grant; the project-authored
`sedicivalvole.html` shell and parent bridge follow the repository's current
PolyForm scope.

Material kept only under `_references/` remains external local source material. It is not automatically approved, redistributable, or part of the product.

### MusicRadar SampleRadar sample libraries

`_references/audio/samples/` holds four free sample libraries published by
[MusicRadar](https://www.musicradar.com/) through its SampleRadar series, and
originating from *Future Music* or *Computer Music* magazine:

| Library | Source | Credited creator |
|---|---|---|
| 207 free '90s jungle samples | <https://www.musicradar.com/news/sampleradar-free-90s-jungle-samples> | Cyclick Samples (`cyclickbob`) for MusicRadar |
| 797 free '90s synth samples | <https://www.musicradar.com/news/sampleradar-free-90s-synth-samples> | MusicRadar |
| 183 free 80s pop drums samples | <https://www.musicradar.com/news/sampleradar-free-80s-pop-drums-samples> | The MusicRadar Team; originally distributed by *Future Music* |
| 502 free '80s samples | <https://www.musicradar.com/news/sampleradar-free-80s-samples-1> | The MusicRadar Team; originally distributed by *Computer Music* |

**These samples are not ours. All rights in them remain with MusicRadar and the
credited creators.**

MusicRadar states the terms on both pages in the same words:

> Because they're royalty-free, you're welcome to use the samples in your music
> in any way you like — all we ask is that you don't re-distribute them.

The permission is to *use them in music*, including commercially. It is not a
permission to redistribute the loops themselves, and that restriction comes from
the rights holder: it cannot be lifted by an exclusion or exception in this
project's own licensing. `LICENSE-SCOPE.md` governs how the project's licence
applies to material the project includes; it cannot grant a right the project
does not hold.

**The project's decision, and how it is honoured technically.**

1. The libraries stay in the git-ignored `_references/` tree. No loop, one-shot
   or multisample from any pack is committed to this repository.
2. They are used the way the terms allow: as source material for composing
   sedicivalvole's own music.
3. What the product ships is that music. JUNCTION renders 192 bars of
   sedicivalvole arrangement — layering, voicing, processing chain and bus —
   into 24 complete eight-bar clips: three interchangeable complete
   performances for each of eight energy states, produced from 76 distinct
   source recordings. It uses the packs' native 127–168 BPM recordings without
   browser-side stretching, then packages the encoded production as one 5.8 MB
   segmented runtime bank. The browser schedules one self-contained synchronous
   performance at a time; it never receives an isolated loop or stem. It is not
   a disguised collection of source samples.

The distinction is the whole point, and it is not about Git. Serving the
individual loops as separate assets would put the pack itself on the network for
anyone to collect, which is redistribution whether or not the files were ever
committed. Serving a rendered arrangement is releasing a record made with
royalty-free samples, which is exactly what the licence describes.

Credit remains with MusicRadar and the credited creators, and the links above
are the canonical source for anyone who wants the original packs. They should be
obtained from MusicRadar, never from this project.

The Codrops/Tympanus `InfiniteLights` repository permits free use when the resource is integrated or built upon in personal or commercial websites, web apps, or templates, while prohibiting sale, redistribution, republication, or pluginization of the resource as-is. `VERTIGO 02` integrates Interstate 7 into the sedicivalvole product with an independently authored speed/FOV bridge; it is not offered as a standalone plugin or resource. The vendor snapshot retains the upstream README and notice, and deterministic hashes verify that its source has not been silently changed or relicensed. Credit belongs to Daniel Velasquez / Anemolo and Codrops/Tympanus for the original High-speed Light Trails experiment. See `docs/REFERENCE-STUDY-INFINITE-LIGHTS.md` for provenance and integration details.

### textStep and Lobo

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its original sequencer,
synthesizer, DSP, scene, and live-performance architecture informs the current
Flux sequencer and its planned multi-score extensions. That authorship deserves
explicit credit wherever the integration is described.

The upstream repository is published under GNU GPL version 2.0. The project
maintainer confirms and accepts responsibility for Lobo's additional direct,
unrestricted authorization to reuse its content, which is the basis on which the
translated code is combined with original sedicivalvole material under the
current mixed policy. The direct authorization is load-bearing and must not be
dropped from these notices; the translated code is not relicensed under
PolyForm.

**Derived code is now integrated and shipped.** As required, the exact
provenance follows. Every file carries the same information in its own header.

Translated from textStep at commit
`cb107d198b730db60cff4a87c7fd5b8d1fae3fb2`, all under
`prototype/drive-lab/src/score/`:

| File | Upstream file | Modifications |
|---|---|---|
| `clock.js` | `src/audio/clock.rs` | Rust to a JavaScript class; Ableton Link re-stamping omitted; additionally reports position inside a 32-step pattern and a four-bar phrase |
| `patterns.js` | `src/sequencer/drum_pattern.rs` | the upstream hex step encoding, decoded to velocities |
| `dsp/primitives.js` | `src/audio/drum_voice.rs` | noise, one-pole filters, state-variable filter, comb, drive, extracted as shared primitives |
| `dsp/drum-voices.js` | `src/audio/drum_voice.rs` | kick, snare, closed and open hats, clap; `f32` arithmetic becomes doubles, so output is not bit-identical; ride, cowbell and tom are not ported |
| `dsp/synth-voice.js` | `src/audio/synth_voice.rs` | oscillators with PolyBLEP, ADSR, 24 dB Cytomic filter |
| `dsp/effects.js` | `src/audio/effects.rs` | `RampedParam`, `TubeSaturator` with its 2x oversampler, `SidechainEnvelope`, `LookaheadLimiter` (threshold lowered from 0.95 to 0.72), and the musical delay subdivisions |

The following files in the same directory are **original sedicivalvole work**
and are not derived from textStep: `arranger.js`, `fracture-rhythm.js`, `score-core.js`,
`jungle-score.js`, `genres.js`, `dsp/brake-filter.js`,
`worklet/score-processor.js`, and the `StereoReverb`, `StereoChorus`,
`StereoWidth` and `TempoDelay` classes at the end of `dsp/effects.js`.

No upstream preset data, pattern preset, kit name, or audio asset is included.
Upstream preset families named after specific commercial records are
deliberately not carried across. See `docs/REFERENCE-STUDY-TEXTSTEP.md` for
provenance, architectural findings, and the adoption plan.

### Automatic music transcription development stack

The sample-harmony pilot uses a machine-local, Git-ignored Python environment.
None of these packages, their models, or their generated reports enter the
browser bundle or the published product.

| Package | Pinned version/range | Licence | Purpose and source |
|---|---:|---|---|
| [Spotify Basic Pitch](https://github.com/spotify/basic-pitch) | `0.4.0` | Apache-2.0 | High-recall polyphonic note proposals; never the final harmonic verdict |
| [NumPy](https://github.com/numpy/numpy) | `<2.1` | BSD-3-Clause | Numerical arrays used by the analysis stack |
| [Numba](https://github.com/numba/numba) | `0.60.0` | BSD-2-Clause | Matched CPython 3.11 acceleration dependency for Apple-silicon and Intel macOS |
| [llvmlite](https://github.com/numba/llvmlite) | `0.43.0` | BSD-2-Clause | Matched native macOS backend required by Numba |
| [scikit-learn](https://github.com/scikit-learn/scikit-learn) | `<=1.5.1` | BSD-3-Clause | Version bounded to Core ML Tools' verified conversion range |
| [setuptools](https://github.com/pypa/setuptools) | `<81` | MIT | Compatibility provider for the legacy `pkg_resources` import in Resampy |

Basic Pitch's transitive runtime on macOS includes Core ML Tools, librosa,
SciPy, Resampy, Pretty MIDI, mir_eval, SoundFile, and their declared Python
dependencies. Their installed licence files remain in the ignored virtual
environment. They are development tools only and do not alter the licensing of
the project's source or the external sample packs.
