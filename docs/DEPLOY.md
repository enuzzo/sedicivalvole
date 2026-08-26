# Deployment

## Current verified state

- provider reported by the user: **SiteGround**;
- configured protocol: **passive FTP on port 21**;
- FTP account home contains `sedicivalvole.app/public_html`;
- configured web root: `sedicivalvole.app/public_html`;
- canonical development URL: [https://sedicivalvole.app/](https://sedicivalvole.app/);
- the previous wrong FTP-home diagnostics tree was removed after exact-name validation and explicit authorization;
- the canonical root now hosts the current Drive Lab build.

## Canonical-root deployment evidence — 2026-08-26

- read-only remote identity gate: **PASS** for the SiteGround placeholder and every legacy build file;
- upload: **PASS**, 4 files, 1,916,503 bytes;
- exact cleanup: **PASS**, 5 files and 3 directories removed;
- root remote listing after publication: 2 entries (`index.html` and `assets/`);
- canonical URL: **HTTP 200**;
- obsolete `/diagnostics/drive-lab/`: **HTTP 404**;
- HTML, JavaScript, CSS, and image: local/live byte counts and SHA-256 hashes all identical;
- selected-browser smoke test: Signal Gate splash, `PLAY THE ROAD`, GPS permission state, audio/visual controls, and integrated report all rendered in English;
- observed HTTP edge header: `server: nginx`; this identifies the responding edge but does not prove the provider's full origin topology.

## Modular Aperture publication evidence — 2026-08-26

- target commit: `487f9ee` plus the deployment-safety follow-up documented below;
- read-only FTP identity gate: **PASS**, 3 recognized canonical-root entries;
- non-destructive upload: **PASS**, 5 files, 247,235 bytes;
- cleanup: **SKIPPED** with `--preserve-existing`; previous assets retained for cache overlap;
- cache-busted HTML and new JavaScript/CSS: **HTTP 200** and byte-identical local/live SHA-256 hashes;
- new JavaScript: `index-B5aZa7cA.js`, 229,774 bytes, SHA-256 `04505443b6b2cb9d17034b30ec09ad082c74e8dd6a91b5e5e5cf4680e4c30e15`;
- new CSS: `index-DlWvHqKL.css`, 11,743 bytes, SHA-256 `492e30abcb5e19e06209b81f3b9ae3f45d47db731a2c89b2bc0a7c7961532ef3`;
- cache-busted HTML: 655 bytes, SHA-256 `a3b80cf30a6d4ccae696953ac5ee2c6e014fb984af4f7d1054b4c22d5268eec0`;
- canonical bare `/`: **FAIL / stale** after two checks, still 587 bytes and still referencing `index-CKjMDFcj.js` plus `index-BbWXMXk1.css`;
- cache-busted `/` and direct `/index.php`: current build; bare-root convergence or an authorized provider cache flush is still required before this publication can be called a successful canonical deployment.

## Split-view diagnostics deployment evidence — 2026-08-26

- commit deployed: `fb2e8d1`;
- read-only remote identity gate: **PASS**, including the existing diagnostic API identity rule;
- upload: **PASS**, 5 files, 1,931,920 bytes;
- canonical root listing: 3 entries (`index.html`, `assets/`, and `api/`);
- cache-busted HTML, JavaScript, CSS, and image: **HTTP 200** with byte-identical local/live SHA-256 hashes;
- selected-browser responsive check: **PASS** at the photographed Tesla split viewport `773 × 601`;
- compact top-bar `DIAG`, full-width scrollable report, and sticky `SEND DIAGNOSTIC` action: **PASS**;
- live endpoint rejection checks: wrong method `405`, foreign origin `403`, coordinate field `422`;
- one authorized live diagnostic: **202 / accepted by the server mail transport**;
- Gmail inbox delivery remains user-confirmed evidence and is not implied by PHP mail handoff.

## Extended diagnostics v3 publication evidence — 2026-08-26

- deployed commits: `d261b57` and `8c5da9d`;
- build/test gate: **PASS**, 11 unit tests, 4 packaging tests, production build, PHP syntax, and diff check;
- read-only FTP identity gate: **PASS**, including the previous v2 endpoint and private recipient structure;
- non-destructive upload: **PASS**, 5 files, 255,482 bytes; no legacy cleanup;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `2ca6f6e9b4f3019304d1b22c2c423105de8ff053f14a9681ab12908d9cb91316`, byte-identical to local;
- JavaScript: `index-Qo4012ws.js`, 237,965 bytes, SHA-256 `65c2dee70d131ee22eafb02a8c773e2eaf45b08156ef375094345c40a5af0739`, byte-identical local/live;
- CSS: `index-DlWvHqKL.css`, 11,743 bytes, SHA-256 `492e30abcb5e19e06209b81f3b9ae3f45d47db731a2c89b2bc0a7c7961532ef3`, byte-identical local/live;
- live v3 endpoint checks: wrong method `405`, foreign origin `403`, abbreviated coordinate key `422`, and legacy v2 schema `422`;
- live selected-browser QA at `773 × 601`: **PASS** for WebGL2, Web Audio, v3 JSON, frame/RTT cards, scrollable report, and Demo response;
- one user-authorized live v3 report: **202 / accepted by the server mail transport**; Gmail inbox delivery remains pending user confirmation;
- built-in version reported by the live v3 report: `0.0.0`, matching `VERSION`;
- canonical bare `/`: **FAIL / provider cache still stale**, 587 bytes, SHA-256 `0407fb0914ab6d11655184a54e6ace05523b0ec4d081d8543fc3727de9b57150`, still referencing `index-CKjMDFcj.js` and `index-BbWXMXk1.css`;
- this upload is therefore not recorded as a successful canonical deployment until the provider cache is flushed and bare `/` converges.

## Dark Aperture and resting-chrome publication evidence — 2026-08-26

- deployed commits: `32c9a1d` and `8f70752`;
- build/test gate: **PASS**, 11 unit tests, 4 packaging tests, production build, rendered QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 256,526 bytes; read-only remote identity passed and legacy cleanup was skipped;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `0773edc78f40d22e4e381372084eb4827a7fe43972fa18cd0932d7312e12d15a`, byte-identical local/live;
- JavaScript: `index-D7jQ9Ez8.js`, 238,300 bytes, SHA-256 `3293dff33b5889a329ba8a5527ca6d2bcec6c2e7f3eb5e6e8a836ee472079241`, byte-identical local/live;
- CSS: `index-DhSenu4k.css`, 12,452 bytes, SHA-256 `e76f1af600812f20a122b63586dcd4e32e79a99fa951a78c7f74c095e3d96a89`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the dark terminal void, full off-canvas header/footer, persistent speed-only state, control wake, diagnostics access, and zero relevant console warnings/errors;
- canonical bare `/`: **FAIL / provider cache still stale**, still returning the prior 587-byte `x-proxy-cache: HIT` body and old assets;
- publication is available through the cache-busted root and direct PHP entry, but canonical deployment completion remains pending the SiteGround cache flush.

## Forward Flux motion publication evidence — 2026-08-26

- deployed commits: `5420a3f` and `bead2d7`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, rendered comparison, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 258,113 bytes; read-only remote identity passed and legacy cleanup was skipped;
- cache-busted HTML and direct `/index.php`: 655 bytes, SHA-256 `c88ab460a6c1e4841dc893a01e2e34ffcb150fda5b22250032c2f04f7abf9d40`, byte-identical local/live;
- JavaScript: `index-D_ERyfCr.js`, 239,792 bytes, SHA-256 `6fcf717335b7be9ef17fdde639835f2455649a9f2482937f74f800a5d7622684`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for forward tunnel response, Demo acceleration, opaque speed frame, diagnostics reachability, and zero relevant console warnings/errors;
- canonical bare `/`: **FAIL / provider cache still stale**, returning the prior 587-byte body, SHA-256 `0407fb0914ab6d11655184a54e6ace05523b0ec4d081d8543fc3727de9b57150`, with `x-proxy-cache: HIT` and the old asset pair;
- publication is verified through `/?qa=bead2d7-forward-motion` and direct `/index.php`, but canonical deployment completion remains pending the SiteGround cache flush.

## Canonical cache convergence — 2026-08-26

- user action: disabled SiteGround NGINX delivery caching and completed the provider cache flush;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `c88ab460a6c1e4841dc893a01e2e34ffcb150fda5b22250032c2f04f7abf9d40`, byte-identical local/live;
- canonical asset references: `index-D_ERyfCr.js` and `index-CjkHLkpC.css`, matching the verified Forward Flux build;
- the canonical deployment is now complete; the earlier stale-root entries above remain as historical evidence of the provider-cache incident.

## Flat-grid and Plaid velocity publication evidence — 2026-08-26

- deployed commits: `649216a` and `06350df`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, rendered flat/153 km/h QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 259,397 bytes; read-only remote identity passed and legacy cleanup was skipped;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and the current no-store PHP entry;
- canonical HTML: 655 bytes, SHA-256 `43e2e79682ead51d5a406c29ef071bc4a6fce6edf91deb05aa549e5abc2c2666`, byte-identical local/live;
- JavaScript: `index-CyTY513x.js`, 241,076 bytes, SHA-256 `8a294a2f9f3f4d7fa621cf8772baed4431a3bd9368d8233a67b62730246da46b`, byte-identical local/live;
- CSS remains `index-CjkHLkpC.css`; the canonical HTML references the verified current JavaScript and CSS pair;
- live selected-browser smoke test at `773 × 601`: **PASS** for canonical-root load, WebGL rendering, Demo response, speed frame, and zero relevant console warnings/errors.

## Swiss score-field publication evidence — 2026-08-26

- deployed commits: `428a3cd` and `b910160`;
- build/test gate: **PASS**, 14 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, rendered zero/transition/Plaid QA, clean browser console, and diff check;
- non-destructive upload: **PASS**, 5 files, 260,031 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `e1cb2c0585ea410c0546e4c066e1b0af360156abe6310fd26e1830f7068bffdf`, byte-identical local/live;
- JavaScript: `index-C6Cl7Zl6.js`, 241,710 bytes, SHA-256 `7dab8371e82193bb1767338eafe07df5ffb457def62e31dded86e2afd69e9e14`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the ordered zero-speed field, off-canvas resting chrome, persistent speed frame, integrated diagnostics after the wake gesture, and zero relevant console warnings/errors;
- live report version: `0.0.0`, matching `VERSION`.

## Continuous Flux morph publication evidence — 2026-08-26

- deployed commits: `1d11b2b` and `95508b5`;
- build/test gate: **PASS**, 15 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered acceleration/deceleration QA at `773 × 601`;
- deterministic rendered path: **PASS** for large complete squares at rest, smaller planar squares at city speed, one continuously warped transition field, a full high-speed tunnel, and the same geometric sequence in reverse during deceleration;
- non-destructive upload: **PASS**, 5 files, 259,637 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `b9e843e400e991804b7f03a1e3823fa4a704c154234fa5d1f1d6106b6330bfb6`, byte-identical local/live;
- JavaScript: `index-BKVb6CUR.js`, 241,316 bytes, SHA-256 `255c6f54b0306bfafcf293d52d1b72d8b1dc8ed19a961f8fb773dd60f70ae205`, byte-identical local/live;
- CSS: `index-CjkHLkpC.css`, 12,547 bytes, SHA-256 `c5590d7bbba66609f4157e4f84b8a159f5893feabf663f472928cd4318509520`, byte-identical local/live and safely served from its content-addressed cache;
- live selected-browser load at `773 × 601`: **PASS** for the canonical app shell, current controls, WebGL field, and version `0.0.0`; the complete morph path is additionally proven against the byte-identical production bundle in local rendered QA.

## Integrated speed-frame publication evidence — 2026-08-26

- deployed commits: `b5d16ec` and `04484e4`;
- build/test gate: **PASS**, 15 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered expanded/resting chrome QA at `773 × 601`;
- non-destructive upload: **PASS**, 5 files, 260,248 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `dae6ddec7adfe85d632c2064af7c5d2d7d938a87c59ac754db97f8043abcd720`, byte-identical local/live;
- JavaScript: `index-DZYwPj3z.js`, 241,316 bytes, SHA-256 `255c6f54b0306bfafcf293d52d1b72d8b1dc8ed19a961f8fb773dd60f70ae205`, byte-identical local/live;
- CSS: `index-C88ToKHS.css`, 13,158 bytes, SHA-256 `f485d7f445415ada6beca32cadc9917f8d498a4da4edd648bb2aa617c05836eb`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for exact speed-cell alignment in expanded chrome, fixed detached placement with exposed 6 px lower corners, shared framed-control radii, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Continuous square-to-tunnel deformation publication evidence — 2026-08-26

- deployed commits: `fd54616` and `1a6ffef`;
- build/test gate: **PASS**, 16 signal/diagnostic unit tests, 4 packaging tests, production build, accepted-concept comparison, and rendered acceleration/deceleration QA at `773 × 601`;
- deterministic morph path: **PASS** for square modules at 0 km/h, planar compaction through 55 km/h, progressive perspective at 80–90 km/h, a full bar-lined tunnel at 115 km/h, and a return to complete squares at 0 km/h without opacity fades;
- non-destructive upload: **PASS**, 5 files, 260,793 bytes; read-only remote identity passed, legacy cleanup was skipped, and the previous content-addressed asset was retained;
- canonical bare `/`: **PASS**, HTTP 200 with `x-proxy-cache: MISS` and `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `6e788ca3d9baf51fef266819a559d6322dce6108bc76123dc16eea2420dd48e7`, byte-identical local/live;
- JavaScript: `index-BZmTH6LF.js`, 241,861 bytes, SHA-256 `8b0775112d5af8fb4104810e916e9b6c9454bdc99e6511d38aca326c9091902f`, byte-identical local/live;
- CSS: `index-C88ToKHS.css`, 13,158 bytes, SHA-256 `f485d7f445415ada6beca32cadc9917f8d498a4da4edd648bb2aa617c05836eb`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the 0 → 80 → 115 → 0 geometry path, exact square endpoints, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Vertigo environment publication evidence — 2026-08-26

- deployed commit: `98e8729`;
- build/test gate: **PASS**, 18 signal/diagnostic/environment unit tests, 4 packaging tests, production build, source-mechanics comparison, and rendered Tesla-viewport QA;
- non-destructive upload: **PASS**, 5 files, 272,199 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `1210c92f77c3f8b5ba6f93300883f48f389fe86ef2e150fcd0a75495ba203ebe`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-VHgT5Mvz.js`, 253,085 bytes, SHA-256 `5cf1c7ff92947d77057010da9d486db505a79c8f1f21045ed0b09a1a29f88aea`, byte-identical local/live;
- CSS: `index-vRXZAAZt.css`, 13,340 bytes, SHA-256 `8749c63def17e5e80843114f8a31bb14b37b22014a69067da65339b5fc334913`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for Aperture-to-Vertigo switching, one mounted canvas, persistent Vertigo selection, Demo motion through motorway speed, lateral wave/fold rendering, `WebGL2 · Vertigo`, diagnostics reachability, version `0.0.0`, and zero relevant console warnings/errors.

## Fixed road ceiling and refined Vertigo publication evidence — 2026-08-26

- deployed commit: `82cc321`;
- build/test gate: **PASS**, 18 signal/diagnostic/environment unit tests, 4 packaging tests, production build, Interstate 7 side-by-side comparison, and rendered `0`, `39`, and `130 km/h` QA at `773 × 601`;
- non-destructive upload: **PASS**, 5 files, 270,797 bytes; read-only remote identity passed, legacy cleanup was skipped, and two previous content-addressed assets were retained;
- canonical bare `/` and cache-busted root: **PASS**, HTTP 200 with `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`;
- canonical HTML: 655 bytes, SHA-256 `c239547ca819739693be49014daafdeb4a1dc153f80754f5972a6d30c0fa7635`, byte-identical local/live and referencing the current asset pair;
- JavaScript: `index-COO5GWe-.js`, 252,785 bytes, SHA-256 `7a5544bd183255f1a0b8ee428780e486b368fa1a0d3be2f26c7751be423634c5`, byte-identical local/live;
- CSS: `index-DuXc51GK.css`, 12,238 bytes, SHA-256 `72cced49c7497e2aa9e401997c3e11a32b35612c84388e405a029719af62f701`, byte-identical local/live;
- live selected-browser QA at `773 × 601`: **PASS** for the removed threshold control, `VISUAL` selection, truthful textStep score roadmap, unmistakable Aperture tunnel at `39 km/h`, fixed `130 km/h` diagnostic ceiling, `score: prototype`, one WebGL2 canvas, reachable diagnostics, version `0.0.0`, and zero relevant console warnings/errors.

`.env` is local, user-filled, and ignored. Scripts must parse it as data, keep credentials in memory, and print only sanitized stage results. Never source or evaluate `.env`.

## Security limit

Plain FTP sends credentials and content without encryption. Prefer certificate-validated FTPS or host-key-verified SFTP if SiteGround makes either available. Do not silently change protocol.

## Gate for every development deployment

1. Confirm the intended build, protocol, host account, and exact remote path.
2. Build and pass functional/visual QA locally.
3. Upload assets before `index.html` so the entry point never references missing files.
4. Never print credentials or raw FTP errors.
5. Verify the canonical URL after upload:
   - HTTP status;
   - HTML and asset paths;
   - local/live sizes and SHA-256 hashes;
   - current version marker;
   - cache headers after a controlled reload;
   - visible behavior in the selected browser.

Use `--preserve-existing` when publication is authorized but deletion of legacy remote files is not. This mode uploads content-addressed assets and the dynamic root entry, preserves any static entry and legacy tree, and reports cleanup as skipped. Canonical verification is still mandatory because a preserved `index.html` or edge cache may continue to win over the new `index.php`.

Use `--verify-only` to run the configuration, connection, exact-directory, and remote-identity gates without uploading, overwriting, or deleting any remote file.

An upload alone is not a successful deployment. The user reports that hosting caches are disabled or cleared, but that statement is context rather than evidence. Do not infer Apache, Nginx, or other server topology from it.

Content-addressed JavaScript and CSS from the immediately previous entry point are retained during cache overlap. SiteGround has served stale canonical HTML briefly even while exposing the new origin timestamp; deleting the previous bundle in the same deployment can therefore break cached clients. Cache-busted verification confirms the new entry point, while the previous bundle remains available until canonical HTML converges.

The canonical SiteGround deployment uses a generated `index.php` entry with explicit no-store/no-cache response headers. The Vite `index.html` remains the reproducible build input and stays available to the separate Sites-compatible package, but it is removed from the FTP root only after the dynamic entry is uploaded and verified byte-for-byte over FTP. Use `--stage-php-entry` to upload and verify the dynamic entry without switching the root during a first provider check.

The first dynamic-entry activation passed FTP identity and byte verification, but the bare `/` cache key initially continued serving a previously cached 587-byte static entry with `x-proxy-cache: HIT`. This upstream object could not be safely purged with FTP credentials. The user later disabled SiteGround NGINX delivery caching and completed the provider cache flush; the canonical root now returns the current 655-byte no-store PHP entry with `x-proxy-cache: MISS` and byte-identical assets.

For the energy-wave deployment, the canonical unqualified URL continued returning the previous 587-byte HTML body, while a cache-busted query returned the new 658-byte HTML with a byte-identical local/live SHA-256. Both previous and current JavaScript bundles return HTTP 200, so cached clients remain functional. An unauthenticated HTTP `PURGE` request was rejected with 403; do not retry or bypass provider cache controls without an authorized SiteGround mechanism.

## Development policy

During this private development phase, the current verified product build is deployed directly to the canonical root after user approval. Diagnostics remain accessible from the product's integrated report. Do not publish credentials, `_references/`, source archives, or local-only files.
