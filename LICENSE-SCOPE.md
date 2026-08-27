# License Scope

This repository uses a mixed code-and-asset licensing policy. The policy is
effective now, while the exact legal owner and a final standalone brand policy
remain open decisions. This document is not legal advice.

## AGPL-licensed material

Unless a file states otherwise, the following material is licensed under the
[GNU Affero General Public License v3.0 or later](LICENSE), identified by the
SPDX expression `AGPL-3.0-or-later`:

- source code and tests;
- shader source and code-based generative visuals;
- CSS and interface implementation;
- build, deployment, and project configuration; and
- project documentation.

Copyright notices identify the current contributors collectively as
`sedicivalvole contributors`. This is not a claim that a legal entity with that
name exists, and it does not resolve the final ownership decision.

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
- standalone visual or media assets, including
  `prototype/drive-lab/public/assets/luminous-axis.png`.

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
