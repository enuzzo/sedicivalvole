# Delivery and verification

Read when preparing a build, checkpoint, release, deployment or Sites handoff. The current task's explicit scope controls which actions are authorized; this reference does not turn an audit/document-only task into product publication.

## Identity and records

VERSION is the only SemVer source. Builds must read/receive it through a verified pipeline, never a manually duplicated number. Every build generates a `YYYYMMDD-HHMM` stamp, records it when publishing and in deployment evidence; it identifies the build but does not replace VERSION. Preserve the pipeline's source-commit identity as well.

For each user-visible or relevant technical change, append to CHANGELOG.md with date, local time (`YYYY-MM-DD HH:MM`), corresponding short hash (`[commit]`) and deployment build stamp when applicable. Keep Unreleased entries in progressive chronological order; only create a versioned ISO-dated section on release and synchronize VERSION. Never rewrite/remove past entries, even false claims: append a correction. Update README, feature status and architecture when facts change, above the README's final community credits. Relevant contract changes update their active agent reference, not a growing owner diary in root AGENTS.

Create small verified commits during active development and push each checkpoint when a configured remote exists; do not invent/configure a remote without the owner's destination. Preserve unrelated local work and coordinate the sole writer. Explicit task restrictions can withhold Git/release actions; do not convert a one-task restriction into a permanent ban.

## Verification proportional to the change

Choose checks that establish the requested behavior and its risk. Run meaningful affected tests and required invariant gates, fixing attributable failures; broaden or repeat only for a new change, failure or unresolved concern. Do not add tests that merely mirror a low-impact edit. Before publishing a changed application, preserve the existing functional/regression, production-package and relevant visual/source gates; a small edit alone is not a reason to repeat a whole app suite during a documentation task.

Set `SEDICIVALVOLE_NO_LOCAL_ENV=1` for credential-free QA/builds: both Vite configurations then disable local environment-file loading; public API fixtures can supply test catalogues. This does not change the official deploy script or its sole internal-loading exception.

Use the existing native wrappers and package scripts under `prototype/drive-lab`; environment mismatches follow [Environment portability](motion-runtime.md#environment-portability). For a requested runnable visual result, start/open the available local preview yourself and inspect the real user path. Use current build screenshots at agreed Tesla viewports (`773 x 601` is the compact reference), including relevant responsive, lifecycle, reduced-motion and input states. For source-fidelity changes compare source/candidate at the same viewport. For native/media behavior use actual handler invocation/outcome and source-specific integrity checks. Never weaken upstream gates to pass.

Report implemented, tested, committed/pushed, live, owner-accepted and physical-device-accepted separately. Browser rendering, headless-muted audio, signal measurements and a successful build do not prove cabin listening, physical iPhone touch, Tesla native media, reception or sustained GPU/endurance performance. Record device/software/build for physical evidence. Existing broad owner acceptance of Flux/Soundtrack/FX/interface/Discover does not require another generic acceptance round; later changes retain their relevant specific gates.

## Canonical publication

Standing owner authorization (September 5) permits prompt deployment within agreed work to **https://sedicivalvole.app/** without a fresh confirmation. Product remains experimental despite the public repository. Keep traceable Git/build identity, relevant checks, backups/history and canonical verification; use a focused fix or rollback when needed. This supersedes older fresh-deploy-approval clauses, not privacy, licensing, selection or tool permission boundaries.

The sole `.env` exception permits the official `scripts/deploy_drive_lab_ftp.py` to load it internally for preflight/publication/postflight. Never inspect, print, diff, copy, log or version contents or put credentials in commands. Do not ask again for this same internal-loading permission in ordinary authorized deployment.

Before publication read **[DEPLOY / Gate for every development deployment](../DEPLOY.md#gate-for-every-development-deployment)** and **[Security limit](../DEPLOY.md#security-limit)**. Use the official fail-closed script; confirm protocol/account/exact path through its safe gates. Choose `--verify-only` for read-only preflight/postflight, or authorized `--publish`; use `--preserve-existing` with publication when legacy deletion is not authorized. Check its current arguments without exposing secrets. Do not invent server technology or bypass provider cache controls.

Upload/hash-verify complete assets, audio, fonts, third-party trees and API files before activating the generated entry. JUNCTION/NIGHTSHIFT banks with an exact verified remote hash are reused; changed banks are uploaded to a temporary name, hash-verified and renamed before activation. An interrupted bank stage must preserve the active bytes. The narrowly scoped `--repair-nightshift` mode accepts only a truncated prefix of the pinned September 11 bank and runs full verification before returning; it never activates a release. Preserve previous content-addressed assets during cache overlap and generations used by open clients. Entry rename does not make mutable bank/API updates whole-release atomic: retain compatibility or use addressed versions for incompatible changes. Do not silently change protocol. Plain FTP's recorded security limit is not proof FTPS/SFTP is available.

An upload is not success. Verify bare canonical and cache-busted URL, HTTP status, HTML/current version/source/build, referenced assets and local/live size/SHA-256, cache behavior on controlled reload and actual product-visible behavior. Cache-busted success alone is insufficient if bare root is stale. Run community credits `--check` before publishing. Remote reuse is valid only with the official identity checks; do not waive complete verification. Technical QA must not send synthetic mail to the real destination.

## Sites package

The canonical product uses the existing deployment above; Sites is a separate supported handoff. Preserve `prototype/drive-lab/.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs` and `tests/sites-worker.test.mjs`. Before a **requested Sites handoff**, run `npm run build` and `npm run test:sites` from Drive Lab (through the appropriate native wrapper when needed). Expected outputs are `dist/client/index.html`, `dist/server/index.js` and `dist/.openai/hosting.json`. Use installed Sites instructions for an actual Sites task. This package capability does not authorize a different live destination.
