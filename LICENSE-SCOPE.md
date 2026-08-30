# License Scope

This repository uses a mixed code-and-asset licensing policy. The policy is
effective now. The project's sole original creator and public licensor identity
is `enuzzo`; a final standalone brand policy remains an open decision. This
document is not legal advice.

## AGPL-licensed material

Unless a file states otherwise, the following material is licensed under the
[GNU Affero General Public License v3.0 or later](LICENSE), identified by the
SPDX expression `AGPL-3.0-or-later`:

- source code and tests;
- shader source and code-based generative visuals;
- CSS and interface implementation;
- build, deployment, and project configuration; and
- project documentation.

Copyright notices identify the sole original project creator and licensor as
`enuzzo`. This is a public creator identity, not a claim that a studio, company,
or other legal entity exists. Third-party material remains owned and licensed
by its respective rights holders.

The AGPL permits copying, modification, distribution, commercial use, sale,
forks, and rebranding. It requires compliance with its license, notice,
corresponding-source, and modified-network-service obligations. Attribution in
this policy means preserving the notices and license information required by
the AGPL; it does not require promotional endorsement.

## Excluded material

The AGPL grant does not cover the following unless a specific file states that
it does:

- the `sedicivalvole` name, future logo, marks, and brand assets;
- product screenshots and marketing media;
- original audio recordings, samples, and sound packs; and
- standalone original visual or media assets when present.

No permission to use a trademark is granted. All rights in excluded material
remain reserved by the respective rights holders.

## Third-party material

Third-party software and assets retain their original licenses and are not
relicensed by this project. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Local material under `_references/` is not part of the repository or any
project license grant.

The files under `prototype/drive-lab/public/third-party/infinite-lights/` are
excluded from the project's AGPL grant. They are an unmodified vendor snapshot
of Codrops/Tympanus Infinite Lights commit
`e58d58520bc0dfde21f9e14e6a1b8c7f0a2a2a9e` and remain subject to the upstream
usage notice and the licenses of its bundled Three.js and post-processing
libraries. The separately authored sedicivalvole bridge remains AGPL-licensed.

The 51 files enumerated by
`prototype/drive-lab/public/third-party/drivey/UPSTREAM-SHA256SUMS.txt` are an
unmodified snapshot of the modern Rezmason Drivey runtime at commit
`5104cdade2a3158786b05b9b0680a50e942830cf`. They are excluded from the
project's AGPL grant and retain Drivey's supplied GNU GPL version 3 licence plus
the preserved MIT notices for bundled three.js r115, expr-eval 2.0.2, and
Hundred Rabbits Themes. The unchanged 2018 `js/Drivey.js` header conflicts with
the later repository-level GPLv3 grant by still mentioning non-profit use and a
GPLv3 licence under consideration; that ambiguity is recorded rather than
silently resolved. The separately authored sedicivalvole iframe shell, bridge,
integration notice and integrity tooling remain AGPL-licensed.

The PRTCL Flux environment admitted on 2026-08-29 contains project-authored
renderer/lifecycle code plus adaptations of three procedural formulas under the
PRTCL repository owner's direct reuse and modification authorization. Those
adaptations are included within the project's `AGPL-3.0-or-later` source grant;
this does not infer a broader licence for the PRTCL repository. Its runtime,
original preset files, UI, dependencies, fonts, screenshots, brand assets, and
other effects are excluded. The InfiniteTubes- and Primordial-inspired Flux
environments remain original clean-room sedicivalvole source and code-generated
visuals. `THIRD_PARTY_NOTICES.md` and
`docs/SOURCE-ADMISSION-2026-08-29.md` preserve the exact boundaries and credits.

The Flux score engine includes code translated from Lobo's
[textStep](https://github.com/illobo/textStep) at commit
`cb107d198b730db60cff4a87c7fd5b8d1fae3fb2`: the sequencer clock, the step
encoding, and the drum, synth and bus DSP, all under
`prototype/drive-lab/src/score/`. Upstream is published under GNU GPL version
2.0, and the combination with this project's AGPL material rests on Lobo's
additional direct, unrestricted authorization rather than on licence
compatibility. That translated code remains third-party-derived material and is
not relicensed by this project. The arranger, the score generator, the authored
composition, the score library, the brake filter and the worklet shell in the
same directory are original sedicivalvole work. `THIRD_PARTY_NOTICES.md` records
the exact per-file provenance and modifications.

The sample libraries under `_references/audio/samples/` are published by
MusicRadar and belong to MusicRadar and their credited creators. They are
royalty-free to use in music but explicitly may not be redistributed, so they
are never committed here and are never served as individual files. Only
sedicivalvole's own rendered arrangements ship. That restriction is the rights
holder's and is not affected by the exclusions in this document.

## Open legal work

Before accepting external contributions, publishing original asset packs, or
offering commercial or dual licensing, the project must identify the exact
copyright and trademark owner and obtain appropriate legal review. Contributor
terms, a possible CLA, and the final brand/asset policy remain separate
decisions.
