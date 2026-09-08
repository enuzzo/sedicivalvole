# Recorded Engine research evidence

Research only, checked September 8, 2026. No candidate entered the application.

- `audio-screening.json`: 100 decoded files, 1674.324 seconds, SHA-256, source
  formats and 24 kHz screening metrics. Two motorcycle files have decoder
  warnings. Every record explicitly states that auditory review was not performed.
- `audition-manifest.json`: eight local excerpts, exact source intervals,
  source/output hashes, original playback speed and fixed -6 dB preparation gain.
  No loudness matching, pitch shift, EQ, denoise, limiter or loop repair.
- `downloads.json`: downloaded archive/OGA hashes and four HTTP 429 failures.
  Per-preview hashes and exact source pages are in the other manifests.
- `study-sources.json`: authors, material, public contact routes, rights boundaries
  and personalized unsent thanks. These are studies, not shipped integrations.
- `environment.txt`: screening decoder and Python versions.

Read the [complete report](../../ENGINE-RECORDING-RESEARCH-2026-09-08.md) before
using any candidate. Downloaded source material remains outside Git. Eight WAV
excerpts and source/license/change notices are retained locally in the ignored
`_references/engine-recording-research-2026-09-08/` directory; they will not appear
in another clone or in a deployment. Temporary full downloads can be reacquired
from the recorded URLs through normal permitted access and verified by hash.

Reproduction requires the existing local NumPy installation plus ffmpeg/ffprobe.
Run `scripts/analyze_engine_research.py` against a directory containing the same
100 files; adding excerpts to that input directory would change the inventory.
No access-control bypass or authenticated-original download was performed.

Next work, if selected: obtain original WAVs, listen at disclosed levels, inspect
Volvo RPM markers, compare R8 channels, identify load/steady states, then prepare
and audition loop candidates. No candidate is yet approved for integration.

Use `scripts/prepare_engine_research_auditions.py INPUT_DIRECTORY OUTPUT_DIRECTORY`
to recreate the eight excerpts after acquiring the recorded inputs. The script
verifies input hashes before writing and retains source/license/change notices.
All eight outputs reproduced the manifest hashes with the recorded decoder.
