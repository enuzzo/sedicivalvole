# Project Instructions for Agents

These rules apply to every change in the `sedicivalvole` project.

## Language

- Write all source code, code comments, documentation, commit-ready text, logs, and product interface copy in English.
- Italian is reserved for direct conversation between the user and the assistant.

## Versioning and traceability

- `VERSION` is the only SemVer source of truth. Do not duplicate the number manually; builds must read or receive it through a verified pipeline.
- Update `CHANGELOG.md` for every user-visible change or relevant technical change.
- Keep unreleased changes under `Unreleased`; create a versioned ISO-dated section only when releasing, and synchronize `VERSION`.
- Update the README, feature status, and architecture when facts change.
- Use only real, verified screenshots from the current build at agreed Tesla viewports. Remove obsolete captures.
- Create small, verified commits frequently during active development. Push each verified checkpoint when a configured remote exists; never invent or configure a remote without the user's destination.
- After each user-approved product change, deploy the verified build to the canonical live root and validate the product-visible result.
- If the active context becomes unreliable or overloaded, first inventory every pending requirement and local change, write a concrete task list, and hand the work to a fresh session at an appropriate reasoning effort without leaving the Dropbox project directory.

## Secrets and local material

- Never read, print, diff, log, or version `.env` or local variants.
- Never place credentials in command lines, logs, screenshots, or documentation.
- Never version `_references/` or copy its external material into the repository.
- `.env.example` may contain only keys and harmless placeholders.

## Product and validation

- Separate implemented features, roadmap items, assumptions, and verified facts.
- Never present archived mocks or prototypes as the current product.
- Before a visual build, show exactly three directions and wait for a selection.
- Verify the experience at agreed Tesla viewports and on the target vehicle.
- During active development, deploy each user-approved product change to the canonical root at `https://sedicivalvole.app/`; the product remains experimental even though the source repository is public.
- An upload is not a successful deployment: verify the canonical URL, HTML, assets, version, and cache behavior after every publication.
- Keep the technical diagnostics accessible from within the main product experience.
- Treat `Engine` and `Flux` as equal primary product modes. The active mode must remain clearly identifiable and the mode switch must remain reachable from either experience.
- `Flux` is the current adaptive music and generative-field work. `Engine` is a separate engine-sound experience with its own audio model and instrument-inspired visual language.
- Do not assume Apache, Nginx, or any other server technology without evidence.

## Licensing

- Do not create `LICENSE` until the exact legal owner and the final strategy for code, assets, audio, visuals, attribution, and trademarks are known.
- Record every third-party dependency or asset in `THIRD_PARTY_NOTICES.md` before it enters the product or repository.
- Do not use Creative Commons licenses for software.
