# License Migration Audit — 2026-08-30

Status: **implemented for original sedicivalvole material; legal review still
advisable**.

## Decision

The product owner selected a source-visible noncommercial policy. Original
sedicivalvole software and documentation first distributed under this policy
use `PolyForm-Noncommercial-1.0.0`. The project must not describe that material
as open source, because commercial use is not granted.

This migration is prospective. Public copies already distributed under
`AGPL-3.0-or-later` remain available under those terms. Recreating the GitHub
repository would not revoke an earlier recipient's rights and would destroy
useful provenance, so the repository and history are retained.

## Operative synchronization

The following surfaces change together:

- root `LICENSE`: unmodified PolyForm Noncommercial 1.0.0 text;
- `LICENSE-SCOPE.md`: ownership and material boundaries;
- `NOTICE`: required enuzzo notice and third-party exceptions;
- `README.md` and in-product diagnostic README: source-visible noncommercial
  wording, with no open-source claim;
- `prototype/drive-lab/package.json` and lockfile: SPDX identifier
  `PolyForm-Noncommercial-1.0.0`;
- `docs/LICENSING.md`, product specification, brand policy, and agent rules.

## File-family audit

| Material | Current treatment | Why |
|---|---|---|
| Original application, tests, CSS, build/deploy code, direct WebGL renderers, bridges, and documentation | PolyForm Noncommercial 1.0.0 | Original enuzzo material; commercial use is not granted |
| Original brand, screenshots, audio, encoded scores, and standalone media | Reserved unless specifically marked | Software licence is not used as a blanket media grant |
| textStep translations listed in `THIRD_PARTY_NOTICES.md` | GNU GPL v2.0 plus Lobo's direct unrestricted authorization; not relicensed | Direct authorization is the recorded basis for the mixed integration |
| Drivey manifest-listed vendor snapshot | Supplied GPLv3 text, preserved older conflicting header, and bundled MIT notices | Byte-identical third-party material; project policy cannot rewrite it |
| VERTIGO/Infinite Lights vendor snapshot | Custom Codrops notice plus bundled Three.js/postprocessing licences | Separately licensed immutable vendor material |
| PRTCL formula adaptations | Recorded direct reuse/modification authorization; original renderer/lifecycle under PolyForm | No broader licence is inferred for excluded PRTCL material |
| React, Vite, MapLibre, QR, fonts, icons, data, and services | Their individual notices and terms | Case-by-case admission remains mandatory |
| MusicRadar source samples | Ignored and not redistributed | Rights holder permits use in music, not redistribution of the packs |
| `_references/` | Outside Git and every repository grant | Local evidence and source material only |

## Non-negotiable follow-up rules

1. Never apply `PolyForm-Noncommercial-1.0.0` to a third-party file merely
   because it lives in this repository.
2. Every new dependency, source, formula, service, asset, and media item enters
   `THIRD_PARTY_NOTICES.md` before product admission.
3. A GPL or custom-licensed component must remain structurally and textually
   identifiable; direct permissions must retain their provenance.
4. External contributions require a contributor agreement compatible with the
   mixed policy before acceptance.
5. Commercial permission for original sedicivalvole material requires a
   separate written grant from the relevant rights holder.

## Primary references

- <https://polyformproject.org/licenses/noncommercial/1.0.0>
- <https://spdx.org/licenses/PolyForm-Noncommercial-1.0.0.html>
- <https://opensource.org/osd>
- <https://www.gnu.org/licenses/gpl-faq.html>

This is a technical licensing inventory, not legal advice.
