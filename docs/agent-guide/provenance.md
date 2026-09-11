# Licensing and source provenance

Read this for new/replaced/retired sources, assets, dependencies, licensing, credits or source publication. Ordinary original-code fixes need only their existing source-specific boundary. This file routes maintained instructions; exact inventories remain in the licensing documents.

## Original material

Original code/documentation default to `PolyForm-Noncommercial-1.0.0`: source-visible noncommercial software, **not open source**. Original brand, screenshots, audio and standalone visual/media assets are excluded unless specifically licensed. Earlier public AGPL distributions retain their rights. `enuzzo` is the sole original creator/public licensor; do not invent a studio, company or legal entity. Third-party ownership remains exactly as recorded. Never use Creative Commons licenses for software.

Keep LICENSE, LICENSE-SCOPE.md, NOTICE, README licensing copy, package metadata and [licensing decision log](../LICENSING.md) synchronized when facts change. Historical references describing original work as AGPL/MIT do not relicense the current product. See [Active split](../LICENSING.md#active-split) for scope; preserve material-specific rights.

## Third-party admission

Before a dependency or asset enters the product/repository, record it in `THIRD_PARTY_NOTICES.md`: real author/project, exact source/version/hash, what is used, modifications, license and exclusions. Do not infer media rights from a software license. Keep credentials/private grants out of public files; `_references/` and external material there remain unversioned and cannot be copied wholesale into the repository. Inspect private reference material only for an authorized source/analysis task; publication requires the applicable rights and admission boundary.

For pinned renderer work read the exact [Visuals](visuals.md) section; for the declared-MIT Engine/WAV exception read [Engine source](engine.md#accepted-source-and-voices). Upstream source/hash tests must not be weakened to bypass restrictions. For streaming and Illobo grants read [Soundtrack policy](../SOUNDTRACK-SOURCE-POLICY.md#capability-contract), then its relevant provider section. Geographic providers, shape/artwork and terrain have independent data/media attribution; read [Air Atlas source attribution](../AIR-ATLAS-2026-09-09.md#sources-and-attribution) and corresponding THIRD_PARTY_NOTICES entries when modifying them.

## Community credits

When a source is added, replaced or retired, update README, THIRD_PARTY_NOTICES and `docs/COMMUNITY-THANKS.md` together. Record named authors/projects, exact repositories and articles/demos/material/service use, public contact routes and a warm personalized **unsent** release thank-you draft. Distinguish shipped integrations, services, development tools and studies. Never infer private contacts or send a message without explicit sending authorization.

All community entries remain in the **final README section**, including minor/transitive dependencies and sources without repositories, each with a restrained relevant emoji. Put later product updates **above** `COMMUNITY-CREDITS:START`. After lockfile changes refresh the npm inventory with `python3 scripts/readme_dependency_credits.py --refresh`; before publication run `--check`. That automated check does not replace authorship/non-npm review. Never describe this PolyForm project as MIT/open source in public thanks.
