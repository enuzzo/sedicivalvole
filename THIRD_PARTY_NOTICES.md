# Third-Party Notices

The current Drive Lab uses open-source software dependencies. It includes no third-party audio samples and no material copied from the local `_references/` library.

Third-party components retain their original licenses and are not relicensed under the project's AGPL grant.

| Component | Version | Copyright / authors | License | Changes | Location |
|---|---:|---|---|---|---|
| React | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| React DOM | 19.2.0 | Meta Platforms, Inc. and contributors | MIT | none | `prototype/drive-lab/` |
| Vite | 6.4.2 | Evan You and contributors | MIT | local configuration | `prototype/drive-lab/` |
| @vitejs/plugin-react | 5.0.4 | Vite contributors | MIT | none | `prototype/drive-lab/` |

Transitive dependencies and integrity hashes are locked in `prototype/drive-lab/package-lock.json`. A public release must generate and verify the complete dependency notice set.

`luminous-axis.png` is derived from the selected visual direction created during the Product Design workflow. It is original project material pending the final brand/visual policy and is not declared as a third-party asset.

Material kept only under `_references/` remains external local source material. It is not automatically approved, redistributable, or part of the product.

The Codrops/Tympanus `InfiniteLights` repository is currently a study-only source under its custom usage notice. No file or substantial implementation from it has entered this repository or product. See `docs/REFERENCE-STUDY-INFINITE-LIGHTS.md` for provenance and constraints.

### textStep and Lobo

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its original sequencer,
synthesizer, DSP, scene, and live-performance architecture informs the planned
multi-genre Flux sequencer. That authorship deserves explicit credit wherever
the future integration is described.

The repository is currently a study-only source under GNU GPL version 2.0,
with an additional direct permission reported by the user but not yet documented
in reproducible written form. No source, preset data, or audio asset from it has
entered this repository or product. If derived code is integrated, this notice
must identify the exact source commit, imported files, modifications, and
applicable license before publication. See `docs/REFERENCE-STUDY-TEXTSTEP.md`
for provenance, architectural findings, and the adoption gate.
