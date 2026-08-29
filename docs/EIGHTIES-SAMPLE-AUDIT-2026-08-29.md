# 1980s Source Library Audit — 2026-08-29

Status: **complete source admission and objective inventory; score authorship in
progress; listening acceptance open**.

## Authorization and provenance

The product owner explicitly authorized direct inspection and offline analysis
of the ignored `_references/` library on 2026-08-29. Raw source WAV files remain
ignored and must not be committed, served or redistributed.

The two admitted 1980s libraries are published by the MusicRadar Team through
SampleRadar:

| Local library | Canonical source | Local files | Source terms |
|---|---|---:|---|
| `80s Pop Drums` | [183 free 80s pop drums samples](https://www.musicradar.com/news/sampleradar-free-80s-pop-drums-samples) | 182 WAV | royalty-free use in music; no redistribution |
| `musicradar-eighties-samples` | [502 free 80s samples](https://www.musicradar.com/news/sampleradar-free-80s-samples-1) | 502 WAV | royalty-free use in music; no redistribution |

The first source page says the pack originated with *Future Music* and describes
four kits, seven tempo-labelled loop folders and gated snares. The second says
the construction kits originated with *Computer Music* and names the same six
native tempos present locally: `93`, `117`, `118`, `120`, `125` and `126 BPM`.
The local 182/183 discrepancy is recorded rather than silently repaired; no
source file was downloaded or invented during this audit.

## Reproducible inventory

Run from `prototype/drive-lab`:

```sh
npm run analyze:eighties
```

The ignored JSON report records relative path, SHA-256, pack, kit, instrument,
rhythmic role, declared BPM/key, duration, estimated bar count, RMS, sample
peak, crest factor, transient density, stereo correlation and a cautious
chroma-based chord proposal for all **684 WAV files**. Filename declarations
and analysis proposals are separate fields. A low-confidence proposal is not a
harmonic fact.

### Objective summary

| Library | Material | Native tempo | Duration | RMS range | Sample-peak range |
|---|---|---|---:|---:|---:|
| 80s Pop Drums | 47 grooves, 38 fills, 97 one-shots | 85, 95, 110, 120, 125, 130, 140 BPM | 442.927 s | −41.629 to −10.767 dBFS | −21.880 to −0.226 dBFS |
| 502 Eighties | 108 bass, 234 harmony, 60 lead, 31 grooves, 10 percussion, 59 hits | 93, 117, 118, 120, 125, 126 BPM | 2309.782 s | −46.288 to −8.536 dBFS | −21.025 to 0.000 dBFS |

The near-zero source peaks make raw stacking unsafe. Every admitted source must
be gain-normalized before arrangement, and every rendered complete performance
must pass loudness and true-peak measurement after encoding.

## Compatibility findings

The six tonal construction kits are internally coherent only at the narrow
`kit + root tag + variant` boundary. Their declared root sets are:

| Kit | BPM | Declared roots | Instrument families |
|---|---:|---|---|
| 06 | 93 | A, C, E | bass, guitar, lead synth, pad synth |
| 02 | 117 | B, D, G | bass, electric piano, guitar, pad, synth lead |
| 04 | 118 | A, C, E | bass guitar, synth bass, guitar, synth pad |
| 03 | 120 | C, E, G | bass, electric piano, guitar, lead synth, pad |
| 01 | 125 | A, E, G | bass, guitar, piano, strings |
| 05 | 126 | A, C, E | bass, clavy synth, lead synth, pad synth |

Matching root names across kits do **not** prove that two performances share a
progression, phrasing, voicing or downbeat. The chroma estimator's margins are
frequently small, especially for bass and melodic loops, so cross-kit tonal
layering remains rejected until listening and stronger harmonic evidence agree.

The drum-only library is the safe native-tempo spine for the new score: all
`95–140 BPM` grooves are exact two-bar recordings; `85 BPM` has four exact
two-bar grooves plus five one-bar alternatives. Because these sources are
unpitched and every section will render to one mixed eight-bar performance,
they can support one project-authored A-minor harmonic grammar without forming
a metadata-compatible collage. Fast `120–140 BPM` drumming is reserved for the
high-speed form rather than exposed during urban driving.

## Admission decision

1. Use the Pop Drums grooves, fills and selected one-shots only during offline
   authorship. Normalize them before mixing and publish no isolated source.
2. Build one A-minor tonal grammar in project code and one primary groove at a
   time. A tempo change selects a native recording at an eight-bar boundary;
   it never changes a browser playback rate or falsifies displayed BPM.
3. Retain the six construction kits as reviewed source material, but do not
   automatically layer tonal loops across kits. Their internally synchronized
   stems may enter later only as complete, auditioned families.
4. Ship only encoded, self-contained, mixed eight-bar performances with bounded
   decoded memory, recent-take avoidance and no source loop/stem endpoint.
5. Treat objective analysis as curation evidence, not human listening or
   real-Tesla acceptance.
