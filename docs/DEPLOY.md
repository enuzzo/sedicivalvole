# Deployment

The canonical URL is [https://sedicivalvole.app/](https://sedicivalvole.app/),
published only through `scripts/deploy_drive_lab_ftp.py`. This page holds the
procedure and the release index. Every record up to September 24, 2026 is kept
verbatim, with its original heading and anchor, in the
[deployment archive](archive/DEPLOY-HISTORY-2026-09-24.md). A new release adds
one row to the [release table](#release-table) and a short record under
[Latest release records](#latest-release-records); older records move to the
archive rather than growing this page.

## Current verified state

- provider reported by the user: **SiteGround**;
- configured protocol: **passive FTP on port 21**;
- FTP account home contains `sedicivalvole.app/public_html`;
- configured web root: `sedicivalvole.app/public_html`;
- canonical development URL: [https://sedicivalvole.app/](https://sedicivalvole.app/);
- the previous wrong FTP-home diagnostics tree was removed after exact-name validation and explicit authorization;
- the canonical root now hosts the current Drive Lab build.

## Security limit

Plain FTP sends credentials and content without encryption. Prefer certificate-validated FTPS or host-key-verified SFTP if SiteGround makes either available. Do not silently change protocol.

## Gate for every development deployment

1. Confirm the intended build, protocol, host account, and exact remote path.
2. Build and pass functional/visual QA locally.
3. Upload and hash-verify every asset, audio bank, font, third-party subtree and
   diagnostic API file before writing the generated live `index.php` entry.
4. Never print credentials or raw FTP errors.
5. Verify the canonical URL after upload:
   - HTTP status;
   - HTML and asset paths;
   - local/live sizes and SHA-256 hashes;
   - current version marker;
   - cache headers after a controlled reload;
   - visible behavior in the selected browser.

The command is fail-closed: choose exactly one of `--verify-only` and
`--publish`. A bare invocation performs no remote operation. Use
`--preserve-existing` only together with `--publish` when publication is
authorized but deletion of legacy remote files is not. This mode uploads and
verifies the complete build before writing the dynamic root entry, preserves
any static entry and legacy tree, and reports cleanup as skipped. Canonical
verification is still mandatory because a preserved `index.html` or edge cache
may continue to win over the new `index.php`.

Use `--verify-only` to run the configuration, connection, exact-directory, and remote-identity gates without uploading, overwriting, or deleting any remote file.

An upload alone is not a successful deployment. The user reports that hosting caches are disabled or cleared, but that statement is context rather than evidence. Do not infer Apache, Nginx, or other server topology from it.

Content-addressed JavaScript and CSS from the immediately previous entry point are retained during cache overlap. SiteGround has served stale canonical HTML briefly even while exposing the new origin timestamp; deleting the previous bundle in the same deployment can therefore break cached clients. Cache-busted verification confirms the new entry point, while the previous bundle remains available until canonical HTML converges.

The canonical SiteGround deployment uses a generated `index.php` entry with
explicit no-store/no-cache response headers. The Vite `index.html` remains the
reproducible build input and stays available to the separate Sites-compatible
package, but it is removed from the FTP root only after the dynamic entry is
uploaded and verified byte-for-byte over FTP. `--publish --stage-php-entry`
round-trips the candidate as the non-executable `index.php.stage` name and then
deletes that candidate; it never writes the live `index.php` and never switches
the static root. A normal `--publish` uploads `index.php.next`, reads it back and
verifies its hash, then replaces `index.php` by a same-directory FTP rename and
verifies the installed bytes. It never streams a partially uploaded payload
directly into the live entry name. The provider must demonstrate support for
replacing the existing target by rename during the real publication; failure
leaves the previous live entry in place and aborts the release.

This final-entry switch does not make the complete FTP publication atomic.
Mutable `audio/junction.svb` and diagnostic API files are uploaded and verified
before the entry rename. The current bank/parser and API contracts therefore
remain backward compatible across that window, and publication still stops
before the entry switch on any mismatch. A future incompatible bank or API
revision should use a content-addressed filename or release directory rather
than claiming whole-release atomicity from the entry rename alone.

The first dynamic-entry activation passed FTP identity and byte verification, but the bare `/` cache key initially continued serving a previously cached 587-byte static entry with `x-proxy-cache: HIT`. This upstream object could not be safely purged with FTP credentials. The user later disabled SiteGround NGINX delivery caching and completed the provider cache flush; the canonical root now returns the current 655-byte no-store PHP entry with `x-proxy-cache: MISS` and byte-identical assets.

For the energy-wave deployment, the canonical unqualified URL continued returning the previous 587-byte HTML body, while a cache-busted query returned the new 658-byte HTML with a byte-identical local/live SHA-256. Both previous and current JavaScript bundles return HTTP 200, so cached clients remain functional. An unauthenticated HTTP `PURGE` request was rejected with 403; do not retry or bypass provider cache controls without an authorized SiteGround mechanism.

## Build identification

Every build carries a stamp in the form `20260826-1543` (`YYYYMMDD-HHMM`),
generated at build time and shown on the splash. **Always write the build stamp
when publishing or deploying**, and record it with the evidence for that
publication. It identifies the build; `VERSION` remains the only SemVer source
of truth and is reported separately in the diagnostics.

`shadergradient-lab.html` is a development-only standalone workbench entry and
must not be uploaded to the canonical root. Its reusable workbench is also
included in the authenticated protected-LAB bundle. The public App exposes the
three selected starting points as variants of one `GRADIENT 08` family and
imports the exact MIT renderer through a separate lazy chunk; LAB controls and
URL import remain outside the public surface. Exact
dependency and local run instructions are recorded in
`LOCAL-SHADERGRADIENT-LAB.md`.

## Rollback

`scripts/rollback-release.sh <tag-or-commit>` rebuilds any earlier source in a
temporary Git worktree, moves the current `prototype/drive-lab/dist` aside and
runs the official read-only preflight. Add `--publish` to run the same
preserve-existing publication and postflight as a normal release, then verify
the canonical URL as above. Release sources are tagged before large changes
(`pre-night-instrument-20260924`, `pre-structural-20260924`); the table below
gives every recorded build with its commit where the stamp carries one. The
script never reads or copies an environment file. Details:
[Delivery / Rollback](agent-guide/delivery.md#rollback).

## Development policy

During this private development phase, the current verified product build is deployed directly to the canonical root after user approval. Diagnostics remain accessible from the product's integrated report. Do not publish credentials, `_references/`, source archives, or local-only files.

## Release table

Build is the first build stamp named in the record; stamps from September 19
onward carry their source commit (`YYYYMMDD-HHMM.commit`).

| Date | Record | Build |
| --- | --- | --- |
| 2026-09-24 | [Night Instrument interface](archive/DEPLOY-HISTORY-2026-09-24.md#night-instrument-interface--2026-09-24) | `20260924-1430.1b20183` |
| 2026-09-23 22:55 | [Meridian, Aperture and PRTCL curve refinement](VISUAL-CURVES-2026-09-23.md) | `20260923-2255.0ddd3ce` |
| 2026-09-23 22:21 | [Aperture GPS curve cadence repair](archive/CURRENT-STATE-HISTORY-2026-09-24.md#aperture-gps-curve-cadence-repair--september-23) | `20260923-2221.cbc7db7` |
| 2026-09-23 20:59 | [Soundtrack effects and passenger control audit](AUDIO-EFFECTS-AUDIT-2026-09-23.md) | `20260923-2059.5967df1` |
| 2026-09-23 19:53 | [Companion appearance synchronization](PASSENGER-REMOTE-PAIRING-2026-09-23.md#live-appearance-synchronization-follow-up) | `20260923-1953.b06b696` |
| 2026-09-23 19:33 | [Passenger remote pairing repair](PASSENGER-REMOTE-PAIRING-2026-09-23.md) | `20260923-1933.675b2c9` |
| 2026-09-23 | [Passenger remote and GPS heading](archive/DEPLOY-HISTORY-2026-09-24.md#passenger-remote-and-gps-heading--2026-09-23) | `20260923-1534.05ad287` |
| 2026-09-23 | [GPS speed presentation repair](archive/DEPLOY-HISTORY-2026-09-24.md#gps-speed-presentation-repair--2026-09-23) | `20260923-1008.fd3d148` |
| 2026-09-22 | [Phone road-benchmark release](archive/DEPLOY-HISTORY-2026-09-24.md#september-22-phone-road-benchmark-release) | `20260922-0953.d6348cd` |
| 2026-09-20 | [Icon-only phone source status](archive/DEPLOY-HISTORY-2026-09-24.md#icon-only-phone-source-status--2026-09-20) | `20260920-2231.b696bc4` |
| 2026-09-20 | [Phone direct transport and stable presentation](archive/DEPLOY-HISTORY-2026-09-24.md#phone-direct-transport-and-stable-presentation--2026-09-20) | `20260920-2153.3936555` |
| 2026-09-20 | [Phone integration and network recovery](archive/DEPLOY-HISTORY-2026-09-24.md#phone-integration-and-network-recovery--2026-09-20) | `20260920-2044.7ba2b1c` |
| 2026-09-19 17:29 | [Mounted iPhone road response](archive/DEPLOY-HISTORY-2026-09-24.md#2026-09-19-1729--mounted-iphone-road-response) | `20260919-1722.ea8712b` |
| 2026-09-19 16:57 | [Piston size and report navigation](archive/DEPLOY-HISTORY-2026-09-24.md#piston-size-and-report-navigation--2026-09-19-1657) | `20260919-1649.a1db5bd` |
| 2026-09-19 16:38 | [Explicit automatic-report controls](archive/DEPLOY-HISTORY-2026-09-24.md#2026-09-19-1638--explicit-automatic-report-controls) | `20260919-1630.1085bbf` |
| 2026-09-19 16:20 | [Encrypted phone HTTPS and Aperture gyro](archive/DEPLOY-HISTORY-2026-09-24.md#2026-09-19-1620--encrypted-phone-https-and-aperture-gyro) | `20260919-1612.11ecca8` |
| 2026-09-19 15:53 | [Equal Engine telemetry publication](archive/DEPLOY-HISTORY-2026-09-24.md#equal-engine-telemetry-publication--2026-09-19-1553) | `20260919-1545.b7d1a98` |
| 2026-09-19 15:26 | [UI harmony publication](archive/DEPLOY-HISTORY-2026-09-24.md#ui-harmony-publication--2026-09-19-1526) | `20260919-1515.d0ff6a9` |
| 2026-09-19 10:13 | [Companion first-screen refinement](archive/DEPLOY-HISTORY-2026-09-24.md#companion-first-screen-refinement--2026-09-19-1013) | `20260919-1003.fb6f880` |
| 2026-09-19 02:10 | [Companion SVG guide final publication](archive/DEPLOY-HISTORY-2026-09-24.md#companion-svg-guide-final-publication--2026-09-19-0210) | `20260919-0202` |
| 2026-09-19 01:57 | [Automatic QR and settling ZERO publication](archive/DEPLOY-HISTORY-2026-09-24.md#automatic-qr-and-settling-zero-publication--2026-09-19-0157) | `20260919-0148` |
| 2026-09-19 01:40 | [TRACE reliability publication](archive/DEPLOY-HISTORY-2026-09-24.md#trace-reliability-publication--2026-09-19-0140-europerome) | `20260919-0131.c75c921` |
| 2026-09-19 | [Branded portrait phone companion](archive/DEPLOY-HISTORY-2026-09-24.md#branded-portrait-phone-companion--september-19-2026) | `20260919-0002.d51b4b7` |
| 2026-09-19 | [TRACE phone instrument publication](archive/DEPLOY-HISTORY-2026-09-24.md#trace-phone-instrument-publication--september-19-2026) | `20260919-0049.e8beb93` |
| 2026-09-18 20:54 | [Soundtrack seek-readiness publication](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-seek-readiness-publication--2026-09-18-2054-europerome) | `20260918-2043.b2177ed` |
| 2026-09-12 10:16 | [Gradient, credits and Atlas camera publication](archive/DEPLOY-HISTORY-2026-09-24.md#gradient-credits-and-atlas-camera-publication--2026-09-12-1016) | `20260912-1007.5ffacb1` |
| 2026-09-12 09:24 | [Release readiness and MapLibre 6.7.0 publication](archive/DEPLOY-HISTORY-2026-09-24.md#release-readiness-and-maplibre-670-publication--2026-09-12-0924) | `20260912-0909.e0ac1cb` |
| 2026-09-11 17:18 | [Intro timing refinement](archive/DEPLOY-HISTORY-2026-09-24.md#intro-timing-refinement--2026-09-11-1718) | `20260911-1711.cfe49a3` |
| 2026-09-11 17:00 | [Centered Intro entrance publication](archive/DEPLOY-HISTORY-2026-09-24.md#centered-intro-entrance-publication--2026-09-11-1700) | `20260911-1653.acfdc11` |
| 2026-09-11 16:49 | [Transparent piston identity publication](archive/DEPLOY-HISTORY-2026-09-24.md#transparent-piston-identity-publication--2026-09-11-1649) | `20260911-1641.6d3009a` |
| 2026-09-11 16:26 | [Infographic publication and completed bank recovery](archive/DEPLOY-HISTORY-2026-09-24.md#infographic-publication-and-completed-bank-recovery--2026-09-11-1626-europerome) | `20260911-1606.10f8511` |
| 2026-09-11 14:57 | [Road instruments, Travel Report and TAMARRO gesture](archive/DEPLOY-HISTORY-2026-09-24.md#2026-09-11-1457--road-instruments-travel-report-and-tamarro-gesture) | `20260911-1407.44f6a29` |
| 2026-09-11 | [Verified bank replacement and scoped recovery](archive/DEPLOY-HISTORY-2026-09-24.md#verified-bank-replacement-and-scoped-recovery--2026-09-11) | — |
| 2026-09-09 10:12 | [Verified session cache and update release](archive/DEPLOY-HISTORY-2026-09-24.md#verified-session-cache-and-update-release--2026-09-09-1012-europerome) | `20260909-1001` |
| 2026-09-09 09:24 | [Verified launch preparation](archive/DEPLOY-HISTORY-2026-09-24.md#verified-launch-preparation--2026-09-09-0924-europerome) | `20260909-0911` |
| 2026-09-09 00:08 | [Verified Engine catalogue retirement](archive/DEPLOY-HISTORY-2026-09-24.md#verified-engine-catalogue-retirement--2026-09-09-0008-europerome) | `20260908-2356` |
| 2026-09-08 19:48 | [Atlas / Stats road-note refinement](archive/DEPLOY-HISTORY-2026-09-24.md#2026-09-08-1948--atlas--stats-road-note-refinement) | `20260908-1934` |
| 2026-09-08 11:53 | [Verified final A/B LAB publication](archive/DEPLOY-HISTORY-2026-09-24.md#verified-final-ab-lab-publication--2026-09-08-1153-europerome) | `20260908-1143` |
| 2026-09-08 11:11 | [Verified publication](archive/DEPLOY-HISTORY-2026-09-24.md#verified-publication--2026-09-08-1111-europerome) | `20260908-1102` |
| 2026-09-08 09:14 | [Engine road progression publication](archive/DEPLOY-HISTORY-2026-09-24.md#engine-road-progression-publication--2026-09-08-0914-europerome) | `20260908-0834` |
| 2026-09-08 00:36 | [Engine acoustic campaign publication](archive/DEPLOY-HISTORY-2026-09-24.md#engine-acoustic-campaign-publication--2026-09-08-0036-europerome) | `20260908-0026` |
| 2026-09-07 23:40 | [Altitude correction publication](archive/DEPLOY-HISTORY-2026-09-24.md#altitude-correction-publication--2026-09-07-2340-europerome) | `20260907-2328` |
| 2026-09-07 22:58 | [Night checkpoint](archive/DEPLOY-HISTORY-2026-09-24.md#night-checkpoint--2026-09-07-2258-europerome) | `20260907-2243` |
| 2026-09-07 20:13 | [Automatic diagnostics live](archive/DEPLOY-HISTORY-2026-09-24.md#automatic-diagnostics-live--2026-09-07-2013) | `20260907-2004` |
| 2026-09-07 19:45 | [Canonical road-feedback publication](archive/DEPLOY-HISTORY-2026-09-24.md#canonical-road-feedback-publication--2026-09-07-1945) | `20260907-1936` |
| 2026-09-07 18:41 | [ATLAS and Stats approved remix](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-and-stats-approved-remix--2026-09-07-1841) | `20260907-1833` |
| 2026-09-07 16:32 | [Quiet Engine idle and GPS zero](archive/DEPLOY-HISTORY-2026-09-24.md#quiet-engine-idle-and-gps-zero--2026-09-07-1632) | `20260907-1624` |
| 2026-09-07 16:05 | [Support header published](archive/DEPLOY-HISTORY-2026-09-24.md#support-header-published--2026-09-07-1605) | `20260907-1557` |
| 2026-09-07 15:45 | [Centered launch and viewport footer](archive/DEPLOY-HISTORY-2026-09-24.md#centered-launch-and-viewport-footer--2026-09-07-1545) | `20260907-1534` |
| 2026-09-07 15:27 | [Intrinsic launch height](archive/DEPLOY-HISTORY-2026-09-24.md#intrinsic-launch-height--2026-09-07-1527) | `20260907-1520` |
| 2026-09-07 14:09 | [Compact Round Instruments](archive/DEPLOY-HISTORY-2026-09-24.md#compact-round-instruments--2026-09-07-1409) | `20260907-1400` |
| 2026-09-07 13:26 | [Everyday-road Engine gearing](archive/DEPLOY-HISTORY-2026-09-24.md#everyday-road-engine-gearing--2026-09-07-1326) | `20260907-1316` |
| 2026-09-07 13:06 | [TAMARRO / Show-off](archive/DEPLOY-HISTORY-2026-09-24.md#tamarro--show-off--2026-09-07-1306) | `20260907-1256` |
| 2026-09-07 12:49 | [Launch Cockpit](archive/DEPLOY-HISTORY-2026-09-24.md#launch-cockpit--2026-09-07-1249) | `20260907-1238` |
| 2026-09-07 12:01 | [Engine listening refinement](archive/DEPLOY-HISTORY-2026-09-24.md#engine-listening-refinement--2026-09-07-1201) | `20260907-1151` |
| 2026-09-07 11:30 | [Engine / Telemetry](archive/DEPLOY-HISTORY-2026-09-24.md#engine--telemetry--2026-09-07-1130) | `20260907-1119` |
| 2026-09-07 09:37 | [Reliability recovery and honest diagnostics](archive/DEPLOY-HISTORY-2026-09-24.md#reliability-recovery-and-honest-diagnostics--2026-09-07-0937) | `20260907-0930` |
| 2026-09-05 00:35 | [Moving-touch correction verified live](archive/DEPLOY-HISTORY-2026-09-24.md#moving-touch-correction-verified-live--2026-09-05-0035) | `20260905-0028` |
| 2026-09-05 00:20 | [Long-trip diagnostics published](archive/DEPLOY-HISTORY-2026-09-24.md#long-trip-diagnostics-published--2026-09-05-0020) | `20260905-0012` |
| 2026-09-04 23:59 | [Authorized canonical publication](archive/DEPLOY-HISTORY-2026-09-24.md#authorized-canonical-publication--2026-09-04-2359) | `20260904-2351` |
| 2026-09-03 21:56 | [Compact telemetry and visual controls](archive/DEPLOY-HISTORY-2026-09-24.md#compact-telemetry-and-visual-controls--2026-09-03-2156) | `20260903-2137` |
| 2026-09-03 21:14 | [Diagnostic-driven Soundtrack admission](archive/DEPLOY-HISTORY-2026-09-24.md#diagnostic-driven-soundtrack-admission--2026-09-03-2114) | `20260903-2103` |
| 2026-09-03 20:48 | [Underwater-only vehicle response](archive/DEPLOY-HISTORY-2026-09-24.md#underwater-only-vehicle-response--2026-09-03-2048) | `20260903-2035` |
| 2026-09-03 20:02 | [Tesla Soundtrack contention correction](archive/DEPLOY-HISTORY-2026-09-24.md#tesla-soundtrack-contention-correction--2026-09-03-2002) | `20260903-1953` |
| 2026-09-03 18:07 | [Road Sheet appearance and native media controls](archive/DEPLOY-HISTORY-2026-09-24.md#road-sheet-appearance-and-native-media-controls--2026-09-03-1807) | `20260903-1752` |
| 2026-09-03 15:00 | [Swiss Compact product-wide calibration](archive/DEPLOY-HISTORY-2026-09-24.md#swiss-compact-product-wide-calibration--2026-09-03-1500) | `20260903-1448` |
| 2026-09-03 12:03 | [Automotive Glance and stable Soundtrack](archive/DEPLOY-HISTORY-2026-09-24.md#automotive-glance-and-stable-soundtrack--2026-09-03-1203) | `20260903-1155` |
| 2026-09-03 08:56 | [Exhaustive media flight recorder](archive/DEPLOY-HISTORY-2026-09-24.md#exhaustive-media-flight-recorder--2026-09-03-0856) | `20260903-0843` |
| 2026-09-03 01:30 | [ATLAS semantic map colours](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-semantic-map-colours--2026-09-03-0130) | `20260903-0118` |
| 2026-09-03 00:57 | [ATLAS Drive Lab typography and Direction History](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-drive-lab-typography-and-direction-history--2026-09-03-0057) | `20260903-0042` |
| 2026-09-03 00:24 | [Visual catalogue, Gradient, and PRTCL refinement](archive/DEPLOY-HISTORY-2026-09-24.md#visual-catalogue-gradient-and-prtcl-refinement--2026-09-03-0024) | `20260903-0015` |
| 2026-09-02 23:52 | [Discover global Wikipedia search](archive/DEPLOY-HISTORY-2026-09-24.md#discover-global-wikipedia-search--2026-09-02-2352) | `20260902-2346` |
| 2026-09-02 23:30 | [DRIVEY GPS-speed calibration](archive/DEPLOY-HISTORY-2026-09-24.md#drivey-gps-speed-calibration--2026-09-02-2330) | `20260902-2322` |
| 2026-09-02 23:09 | [Now Playing dark-surface contrast](archive/DEPLOY-HISTORY-2026-09-24.md#now-playing-dark-surface-contrast--2026-09-02-2309) | `20260902-2142` |
| 2026-09-02 21:35 | [Motion-independent chrome wake follow-up](archive/DEPLOY-HISTORY-2026-09-24.md#motion-independent-chrome-wake-follow-up--2026-09-02-2135) | `20260902-2127` |
| 2026-09-02 21:14 | [Mandatory 10C vehicle-note closeout](archive/DEPLOY-HISTORY-2026-09-24.md#mandatory-10c-vehicle-note-closeout--2026-09-02-2114) | `20260902-2106` |
| 2026-09-02 20:04 | [Soundtrack context and transport regression recovery](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-context-and-transport-regression-recovery--2026-09-02-2004) | `20260902-1954` |
| 2026-09-02 19:21 | [Gradient 08 family and persistent variant cycle](archive/DEPLOY-HISTORY-2026-09-24.md#gradient-08-family-and-persistent-variant-cycle--2026-09-02-1921) | `20260902-1905` |
| 2026-09-02 18:14 | [Three autonomous ShaderGradient visuals](archive/DEPLOY-HISTORY-2026-09-24.md#three-autonomous-shadergradient-visuals--2026-09-02-1814) | `20260902-1801` |
| 2026-09-02 13:52 | [Protected ShaderGradient owner LAB](archive/DEPLOY-HISTORY-2026-09-24.md#protected-shadergradient-owner-lab--2026-09-02-1352) | `20260902-1341` |
| 2026-09-02 01:16 | [GRADIENT 08 and drive-interaction closeout](archive/DEPLOY-HISTORY-2026-09-24.md#gradient-08-and-drive-interaction-closeout--2026-09-02-0116) | `20260902-0103` |
| 2026-09-01 23:11 | [Native Minerva dark Discover publication](archive/DEPLOY-HISTORY-2026-09-24.md#native-minerva-dark-discover-publication--2026-09-01-2311) | `20260901-2300` |
| 2026-09-01 22:37 | [Drive-note interaction and density closeout](archive/DEPLOY-HISTORY-2026-09-24.md#drive-note-interaction-and-density-closeout--2026-09-01-2237) | `20260901-2232` |
| 2026-09-01 21:44 | [Signal Gate support-dialog visibility repair](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-support-dialog-visibility-repair--2026-09-01-2144) | `20260901-2137` |
| 2026-09-01 20:23 | [ATLAS Drive Lab hierarchy correction](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-drive-lab-hierarchy-correction--2026-09-01-2023) | `20260901-2012` |
| 2026-09-01 19:52 | [Grouped High Cut Performance FX](archive/DEPLOY-HISTORY-2026-09-24.md#grouped-high-cut-performance-fx--2026-09-01-1952) | `20260901-1943` |
| 2026-09-01 18:30 | [Performance FX full-depth stunt zone](archive/DEPLOY-HISTORY-2026-09-24.md#performance-fx-full-depth-stunt-zone--2026-09-01-1830) | `20260901-1823` |
| 2026-09-01 18:09 | [Eight-effect Performance FX](archive/DEPLOY-HISTORY-2026-09-24.md#eight-effect-performance-fx--2026-09-01-1809) | `20260901-1802` |
| 2026-09-01 16:37 | [DISCOVER article balance and passenger-index density](archive/DEPLOY-HISTORY-2026-09-24.md#discover-article-balance-and-passenger-index-density--2026-09-01-1637) | `20260901-1624` |
| 2026-09-01 16:12 | [ATLAS Drive Lab composite](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-drive-lab-composite--2026-09-01-1612) | `20260901-1559` |
| 2026-09-01 15:34 | [DISCOVER complete reader and ATLAS separation](archive/DEPLOY-HISTORY-2026-09-24.md#discover-complete-reader-and-atlas-separation--2026-09-01-1534) | `20260901-1524` |
| 2026-09-01 14:45 | [ATLAS terrain and journey histories](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-terrain-and-journey-histories--2026-09-01-1445) | `20260901-1438` |
| 2026-09-01 14:21 | [ATLAS Live Navigator](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-live-navigator--2026-09-01-1421) | `20260901-1414` |
| 2026-09-01 11:14 | [DISCOVER Visual-catalogue reachability](archive/DEPLOY-HISTORY-2026-09-24.md#discover-visual-catalogue-reachability--2026-09-01-1114) | `20260901-1105` |
| 2026-09-01 10:47 | [Horizontal Music sources and selected Play the Road](archive/DEPLOY-HISTORY-2026-09-24.md#horizontal-music-sources-and-selected-play-the-road--2026-09-01-1047) | `20260901-1041` |
| 2026-09-01 09:45 | [DISCOVER Passenger Index and Music Navigator Rail](archive/DEPLOY-HISTORY-2026-09-24.md#discover-passenger-index-and-music-navigator-rail--2026-09-01-0945) | `20260901-0933` |
| 2026-09-01 00:22 | [Tesla Music library and suspended-clock transport recovery](archive/DEPLOY-HISTORY-2026-09-24.md#tesla-music-library-and-suspended-clock-transport-recovery--2026-09-01-0022) | `20260901-0012` |
| 2026-08-31 22:14 | [MERIDIAN amplified immersion and surfacing](archive/DEPLOY-HISTORY-2026-09-24.md#meridian-amplified-immersion-and-surfacing--2026-08-31-2214) | `20260831-2207` |
| 2026-08-31 20:42 | [MERIDIAN full-range FOV and braking response](archive/DEPLOY-HISTORY-2026-09-24.md#meridian-full-range-fov-and-braking-response--2026-08-31-2042) | `20260831-2034` |
| 2026-08-31 20:22 | [Global FX Deck](archive/DEPLOY-HISTORY-2026-09-24.md#global-fx-deck--2026-08-31-2022) | `20260831-2005` |
| 2026-08-31 19:11 | [Reversible Soundtrack path selection](archive/DEPLOY-HISTORY-2026-09-24.md#reversible-soundtrack-path-selection--2026-08-31-1911) | `20260831-1911` |
| 2026-08-31 18:36 | [Immediate weak-network Music switching](archive/DEPLOY-HISTORY-2026-09-24.md#immediate-weak-network-music-switching--2026-08-31-1836) | `20260831-1836` |
| 2026-08-31 18:23 | [Soundtrack transport state hardening](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-transport-state-hardening--2026-08-31-1823) | `20260831-1824` |
| 2026-08-31 18:00 | [Illobo track-head restart guarantee](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-track-head-restart-guarantee--2026-08-31-1800) | `20260831-1755` |
| 2026-08-31 17:50 | [True Illobo catalogue and hosted-audio correction](archive/DEPLOY-HISTORY-2026-09-24.md#true-illobo-catalogue-and-hosted-audio-correction--2026-08-31-1750) | `20260831-1744` |
| 2026-08-31 17:32 | [Illobo Featured random-start and full relay audit](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-featured-random-start-and-full-relay-audit--2026-08-31-1732) | `20260831-1727` |
| 2026-08-31 17:19 | [Tesla Soundtrack playback/effect correction](archive/DEPLOY-HISTORY-2026-09-24.md#tesla-soundtrack-playbackeffect-correction--2026-08-31-1719) | `20260831-1714` |
| 2026-08-31 17:01 | [ATLAS Navigator Plaque](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-navigator-plaque--2026-08-31-1701) | `20260831-1653` |
| 2026-08-31 15:38 | [Global MUTE / FX control parity](archive/DEPLOY-HISTORY-2026-09-24.md#global-mute--fx-control-parity--2026-08-31-1538) | `20260831-1534` |
| 2026-08-31 15:09 | [Illobo Featured launch correction](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-featured-launch-correction--2026-08-31-1509) | `20260831-1502` |
| 2026-08-31 14:53 | [Illobo perceptual endpoint correction](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-perceptual-endpoint-correction--2026-08-31-1453) | `20260831-1448` |
| 2026-08-31 13:41 | [Illobo continuous dark-field correction](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-continuous-dark-field-correction--2026-08-31-1341) | `20260831-1340` |
| 2026-08-31 13:25 | [Illobo identity and Tesla playback title](archive/DEPLOY-HISTORY-2026-09-24.md#illobo-identity-and-tesla-playback-title--2026-08-31-1325) | `20260831-1320` |
| 2026-08-31 12:50 | [Soundtrack row 7 corrective test build](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-row-7-corrective-test-build--2026-08-31-1250) | `20260831-1241` |
| 2026-08-31 12:30 | [Soundtrack row 7 second rejected candidate](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-row-7-second-rejected-candidate--2026-08-31-1230) | `20260831-1229` |
| 2026-08-31 12:22 | [Soundtrack row 7 first live candidate](archive/DEPLOY-HISTORY-2026-09-24.md#soundtrack-row-7-first-live-candidate--2026-08-31-1222) | `20260831-1219` |
| 2026-08-31 11:49 | [Sampled-bank evidence and constrained-network recovery](archive/DEPLOY-HISTORY-2026-09-24.md#sampled-bank-evidence-and-constrained-network-recovery--2026-08-31-1149) | `20260831-1143` |
| 2026-08-31 11:16 | [ATLAS drive corrections and sampled-score calibration](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-drive-corrections-and-sampled-score-calibration--2026-08-31-1116) | `20260831-1111` |
| 2026-08-31 08:59 | [Equal-path Soundtrack library](archive/DEPLOY-HISTORY-2026-09-24.md#equal-path-soundtrack-library--2026-08-31-0859) | `20260831-0853` |
| 2026-08-31 03:38 | [Catalogue display typography](archive/DEPLOY-HISTORY-2026-09-24.md#catalogue-display-typography--2026-08-31-0338) | `20260831-0333` |
| 2026-08-31 03:22 | [Compact footer palette and EFFECTS master](archive/DEPLOY-HISTORY-2026-09-24.md#compact-footer-palette-and-effects-master--2026-08-31-0322) | `20260831-0315` |
| 2026-08-31 02:58 | [Jamendo SOUNDTRACK production prototype](archive/DEPLOY-HISTORY-2026-09-24.md#jamendo-soundtrack-production-prototype--2026-08-31-0258) | `20260831-0249` |
| 2026-08-31 00:14 | [Compact Road Sheet lockup and spacing](archive/DEPLOY-HISTORY-2026-09-24.md#compact-road-sheet-lockup-and-spacing--2026-08-31-0014) | `20260831-0006` |
| 2026-08-30 23:48 | [Road Sheet LIGHT Instrument Deck](archive/DEPLOY-HISTORY-2026-09-24.md#road-sheet-light-instrument-deck--2026-08-30-2348) | `20260830-2344` |
| 2026-08-30 22:51 | [16 Road launch lockup and Orbitron wordmarks](archive/DEPLOY-HISTORY-2026-09-24.md#16-road-launch-lockup-and-orbitron-wordmarks--2026-08-30-2251) | `20260830-2243` |
| 2026-08-30 22:21 | [REPORT top-bar control](archive/DEPLOY-HISTORY-2026-09-24.md#report-top-bar-control--2026-08-30-2221) | `20260830-2216` |
| 2026-08-30 21:32 | [Instrument Deck section-label spacing](archive/DEPLOY-HISTORY-2026-09-24.md#instrument-deck-section-label-spacing--2026-08-30-2132) | `20260830-2128` |
| 2026-08-30 21:21 | [Space Grotesk and persistent palette accent](archive/DEPLOY-HISTORY-2026-09-24.md#space-grotesk-and-persistent-palette-accent--2026-08-30-2121) | `20260830-2117` |
| 2026-08-30 20:59 | [Independent LAB audio and PRTCL response](archive/DEPLOY-HISTORY-2026-09-24.md#independent-lab-audio-and-prtcl-response--2026-08-30-2059) | `20260830-2055` |
| 2026-08-30 20:15 | [Stable owner LAB renderer and keyboard motion](archive/DEPLOY-HISTORY-2026-09-24.md#stable-owner-lab-renderer-and-keyboard-motion--2026-08-30-2015) | `20260830-2011` |
| 2026-08-30 19:59 | [16 Road browser-identity publication](archive/DEPLOY-HISTORY-2026-09-24.md#16-road-browser-identity-publication--2026-08-30-1959) | `20260830-1953` |
| 2026-08-30 19:39 | [Instrument Deck and SOUNDTRACK policy publication](archive/DEPLOY-HISTORY-2026-09-24.md#instrument-deck-and-soundtrack-policy-publication--2026-08-30-1939) | `20260830-1935` |
| 2026-08-30 18:34 | [Protected owner LAB publication](archive/DEPLOY-HISTORY-2026-09-24.md#protected-owner-lab-publication--2026-08-30-1834) | `20260830-1828` |
| 2026-08-30 17:15 | [Phase 1 shared response and DRIVEY publication](archive/DEPLOY-HISTORY-2026-09-24.md#phase-1-shared-response-and-drivey-publication--2026-08-30-1715) | `20260830-1707` |
| 2026-08-30 16:47 | [Phase 0 and M13 publication](archive/DEPLOY-HISTORY-2026-09-24.md#phase-0-and-m13-publication--2026-08-30-1647) | `20260830-1643` |
| 2026-08-30 14:34 | [Enuzzo identity correction publication](archive/DEPLOY-HISTORY-2026-09-24.md#enuzzo-identity-correction-publication--2026-08-30-1434) | `20260830-1427` |
| 2026-08-30 00:43 | [PRIMORDIAL and OPEN publication](archive/DEPLOY-HISTORY-2026-09-24.md#primordial-and-open-publication--2026-08-30-0043) | `20260830-0038` |
| 2026-08-29 23:37 | [PRTCL approval and integrated recovery publication](archive/DEPLOY-HISTORY-2026-09-24.md#prtcl-approval-and-integrated-recovery-publication--2026-08-29-2337) | `20260829-2337` |
| 2026-08-29 21:13 | [Source-faithful DRIVEY recovery](archive/DEPLOY-HISTORY-2026-09-24.md#source-faithful-drivey-recovery--2026-08-29-2113) | `20260829-2110` |
| 2026-08-29 18:28 | [DRIVEY 06 publication](archive/DEPLOY-HISTORY-2026-09-24.md#drivey-06-publication--2026-08-29-1828) | `20260829-1826` |
| 2026-08-29 18:15 | [NIGHTSHIFT and integrated Flux checkpoint publication](archive/DEPLOY-HISTORY-2026-09-24.md#nightshift-and-integrated-flux-checkpoint-publication--2026-08-29-1815) | `20260829-1810` |
| 2026-08-29 17:38 | [Pending local checkpoint and unchanged live identity](archive/DEPLOY-HISTORY-2026-09-24.md#pending-local-checkpoint-and-unchanged-live-identity--2026-08-29-1738) | `20260829-1536` |
| 2026-08-29 | [Low-speed life and runtime-resilience publication](archive/DEPLOY-HISTORY-2026-09-24.md#low-speed-life-and-runtime-resilience-publication--2026-08-29) | `20260829-1536` |
| 2026-08-29 | [BLOOM and JUNCTION-analysis publication](archive/DEPLOY-HISTORY-2026-09-24.md#bloom-and-junction-analysis-publication--2026-08-29) | `20260829-0200` |
| 2026-08-29 | [REGISTER removal publication](archive/DEPLOY-HISTORY-2026-09-24.md#register-removal-publication--2026-08-29) | `20260829-0121` |
| 2026-08-29 | [REGISTER boundary-continuity publication](archive/DEPLOY-HISTORY-2026-09-24.md#register-boundary-continuity-publication--2026-08-29) | `20260829-0107` |
| 2026-08-29 | [REGISTER and OPEN publication](archive/DEPLOY-HISTORY-2026-09-24.md#register-and-open-publication--2026-08-29) | `20260829-0059` |
| 2026-08-29 | [PROJECT SPARKS fixed-duration count publication](archive/DEPLOY-HISTORY-2026-09-24.md#project-sparks-fixed-duration-count-publication--2026-08-29) | `20260828-2359` |
| 2026-08-28 | [Signal Gate support-panel publication](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-support-panel-publication--2026-08-28) | `20260828-2303` |
| 2026-08-28 | [Signal Gate credit-link polish publication](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-credit-link-polish-publication--2026-08-28) | `20260828-2249` |
| 2026-08-28 | [Signal Gate readability publication](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-readability-publication--2026-08-28) | `20260828-2219` |
| 2026-08-28 | [Signal Gate credits publication](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-credits-publication--2026-08-28) | `20260828-2208` |
| 2026-08-28 | [Meridian and music correction publication](archive/DEPLOY-HISTORY-2026-09-24.md#meridian-and-music-correction-publication--2026-08-28) | `20260828-1950` |
| 2026-08-28 | [LATITUDES retirement publication](archive/DEPLOY-HISTORY-2026-09-24.md#latitudes-retirement-publication--2026-08-28) | `20260828-1745` |
| 2026-08-28 | [JUNCTION rhythm-envelope publication](archive/DEPLOY-HISTORY-2026-09-24.md#junction-rhythm-envelope-publication--2026-08-28) | `20260828-1736` |
| 2026-08-28 | [ATLAS selected-place context publication](archive/DEPLOY-HISTORY-2026-09-24.md#atlas-selected-place-context-publication--2026-08-28) | `20260828-1725` |
| 2026-08-28 | [Enlarged Signal Gate wordmark publication](archive/DEPLOY-HISTORY-2026-09-24.md#enlarged-signal-gate-wordmark-publication--2026-08-28) | `20260828-1613` |
| 2026-08-28 | [Direction-following ATLAS publication](archive/DEPLOY-HISTORY-2026-09-24.md#direction-following-atlas-publication--2026-08-28) | `20260828-1606` |
| 2026-08-28 | [Seamless Orbitron launch publication](archive/DEPLOY-HISTORY-2026-09-24.md#seamless-orbitron-launch-publication--2026-08-28) | `20260828-1553` |
| 2026-08-28 | [Orbitron typography publication](archive/DEPLOY-HISTORY-2026-09-24.md#orbitron-typography-publication--2026-08-28) | `20260828-1538` |
| 2026-08-28 | [Adaptive visual refinement publication](archive/DEPLOY-HISTORY-2026-09-24.md#adaptive-visual-refinement-publication--2026-08-28) | `20260828-1520` |
| 2026-08-28 | [Dense Device evidence publication](archive/DEPLOY-HISTORY-2026-09-24.md#dense-device-evidence-publication--2026-08-28) | `20260828-1255` |
| 2026-08-28 | [Compact diagnostic feedback publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#compact-diagnostic-feedback-publication-evidence--2026-08-28) | `20260828-1249` |
| 2026-08-28 | [Long-drive diagnostic transport publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#long-drive-diagnostic-transport-publication-evidence--2026-08-28) | `20260828-1238` |
| 2026-08-28 | [Kinetic visual and ATLAS publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#kinetic-visual-and-atlas-publication-evidence--2026-08-28) | `20260828-1131` |
| 2026-08-28 | [Tesla-informed Flux refinement publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#tesla-informed-flux-refinement-publication-evidence--2026-08-28) | `20260828-1001` |
| 2026-08-28 | [Complete diagnostic attachment publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#complete-diagnostic-attachment-publication-evidence--2026-08-28) | `20260828-0927` |
| 2026-08-28 | [Flat Signal Gate publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#flat-signal-gate-publication-evidence--2026-08-28) | `20260828-0127` |
| 2026-08-28 | [Braun launch and phase-diagnostics publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#braun-launch-and-phase-diagnostics-publication-evidence--2026-08-28) | `20260828-0100` |
| 2026-08-28 | [JUNCTION 104-clip publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#junction-104-clip-publication-evidence--2026-08-28) | `20260827-2359` |
| 2026-08-27 | [JUNCTION live-mixing publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#junction-live-mixing-publication-evidence--2026-08-27) | `20260827-2342` |
| 2026-08-27 | [JUNCTION road-energy pacing publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#junction-road-energy-pacing-publication-evidence--2026-08-27) | `20260827-2323` |
| 2026-08-27 | [JUNCTION authored-variation publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#junction-authored-variation-publication-evidence--2026-08-27) | `20260827-2304` |
| 2026-08-27 | [Vertigo road-scale publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#vertigo-road-scale-publication-evidence--2026-08-27) | `20260827-2245` |
| 2026-08-27 | [Flux performance publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#flux-performance-publication-evidence--2026-08-27) | `20260827-2232` |
| 2026-08-27 | [Documentation-cleanup publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#documentation-cleanup-publication-evidence--2026-08-27) | `20260827-2204` |
| 2026-08-27 | [Score engine publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#score-engine-publication-evidence--2026-08-27) | `20260827-2006` |
| 2026-08-27 | [Four-environment publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#four-environment-publication-evidence--2026-08-27) | — |
| 2026-08-27 | [Aperture ring-geometry publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#aperture-ring-geometry-publication-evidence--2026-08-27) | `20260827-1412` |
| 2026-08-27 | [Splash and Aperture publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#splash-and-aperture-publication-evidence--2026-08-27) | `20260827-1401` |
| 2026-08-27 | [Original Interstate 7 publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#original-interstate-7-publication-evidence--2026-08-27) | — |
| 2026-08-27 | [Held-brake motion publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#held-brake-motion-publication-evidence--2026-08-27) | — |
| 2026-08-27 | [Regenerative accelerator-release publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#regenerative-accelerator-release-publication-evidence--2026-08-27) | — |
| 2026-08-27 | [Driving flight-recorder publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#driving-flight-recorder-publication-evidence--2026-08-27) | — |
| 2026-08-27 | [Long Tesla report mail-limit correction](archive/DEPLOY-HISTORY-2026-09-24.md#long-tesla-report-mail-limit-correction--2026-08-27) | — |
| 2026-08-26 | [Canonical-root deployment evidence](archive/DEPLOY-HISTORY-2026-09-24.md#canonical-root-deployment-evidence--2026-08-26) | — |
| 2026-08-26 | [Modular Aperture publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#modular-aperture-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Split-view diagnostics deployment evidence](archive/DEPLOY-HISTORY-2026-09-24.md#split-view-diagnostics-deployment-evidence--2026-08-26) | — |
| 2026-08-26 | [Extended diagnostics v3 publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#extended-diagnostics-v3-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Dark Aperture and resting-chrome publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#dark-aperture-and-resting-chrome-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Forward Flux motion publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#forward-flux-motion-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Canonical cache convergence](archive/DEPLOY-HISTORY-2026-09-24.md#canonical-cache-convergence--2026-08-26) | — |
| 2026-08-26 | [Flat-grid and Plaid velocity publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#flat-grid-and-plaid-velocity-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Swiss score-field publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#swiss-score-field-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Continuous Flux morph publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#continuous-flux-morph-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Integrated speed-frame publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#integrated-speed-frame-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Continuous square-to-tunnel deformation publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#continuous-square-to-tunnel-deformation-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Vertigo environment publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#vertigo-environment-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Fixed road ceiling and refined Vertigo publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#fixed-road-ceiling-and-refined-vertigo-publication-evidence--2026-08-26) | — |
| 2026-08-26 | [Signal Gate splash publication evidence](archive/DEPLOY-HISTORY-2026-09-24.md#signal-gate-splash-publication-evidence--2026-08-26) | — |

## Latest release records

### Night Instrument interface — 2026-09-24

Canonical `20260924-1430.1b20183` is published from source `1b20183` at
https://sedicivalvole.app/. It carries the owner-selected Night Instrument
interface for the display and passenger remote, and the clean Bass Cut /
Mid Focus / High Cut filters. The previous release source is tagged
`pre-night-instrument-20260924` (`138fa6a`, live build `20260923-2255`) and its
local build is kept in `prototype/drive-lab/output/` for rollback.

The aggregate test command passed 1,102 cases; all test files pass 1,105. The
production package verified 835 exact hashes and 189 community credits.
Official read-only preflight and postflight passed network, login, exact
canonical directory and remote identity with no writes. Preserve-existing
publication uploaded 39 files / 6,572,363 bytes, verified and reused 832
static files and 29 recordings, retained two previous fingerprinted assets and
activated the dynamic root without legacy deletion.

Bare and cache-busted canonical HTML return HTTP/2 200, no-store and proxy
MISS, and equal the local 1,445-byte file at SHA-256
`d65067db59400ea2e0845aa2a62479bde60071419fbcb9150400d4898f7d0f37`.
Main JS `index-uLBUPXWx.js`, main CSS `index-BcK2uj-v.css` and the lazy phone
JS/CSS match the local build byte-for-byte. A public browser at 773 × 601
showed build `20260924-1430`, the new Intro, the gate reveal and the running
chrome with real Jamendo artwork. Tesla cabin legibility and touch, the GPU
cost of the new transitions and iPhone Safari behaviour remain physical
acceptance gates. No synthetic diagnostic mail was sent.
