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

## 2026-08-29 — source-faithful Drivey supersedes the clean-room decision

The product owner rejected the initial project-authored Drivey translation and
selected the actual Rezmason runtime instead. DRIVEY now includes the 51 files
required by the modern runtime at commit
`5104cdade2a3158786b05b9b0680a50e942830cf`, protected byte-for-byte by a
SHA-256 manifest. The upstream repository supplies a GNU GPL version 3 licence;
the unchanged 2018 `js/Drivey.js` header nevertheless retains older non-profit
and GPL-under-consideration language. Both facts are preserved, and upstream
clarification remains advisable where commercial status is material.

The import excludes `legacy/`, `readme_assets/`, screenshots and unnecessary
media. Bundled three.js r115, expr-eval 2.0.2, and Hundred Rabbits Themes retain
their MIT notices. The manifest-listed runtime is not relicensed under the
project's AGPL grant; the independently authored sedicivalvole iframe shell,
parent bridge, integration record and integrity tooling remain
`AGPL-3.0-or-later`. The following section remains as the historical decision
that this source-faithful integration superseded; the PRTCL, InfiniteTubes, and
Primordial clean-room boundaries remain active.

## 2026-08-29 — external visual studies use project-authored implementations

Drivey, PRTCL, InfiniteTubes, and CodePen `NXGbBo` were admitted as visual
studies only. No upstream code, shader text, runtime, texture, model, font,
screenshot, or other asset enters the repository or build. The resulting road,
particle, tunnel, and fluid renderers are original sedicivalvole work under
`AGPL-3.0-or-later`.

This decision avoids relying on ambiguous asset scope in Drivey, PRTCL's
missing `LICENSE` file despite its README claim, InfiniteTubes' restricted
as-is distribution terms and unidentified Star Wars texture, and the separately
attributed noise fragment embedded in the otherwise MIT-default CodePen. It
does not erase the references: `THIRD_PARTY_NOTICES.md` retains credit and
`SOURCE-ADMISSION-2026-08-29.md` records exact identities, evidence, selected
mechanics, and excluded material.

## 2026-08-27 — textStep code integrated, and the sample-library decision

Two facts changed on this date and are recorded here because both alter what the
operative licence files must say.

**textStep code is now in the product.** `prototype/drive-lab/src/score/`
contains the sequencer clock, the step encoding and the drum, synth and bus DSP
translated from textStep at commit `cb107d198b730db60cff4a87c7fd5b8d1fae3fb2`.
Until this date the notices stated that no textStep source had entered the
product, which was true and is no longer. `NOTICE`, `LICENSE-SCOPE.md` and
`THIRD_PARTY_NOTICES.md` were corrected together, and the last of these now
carries the per-file provenance the earlier notice required before publication.

The dependency worth restating: upstream is GNU GPL v2.0, which alone would not
permit combination with `AGPL-3.0-or-later` material. The combination rests on
Lobo's direct, unrestricted authorization, accepted by the maintainer. That
authorization is load-bearing and must survive every future edit of these files.

**Sample libraries are reference material, and what ships is our own music.**
The two MusicRadar SampleRadar packs in `_references/audio/samples/` state:
"Because they're royalty-free, you're welcome to use the samples in your music
in any way you like — all we ask is that you don't re-distribute them."

Use in music, including commercially, is granted. Redistribution is refused by
the rights holder, and an exclusion or exception in this project's own licensing
cannot grant a right the project does not hold — `LICENSE-SCOPE.md` governs how
our licence applies to what we include, not what others permit us to include.

The decision: the packs stay git-ignored, they are used to compose the project's
own music, and where a score needs pre-rendered audio the build renders
sedicivalvole's own arrangement into sedicivalvole stems. Individual loops are
never served. This is not a Git question — serving the loops as separate assets
would publish the pack to anyone who opened a network inspector, committed or
not — and it is the reason the technical design bounces stems rather than
shipping a loop player.

## Open legal work

1. identify the exact legal copyright and trademark owner;
2. obtain legal review of the mixed code/asset policy;
3. decide contributor policy and whether a CLA is needed;
4. establish final trademark and brand-usage rules;
5. verify provenance and licenses for every audio sample and external asset
   (the MusicRadar packs are recorded above; anything new needs the same);
6. decide whether any original media will receive a separate license; and
7. add SPDX headers to source files as the codebase matures.

## textStep authorization and attribution

[textStep](https://github.com/illobo/textStep) was conceived and created by
[Lobo (`illobo`)](https://github.com/illobo). Its sequencer, synthesizer, DSP,
scene, and performance architecture is his original work and informs the
planned Flux sequencer direction.

The ignored study copy is publicly licensed under GNU GPL version 2.0. The
project maintainer confirms that Lobo also granted direct, unrestricted
authorization to reuse the repository's content and accepts responsibility for
that provenance statement. The project treats this authorization as sufficient
for copying, adapting, integrating, and publishing derived textStep code in
sedicivalvole; no additional written-evidence gate applies. Direct reuse must
still record the exact upstream commit, imported files, modifications, public
license, and Lobo attribution before publication. See
[`REFERENCE-STUDY-TEXTSTEP.md`](REFERENCE-STUDY-TEXTSTEP.md).

Primary references: [GNU licenses](https://www.gnu.org/licenses/),
[AGPL-3.0 text](https://www.gnu.org/licenses/agpl-3.0.html), and
[Creative Commons software guidance](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software).
