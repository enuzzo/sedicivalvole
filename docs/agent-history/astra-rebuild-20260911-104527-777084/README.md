# Astra agent-layer reconstruction archive

Local migration, September 11, 2026. Historical/audit material only; instruction snapshots use `.txt` and are outside automatic discovery. Do not read this archive for ordinary product tasks.

## Provenance

The three input files were restored working-tree originals, byte-identical to `2c73cc5b1a0dfe9aa8e14205050d7fc060f59427` (2026-09-10 14:08:44 +02:00), directly preceding experimental commit `0662548`. Captured HEAD remains `9e3abe06687482e4163a8552f57973c7414a8be4` on main. No rollback was repeated and no index was restored.

| Original path | Exact pre-migration copy | SHA-256 | Mode |
| --- | --- | --- | --- |
| `AGENTS.md` | [AGENTS.md.txt](AGENTS.md.txt) | `6c2ff415a534ea1ed5938e89cc145bbfe3119bc3d3c4e9e7696559f6d0c52328` | `644` |
| `prototype/drive-lab/AGENTS.md` | [prototype__drive-lab__AGENTS.md.txt](prototype__drive-lab__AGENTS.md.txt) | `cc276a1906df86ffc9616c2b38feb26363eafbbbcccf7c642ece9ff400be3ce1` | `644` |
| `docs/reconciliation/MANUAL-RECOVERY-PROMPT.md` | [docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt](docs__reconciliation__MANUAL-RECOVERY-PROMPT.md.txt) | `655629bc1493401f9998ec2b398fc9a34135583e4a694f32131925b0220816ad` | `644` |

`initial-state.json` records original status, HEAD/branch/index hash and fingerprints/modes/presence for 1,804 non-ignored, non-sensitive paths. Sensitive/local secret paths, private `_references`, dependencies and ignored build/runtime output are excluded. Content was fingerprinted for preservation, not exposed as binary/source dumps. `initial-index-entries.txt` preserves the read-only staged inventory, not an index replacement.

`initial-instruction-diff.patch.txt` is the restored state versus HEAD before this migration. `session-instruction-diff.patch.txt` compares the three actual initial working files with the final entrypoints; it does not conflate the previous experiment rollback with this task. `final-state.json` records the verified delta and output hashes.

## Audit artifacts

- [Complete migration map](MIGRATION-MAP.md): 223 source units with exact source spans/wording, disposition, active destination and consult condition.
- `source-units.json` and `migration-decisions.json`: inspectable machine-readable forms of the same mapping.
- [Sources and design](SOURCES-AND-DESIGN.md): official sources, local discovery inventory, rationale, conflicts and three document-routing simulations.
- [Validation](VALIDATION.md): checks actually executed and their limits.

## Recovery without losing other work

To undo only this migration under a later owner request, first compare the current three instruction files and `docs/agent-guide/` against `final-state.json`, preserving any intervening changes. Copy the corresponding `.txt` **bytes** above back to their original paths and restore the recorded file modes. This recovers the precise starting working-tree instructions, not HEAD. The historical recovery prompt is restored as evidence only, never automatically executed.

If no later content depends on it, retire only the newly created `docs/agent-guide/` directory after preserving subsequent changes. Keep this archive for provenance; do not modify/remove any older archive. Do not restore CHANGELOG, re-create the eight removed `docs/agent-context` files, touch product files, alter the index or perform a bulk reset/clean/stash. The starting working tree intentionally differed from HEAD. Recovery is a documented method, not an operation performed here.
