# Licensing Decision Log

Status: **active interim policy**. The repository now carries an
`AGPL-3.0-or-later` code and documentation license with explicit asset and
trademark exclusions. The exact legal owner and final brand policy remain open
and require legal review. This document is not legal advice.

The operative files are the root [`LICENSE`](../LICENSE),
[`LICENSE-SCOPE.md`](../LICENSE-SCOPE.md), and [`NOTICE`](../NOTICE).

## Active split

| Scope | Current treatment |
|---|---|
| Source code, tests, shader source, CSS, build/deployment configuration, project documentation | GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`) |
| Name `sedicivalvole`, future logo and marks, brand assets, screenshots, original audio, standalone visual/media assets | excluded from the AGPL grant; All Rights Reserved by the respective rights holders; no trademark license |
| Third-party material and samples | original licenses preserved and recorded in `THIRD_PARTY_NOTICES.md` before use |
| Selected shareable creative assets | optional separate media license, decided and marked per file |

Creative Commons may be considered for media, not software. See
[`BRAND-ASSET-POLICY.md`](BRAND-ASSET-POLICY.md).

## What AGPL does and does not do

- It allows copying, forks, modification, rebranding, sale, and commercial use;
  it does not prevent cloning.
- It requires compliance with its notice, license, modification, and
  corresponding-source obligations.
- A modified version used to provide a network service must offer corresponding
  source to remote users as required by section 13.
- Code-based shaders and generative visuals remain commercially reusable under
  AGPL terms.
- Attribution means preserving required copyright and license notices. It is not
  a requirement to advertise or endorse the original project.
- Preventing commercial reuse would require a different source-available or
  commercial strategy, not this open-source license.

MIT and Apache are too permissive for the stated copyleft goal. GPL does not
address network-only modified services in the same way as AGPL. None of these
licenses alone protects the project name, brand, or recognizable media assets.

## Ownership notice

The current notice uses `sedicivalvole contributors` collectively. This avoids
inventing a legal entity and does not decide who owns the copyright or a future
trademark. Each contribution must be made by someone entitled to license it.

## Open legal work

1. identify the exact legal copyright and trademark owner;
2. obtain legal review of the mixed code/asset policy;
3. decide contributor policy and whether a CLA is needed;
4. establish final trademark and brand-usage rules;
5. verify provenance and licenses for every audio sample and external asset;
6. decide whether any original media will receive a separate license; and
7. add SPDX headers to source files as the codebase matures.

## textStep permission and compatibility gate

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its sequencer, synthesizer, DSP,
scene, and performance architecture is his original work and informs the
planned Flux sequencer direction.

The ignored study copy is publicly licensed under GNU GPL version 2.0. The user reports an additional direct authorization from the author for unrestricted reuse, but no written license text or sublicensing terms have been added to this repository. GPL-2.0-only source must not be copied into the `AGPL-3.0-or-later` product on assumption alone. Before direct reuse, preserve written evidence that clearly covers modification, redistribution, attribution, and licensing of the combined work. Until then, textStep is a mechanics reference and Flux uses an independent implementation. If direct reuse begins, record the exact upstream commit, files, modifications, and attribution before publication. See [`REFERENCE-STUDY-TEXTSTEP.md`](REFERENCE-STUDY-TEXTSTEP.md).

Primary references: [GNU licenses](https://www.gnu.org/licenses/),
[AGPL-3.0 text](https://www.gnu.org/licenses/agpl-3.0.html), and
[Creative Commons software guidance](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software).
