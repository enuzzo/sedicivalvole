# Local listening room validation

Date: September 8, 2026. Scope: standalone research tool, not a product release.

- 111 unique stable codes and 111 prepared SHA-256 checks passed.
- 111/111 HTTP byte-range requests returned 206 and the requested 64 bytes.
- Earlier containment checks rejected parent traversal (403) and missing files (404).
- Five note assertions passed: changed-source rejection, invalid-rating rejection, 2,000-character bound, export source identity and empty export.
- Eight documentation consistency tests passed. Complete dependency-credit check passed: 196 exact lockfile entries, credits last in README.
- Actual in-app browser controls verified on isolated localhost port 8768: search V8-001 returns two original/excerpt rows; MP3 playback reaches Playing at 1x; seek-to-end reaches Finished; switching to the WAV excerpt shows exactly one Pause control; loop checkbox stays checked; AI-002 WAV reaches Playing and pauses through its button.
- A test-only Maybe rating and comment survived reload. With notes showed exactly one row. Export handler reported one note exported. Export payload identity was separately covered by the note assertions; downloaded-file bytes were not independently read.
- No browser warning/error entries in the tested interactions. The user origin on port 8767 was not given QA comments.
- Desktop viewport 1505x1045: document scroll width 1490, no horizontal overflow. Mobile viewport 390x844: document scroll width 375, stacked playable rows and comment fields. Screenshots are current local-tool captures with explicitly labeled QA notes. Viewport override was reset after testing.
- Browser playback checks establish decoding/transport behavior, not an auditory quality verdict, a seam assessment, vehicle acceptance or an all-file browser decode test. Previously documented warnings on two motorcycle MP3s remain disclosed in the catalogue.

## Design evidence and fidelity ledger

Owner selected A, Compact catalog. A generated concept was inspected before construction; it is design reference only, retained locally outside Git. Implementation screenshots were inspected after rendering.

| Anchor | Outcome |
|---|---|
| White editorial page, strong left-aligned title | Preserved |
| Right-aligned Export notes action | Preserved |
| Search/family/format/notes filter row | Preserved, stacked on small screens |
| Code / Source / Listen / Your notes columns | Preserved at desktop width |
| Circular player, fine row rules, teal active accents | Preserved; explicit volume and license disclosure added |

Above-fold copy differs deliberately: the generated reference invented authors and durations; actual catalogue authors, durations and source IDs replace them. Total is 111. Real V8-004/005 precede the later families. The additional original-speed, local-note and volume disclosures explain actual behavior. No fabricated metadata entered the implementation. Desktop and mobile captures are `listening-desktop.png` and `listening-mobile.png`; neither is a current public-product screenshot.

No version bump, public build or deployment: research-only work. The local server serves already prepared media while it remains running; restarting instructions are in tools/engine-listening-room/README.md.
