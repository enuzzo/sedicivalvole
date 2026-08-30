# Licensing Decision Log

Status: **active mixed noncommercial policy**. Original sedicivalvole software
and documentation first distributed under the current policy use
`PolyForm-Noncommercial-1.0.0`; reserved media and third-party material remain
outside that default. The project's sole original creator and public licensor
identity is `enuzzo`; the final brand policy remains open and requires legal
review. This document is not legal advice.

The operative files are the root [`LICENSE`](../LICENSE),
[`LICENSE-SCOPE.md`](../LICENSE-SCOPE.md), and [`NOTICE`](../NOTICE).

## Active split

| Scope | Current treatment |
|---|---|
| Original source code, tests, shader source, CSS, build/deployment configuration, project documentation | PolyForm Noncommercial License 1.0.0 (`PolyForm-Noncommercial-1.0.0`) |
| Name `sedicivalvole`, future logo and marks, brand assets, screenshots, original audio, standalone visual/media assets | excluded from the PolyForm grant; All Rights Reserved by the respective rights holders; no trademark licence |
| Third-party material and samples | original licences or direct permissions preserved and recorded in `THIRD_PARTY_NOTICES.md` before use |
| Selected shareable creative assets | optional separate media license, decided and marked per file |

Creative Commons may be considered for media, not software. See
[`BRAND-ASSET-POLICY.md`](BRAND-ASSET-POLICY.md).

## What the current policy does and does not do

- PolyForm Noncommercial permits use, modification, and redistribution for the
  noncommercial purposes defined in its text; it does not grant commercial use.
- The repository is source-visible but is not described as open source, because
  the Open Source Definition requires commercial use to be permitted.
- Each recipient must receive the PolyForm terms or their URL and every
  `Required Notice:` line supplied with the software.
- Third-party GPL, MIT, BSD, custom, font, service, and direct-permission terms
  remain independent. A repository-level noncommercial label cannot narrow or
  replace rights granted by those parties.
- Previously distributed AGPL versions remain usable under AGPL. Removing or
  rebuilding Git history would not revoke those existing grants.
- No software licence alone protects the project name, brand, or recognizable
  media assets; those remain separately reserved unless marked otherwise.

## Ownership notice

The current notice uses `enuzzo`, the sole original project creator and public
licensor identity. It does not imply a studio, company, or other legal entity.
Third-party authors and rights holders retain the ownership, licences, and
credits recorded in `THIRD_PARTY_NOTICES.md`.

## 2026-08-30 — original project material moves to PolyForm Noncommercial

The product owner selected the source-visible noncommercial option after
confirming that commercial reuse conflicts with the project's purpose. The root
licence, scope, notice, package metadata, product copy, README, specification,
and this log were synchronized. Original sedicivalvole material now defaults to
`PolyForm-Noncommercial-1.0.0`; the project is no longer described as open
source.

This decision is prospective. Public commits already distributed under AGPL
retain their earlier licence. Third-party material is handled case by case:
Drivey remains GPLv3 plus its preserved historical header, textStep-derived code
remains GPLv2 plus Lobo's direct authorization, the VERTIGO vendor snapshot
retains its custom notice and bundled licences, and reserved audio/media remain
outside the software grant. This avoids both false revocation claims and a
blanket noncommercial assertion over rights enuzzo does not own.

## 2026-08-30 — selected 16 Road identity remains reserved brand material

The owner-selected 16 Road logo and every derivative in `logo/` are original
reserved brand assets outside the PolyForm software/documentation grant. No
trademark licence is granted by their source visibility. The numeral uses
vector outlines derived from the locally packaged Orbitron variable font at
weight 750; Orbitron remains governed by SIL Open Font License 1.1 and is
credited in `THIRD_PARTY_NOTICES.md`. Converting the two glyphs to outlines
removes a runtime font dependency but does not erase the font's licence or
credit. Browser favicon, touch-icon, and product-icon copies share the same
reserved-brand scope.

## 2026-08-30 — SOUNDTRACK admission fails closed by capability

The first SOUNDTRACK source-policy module separates permission to appear in the
catalogue, stream from the source, enter the effects path, and host a copy. Each
decision is `allow`, `deny`, or `unknown`; unknown never becomes permission by
inference. Jamendo records require complete credit metadata, provider-owned
HTTPS playback and content URLs, and a recognized Creative Commons identifier.
The normalized record intentionally discards every download URL and flag.

For this noncommercial project, CC BY, BY-SA, BY-NC, and BY-NC-SA preserve their
attribution, noncommercial, and share-alike obligations as data. The stricter
owner decision excludes BY-ND and BY-NC-ND recordings entirely instead of
building an unprocessed-playback exception. Direct grants require a stable
evidence reference and an explicit decision for every capability. This is only
the admission foundation: no Jamendo catalogue, audio, credential, asset, or
player has entered the production application. The complete contract and dated
primary sources are recorded in
[`SOUNDTRACK-SOURCE-POLICY.md`](SOUNDTRACK-SOURCE-POLICY.md).

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
Primordial clean-room boundaries described there were later narrowed again for
PRTCL as recorded immediately below. InfiniteTubes and Primordial remain
clean-room studies.

## 2026-08-29 — PRTCL formula adaptations directly authorized

The PRTCL checkout at commit
`2a22f33b975e2c40b7ee0bdd2d1acb4cee4f5060` has no `LICENSE` file despite an
MIT statement in its README, so that statement is not used as the operative
grant. The repository owner directly authorized reuse and modification for this
work. Sedici Valvole therefore adapts only the selected Fractal Frequency,
Murmuration, and Axiom formulas into its own bounded WebGL2 renderer. The PRTCL
runtime, original preset files, UI, dependencies, fonts, screenshots, brand
assets, and other effects remain excluded. The project-authored renderer and
authorized adaptations are published under the project AGPL grant; no broader
licence or ownership conclusion is inferred for PRTCL.

## 2026-08-29 — external visual studies use project-authored implementations

Drivey, PRTCL, InfiniteTubes, and CodePen `NXGbBo` were initially admitted as
visual studies only. No upstream code, shader text, runtime, texture, model,
font, screenshot, or other asset entered that clean-room implementation plan.
The later Drivey and PRTCL decisions above supersede their respective parts of
this historical boundary; InfiniteTubes and Primordial retain it.

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

Primary references: [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0),
[SPDX licence identifier](https://spdx.org/licenses/PolyForm-Noncommercial-1.0.0.html),
[GNU licenses](https://www.gnu.org/licenses/), and
[Creative Commons software guidance](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software).
