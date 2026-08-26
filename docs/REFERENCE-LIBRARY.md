# Local Reference Library: `_references/`

`_references/` is the project's single local root for external, source, or non-versionable material. One top-level `.gitignore` rule excludes the entire tree.

## Structure

| Path | Purpose |
|---|---|
| `_references/specs/bootstrap/original/` | untouched original bootstrap ZIP |
| `_references/specs/bootstrap/extracted/` | inspected extraction copies |
| `_references/repos/` | external repositories to study |
| `_references/audio/` | audio samples and sound references |
| `_references/visual/` | visual directions, generated references, and QA captures |
| `_references/inbox/` | unclassified incoming material and local diagnostic output |

## Rules

1. Keep original product source code outside `_references/`.
2. Record URL/provenance, date, author, and license for every external resource.
3. Never assume “royalty free” means redistributable.
4. Inspect scripts and binaries before execution.
5. Never modify the original bootstrap ZIP; work only on extracted copies.
6. Move material out of `inbox/` only after inventory and classification.
7. Write durable study conclusions under `docs/`, not only inside the ignored library.

## Bootstrap integrity

- Original filename: `files (1).zip`
- SHA-256: `b70b8dd0b6445822b8bb28db0d64c7f67b97600df89bb7a11fbe694610b1ef96`
- Outer and nested ZIP integrity tests: **PASS** after relocation.

The original top-level file was moved reversibly into the reference library. It was not duplicated or deleted, and its hash remained unchanged.
