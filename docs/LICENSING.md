# Licensing Decision Log

Status: **provisional recommendation, ready but not finalized**. This is not legal advice. Do not create `LICENSE` until the exact copyright and trademark owner is known; never publish a placeholder owner.

## Provisional split

| Scope | Proposed treatment |
|---|---|
| Source code, shaders, CSS, build configuration | GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`) |
| Name `sedicivalvole`, future logo, brand assets, screenshots, original audio | excluded from the AGPL grant; All Rights Reserved; no trademark license |
| Third-party material and samples | original licenses preserved and recorded in `THIRD_PARTY_NOTICES.md` before use |
| Selected shareable creative assets | optional separate media license, decided per file |

Creative Commons may be considered for media, not software. See [`BRAND-ASSET-POLICY.md`](BRAND-ASSET-POLICY.md).

## What AGPL does and does not do

- It allows copying, forks, modification, rebranding, sale, and commercial use; it does not prevent cloning.
- It requires preservation of notices, identification of modifications, and corresponding source under the license.
- A modified version used to provide network service must offer corresponding source to remote users.
- Code-based shaders and generative visuals remain commercially reusable under AGPL terms.
- Preventing commercial reuse would require a different source-available/commercial strategy, not this open-source proposal.

MIT and Apache are too permissive for the user's stated copyleft goal. GPL does not address network-only modified services in the same way as AGPL. None of these licenses alone protects the project name, brand, or recognizable assets.

## Open legal gates

1. identify the exact legal copyright and trademark owner;
2. obtain legal review of the mixed code/asset policy;
3. decide contributor policy and whether a CLA is needed;
4. establish trademark and brand-usage rules;
5. verify provenance and licenses for every audio sample and external asset;
6. ensure README and distribution copy do not claim restrictions AGPL does not grant.

Primary references: [GNU licenses](https://www.gnu.org/licenses/), [AGPL-3.0 text](https://www.gnu.org/licenses/agpl-3.0.html), and [Creative Commons software guidance](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software).
