# Third-Party Notices

The current Drive Lab uses third-party software dependencies, includes code translated from textStep under its author's direct authorization, and ships JUNCTION as original mixed music produced with the royalty-free MusicRadar material documented below. No loose sample, loop, one-shot, multisample, or source-pack file has entered the repository or any build.

Third-party components retain their original licenses and are not relicensed under the project's AGPL grant.

| Component | Version | Copyright / authors | License | Changes | Location |
|---|---:|---|---|---|---|
| React | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| React DOM | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| Vite | 6.4.2 | Evan You and contributors | MIT | local configuration | `prototype/drive-lab/` |
| @vitejs/plugin-react | 5.0.4 | Vite contributors | MIT | none | `prototype/drive-lab/` |
| Infinite Lights / Interstate 7 | commit `e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` | Daniel Velasquez / Anemolo and Codrops/Tympanus | Custom Codrops usage notice in the vendored README | vendored files are byte-identical; external sedicivalvole runtime bridge only | `prototype/drive-lab/public/third-party/infinite-lights/` |
| Three.js | r109, upstream-bundled build | Three.js authors | MIT | none | `prototype/drive-lab/public/third-party/infinite-lights/js/three.min.js` |
| postprocessing | 6.8.5 | Raoul van Rüschen | Zlib | none | `prototype/drive-lab/public/third-party/infinite-lights/js/postprocessing.min.js` |
| textStep (transport, DSP) | commit `cb107d198b730db60cff4a87c7fd5b8d1fae3fb2` | Lobo (`illobo`) | GNU GPL v2.0, plus the author's direct unrestricted authorization | translated from Rust to JavaScript; see the per-file list below | `prototype/drive-lab/src/score/` |

Transitive dependencies and integrity hashes are locked in `prototype/drive-lab/package-lock.json`. A public release must generate and verify the complete dependency notice set.

`luminous-axis.png` is derived from the selected visual direction created during the Product Design workflow. It is original project material pending the final brand/visual policy and is not declared as a third-party asset.

Material kept only under `_references/` remains external local source material. It is not automatically approved, redistributable, or part of the product.

### MusicRadar SampleRadar sample libraries

`_references/audio/samples/` holds two free sample libraries published by
[MusicRadar](https://www.musicradar.com/) through its SampleRadar series, and
originating from *Future Music* magazine:

| Library | Source | Credited creator |
|---|---|---|
| 207 free '90s jungle samples | <https://www.musicradar.com/news/sampleradar-free-90s-jungle-samples> | Cyclick Samples (`cyclickbob`) for MusicRadar |
| 797 free '90s synth samples | <https://www.musicradar.com/news/sampleradar-free-90s-synth-samples> | MusicRadar |

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
   or multisample from either pack is committed to this repository.
2. They are used the way the terms allow: as source material for composing
   sedicivalvole's own music.
3. What the product ships is that music. JUNCTION renders 64 bars of
   sedicivalvole arrangement — layering, voicing, processing chain and bus —
   into eight complete sections, then packages the encoded production as one
   runtime bank. It is not a disguised collection of source samples.

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
translated code is combined with this project's `AGPL-3.0-or-later` material.
GPL v2.0 alone would not permit that combination; the direct authorization is
therefore load-bearing and must not be dropped from these notices.

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
and are not derived from textStep: `arranger.js`, `score-core.js`,
`jungle-score.js`, `genres.js`, `dsp/brake-filter.js`,
`worklet/score-processor.js`, and the `StereoReverb`, `StereoChorus`,
`StereoWidth` and `TempoDelay` classes at the end of `dsp/effects.js`.

No upstream preset data, pattern preset, kit name, or audio asset is included.
Upstream preset families named after specific commercial records are
deliberately not carried across. See `docs/REFERENCE-STUDY-TEXTSTEP.md` for
provenance, architectural findings, and the adoption plan.
