# Pre-release maintenance — October 4, 2026

## Scope and starting state

The owner requested verification, maintenance and a bug hunt before release.
Starting source: `20c3ec5`, on `main`; VERSION remains `0.0.0`. Existing edits
to root `AGENTS.md` and the untracked `tools/jev-recovery-lab/` were preserved
and excluded from this work. No new feature, visual direction or dependency
upgrade was introduced.

## Confirmed defects and repairs

1. **GPS startup admission.** The App admitted a first numeric speed with an
   unusable position radius because its continuity rejection only applied
   after speed had been locked. This seeded Music/visual input and smoothing
   from uncorroborated evidence, although Engine already rejected it. Two
   tests execute the actual App watch callback: an initial 40 km/h fix and
   an implausible initial 200 km/h value, both at 9,999.99 m accuracy. Both
   failed before the fix. The same continuity gate now applies at startup;
   the first admitted successor starts smoothing directly. Later coherent
   speed-only fixes remain usable, and both neighbours of an outlier are held.
2. **Text-fit QA path.** Its central wake tap was consumed by the Air Atlas
   map, so the next Visual action timed out. The real
   keyboard Tab path now wakes chrome on every visual, including maps.
   Buttons are activated with their real Enter handler after checking visibility,
   avoiding compositor-frame pointer waits on this headless host.
   The script also requires Engine to be mounted instead of swallowing a
   failed mode selection, uses a deterministic launch with reduced motion and
   settled transitions, observes queued retraction before waking after an action,
   checks actual Sound/Brake FX toggle states and a visible, usable footer, and
   closes its isolated browser in
   `finally` on failure. Animated canvas/iframe/video backdrops are hidden
   for typography measurement, as in the existing visual baseline; this does
   not measure rendering performance or motion. Gradient names its actual
   family rather than claiming a variant the test never selected; Stats names
   the return to the running view after closing its passenger destination.
3. **Local environment.** The ignored dependency symlink pointed to an absent
   directory on the other Mac. It was restored to this host's existing
   lockfile-keyed cache after verifying every non-optional installed package
   version. Lockfile SHA-256 remains
   `a44f544f69cc5a9466bbf543e7c258075790ef4f74c60f9cea2c34a5386504d7`.
   Python 3.11 resolves the deployment-test failure produced by the system's
   older Python. No package versions changed and no secret contents were
   inspected; only the official deploy script uses its existing internal
   configuration-loading exception.
4. **Remote test timing.** A full candidate run exposed the existing 40 ms
   sleep in the saved-pair restoration test: cryptographic preparation under
   load had not reached the exchange yet. The test now waits for the actual
   exchange with the existing bounded readiness helper. Assertions about
   admission, role, exchange and non-revoking disposal remain unchanged;
   the focused GPS/remote group passes 9/9.

## Verification

| Gate | Evidence |
| --- | --- |
| Final native regression | 1,125/1,125; Python 3.11 and native wrapper, including both new GPS tests |
| New GPS regression | Both tests failed against the original callback, then passed |
| GPS/motion/tracker focused group | 22/22 |
| Dependency database | Live `npm audit`: zero advisories across 189 dependencies |
| Package/credits | 835 exact hashes; 189 exact lockfile credits |
| Public hygiene | Zero findings across 1,676 tracked text files before adding this record |
| Final compiled UI baseline | 16/16 screens on `20261004-1955.2928503`, DARK/LIGHT, Tesla and phone; no baseline update |
| Final compiled text fit | 14/14 on `20261004-1955.2928503`; actual toggle states, visible running chrome, Engine mounted, DARK/LIGHT |
| Focused code review | No actionable findings; GPS/test repairs and settled keyboard QA reviewed; final compiled gates pass |
| Official read-only preflight | Network, login, canonical directory and root/legacy identity pass; `remote_writes=NONE` |

Source checkpoint `2928503` is committed and pushed. Final build
`20261004-1955.2928503` passes all 835 hashes and VERSION/HTML identity.
Final visual and text-fit gates pass on this exact build. Canonical delivery
results are recorded below when publication and verification finish.

## Limits and next acceptance

The dependency database and focused public hygiene guard do not complete the
historical formal Security scan R06. That scan remains unresolved; no duplicate
was created and no clean full-security-audit claim is made. Recording provenance
follow-up, physical Tesla/iPhone/network/native-media acceptance and sustained
GPU/thermal behavior remain open as listed in `CURRENT-STATE.md` and the
subsystem contracts. Large lazy graphics chunks and the main entry still produce
the existing Vite size warning; no speculative bundle refactor was attempted.

All browser QA uses isolated headless contexts; the Codex internal browser was
unavailable. Synthetic diagnostic sending is intercepted by the existing QA
scripts. Browser checks do not establish cabin listening or physical touch.

Next acceptance should exercise wake → first GPS fixes → departure on the Tesla,
then the existing phone/network and low-volume listening checks on the recorded
build. A formal versioned release remains distinct from this maintenance build.
