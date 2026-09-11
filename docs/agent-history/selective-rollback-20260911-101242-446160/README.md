# Selective agent-instruction rollback evidence

Historical reference only; do not load during normal work. Instruction copies use .txt outside automatic discovery. Existing historical archives remain untouched.

## Provenance and recovery

Captured before selective restoration, including uncommitted root calibration and all eight corrected context cards. Baseline: `2c73cc5b1a0dfe9aa8e14205050d7fc060f59427`, September 10, 2026 at 14:08:44 +02:00. It is the direct parent of the first migration `0662548`, September 11 at 09:07:44 +02:00, and its three original instruction blobs match the pre-gpt6-astra snapshots byte-for-byte. The cutoff is September 11 at 08:00 +02:00 (06:00 UTC). Timestamp alone was not the selection criterion.

This recovers the last committed instruction state; no claim is made about unrecorded local edits at the cutoff. HEAD and branch remain at their captured positions; the index is not restored or changed. Changelog and all product work stay untouched.

`state.json` records branch/HEAD, initial status, index hash, source-copy hashes, modes and unaffected-file hashes. `index-entries.txt`, `git-history.txt`, `reflog.txt` and `agent-working-tree.patch.txt` preserve Git provenance. Baseline copies use the `baseline__` prefix. To recover the experimental working files, copy the corresponding .txt bytes back to each original path in the table and restore its recorded mode, only under a future explicit authorization. Do not apply the patch blindly; it describes pre-rollback differences against the recorded HEAD.

| Original path | Current experimental copy | SHA-256 |
| --- | --- | --- |
| `AGENTS.md` | [AGENTS.md.txt](AGENTS.md.txt) | `9d780e24739ef666cf0674aa7f9ede77f80f30c6d8734f5fb0f4a6d9ad21afc6` |
| `prototype/drive-lab/AGENTS.md` | [prototype__drive-lab__AGENTS.md.txt](prototype__drive-lab__AGENTS.md.txt) | `3516ed501ebcf34142b0a419fd833265d1056795ab0ff13815241130daba8762` |
| `docs/reconciliation/MANUAL-RECOVERY-PROMPT.md` | [docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt) | `e53fc9fe3b72ce01e782c62ab1efde1e39d2f273e92c69bdadbd601e2b9801f9` |
| `docs/agent-context/diagnostics.md` | [docs__agent-context__diagnostics.md.txt](docs__agent-context__diagnostics.md.txt) | `617be0fab9d68759fc133d5ff871e6e808f4db98c9e6793214a7a2663b979039` |
| `docs/agent-context/engine.md` | [docs__agent-context__engine.md.txt](docs__agent-context__engine.md.txt) | `c5ae33b66c7897cf59521c0df0cc0fa9428853631b4cee2300535d0e472782c8` |
| `docs/agent-context/maps.md` | [docs__agent-context__maps.md.txt](docs__agent-context__maps.md.txt) | `92e9a622f576fe19ce8acb09822191143fb991d97539ca993be3725d3fc0edfd` |
| `docs/agent-context/music.md` | [docs__agent-context__music.md.txt](docs__agent-context__music.md.txt) | `acd08e26d60c2cdfabd8df4920fc38581b4481cbd620bcd436e0363e2ef621ad` |
| `docs/agent-context/release.md` | [docs__agent-context__release.md.txt](docs__agent-context__release.md.txt) | `1705bc78e08aee1afe8298df5021c7f685b7c6e7a58e385cef1a1eece5ff8915` |
| `docs/agent-context/runtime.md` | [docs__agent-context__runtime.md.txt](docs__agent-context__runtime.md.txt) | `8b1ce4c802ca65dae0fb61c7261b847709bcbfd66a278f383f327e8691645714` |
| `docs/agent-context/ui.md` | [docs__agent-context__ui.md.txt](docs__agent-context__ui.md.txt) | `2077da1d77bdc3689627e51105c1bb10a0e382dee9d31d7a2b40218fc61cc971` |
| `docs/agent-context/visuals.md` | [docs__agent-context__visuals.md.txt](docs__agent-context__visuals.md.txt) | `22f2265cd515c031a90d08e873e3939b3d2a826a6bb33eca505817d7623e2cbe` |

## Preserved experiment and audit findings

The two original migration commits remain reachable in unchanged Git history. Earlier stages remain in `../pre-gpt6-astra/` and `../pre-context-corrections-20260911-100025-955484/`. Current copies above preserve the final autonomy/completion/check calibration and the subsequent contextual corrections.

The audit was delivered in the conversation, not as a separate repository artifact. This is a concise record of its findings, not a verbatim transcript: entry-file compression did not prove semantic coverage; global skill triggers were not changed; Night Glass Ambient was superseded by Lounge; Music needed the primary-surface exclusions, shared 130 km/h normalization and exact replacement-queue contract; Engine needed explicit manual/automatic GPS, mute and RPM feedback; UI/Maps needed running-media alignment, correct geometry references and independent Discover navigation; root needed single-writer scope; runtime/release needed environment recovery and experimental maturity. Targeted cross-links and exact headings were added. The unresolved location-sidebar handle question was retained in maps.md, with conflicting sources and the future change requiring owner resolution. All of this corrected content is preserved above, even though it is being removed from active routing.

Secret/local reference contents are excluded from inspection and hashing. Ignored runtime/build directories were not touched. Verification covers the tracked and pre-existing non-ignored checkout files outside the explicit restoration paths; the tool operations write only the selected paths and this new archive.
