# Third-Party Notices

The current Drive Lab uses third-party software dependencies. It includes no third-party audio samples and no material copied from the local `_references/` library.

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

Transitive dependencies and integrity hashes are locked in `prototype/drive-lab/package-lock.json`. A public release must generate and verify the complete dependency notice set.

`luminous-axis.png` is derived from the selected visual direction created during the Product Design workflow. It is original project material pending the final brand/visual policy and is not declared as a third-party asset.

Material kept only under `_references/` remains external local source material. It is not automatically approved, redistributable, or part of the product.

The Codrops/Tympanus `InfiniteLights` repository permits free use when the resource is integrated or built upon in personal or commercial websites, web apps, or templates, while prohibiting sale, redistribution, republication, or pluginization of the resource as-is. `VERTIGO 02` integrates Interstate 7 into the sedicivalvole product with an independently authored speed/FOV bridge; it is not offered as a standalone plugin or resource. The vendor snapshot retains the upstream README and notice, and deterministic hashes verify that its source has not been silently changed or relicensed. Credit belongs to Daniel Velasquez / Anemolo and Codrops/Tympanus for the original High-speed Light Trails experiment. See `docs/REFERENCE-STUDY-INFINITE-LIGHTS.md` for provenance and integration details.

### textStep and Lobo

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its original sequencer,
synthesizer, DSP, scene, and live-performance architecture informs the planned
multi-genre Flux sequencer. That authorship deserves explicit credit wherever
the future integration is described.

The repository is currently a study-only source under GNU GPL version 2.0. The
project maintainer confirms and accepts responsibility for Lobo's additional
direct, unrestricted authorization to reuse its content. No separate
written-evidence gate applies. No source, preset data, or audio asset from it
has entered this repository or product yet. When derived code is integrated,
this notice must identify the exact source commit, imported files,
modifications, public license, and Lobo attribution before publication. See
`docs/REFERENCE-STUDY-TEXTSTEP.md` for provenance, architectural findings, and
the adoption plan.
