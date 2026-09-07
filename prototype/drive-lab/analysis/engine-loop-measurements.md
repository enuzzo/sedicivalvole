# Admitted Engine loop measurements

Read-only native-file analysis. No audio file was written or replaced. Exact hashes and full channel/period details are in `engine-loop-measurements.json`.

## Native wrap boundaries

The wrap step is the absolute first-minus-last sample at the current full-file loop. Values below use the worse channel; the p99.9 ratio is also the worse channel. The flag is an uncalibrated listening-priority cue, not a claim that a click was heard.

| Profile / role | Format | Duration (s) | Maximum wrap step (FS) | Maximum wrap / interior p99.9 | Review flag | Strongest spectral peak (Hz) |
|---|---|---:|---:|---:|---|---:|
| mono / on_high | PCM 16, 48000 Hz | 11.149 | 0.68341 | 3.946 | YES | 113.4 |
| mono / on_low | PCM 16, 48000 Hz | 9.384 | 0.19373 | 1.929 | — | 114.1 |
| mono / off_high | PCM 16, 48000 Hz | 9.492 | 0.70541 | 4.944 | YES | 113.8 |
| mono / off_low | PCM 16, 48000 Hz | 5.937 | 0.65820 | 6.755 | YES | 114.5 |
| rosso / on_high | IEEE_FLOAT 32, 44100 Hz | 10.905 | 0.01145 | 0.163 | — | 256.1 |
| rosso / on_low | IEEE_FLOAT 32, 44100 Hz | 4.716 | 0.09194 | 1.182 | — | 196.4 |
| rosso / off_high | IEEE_FLOAT 32, 44100 Hz | 10.256 | 0.14710 | 1.732 | — | 263.3 |
| rosso / off_low | IEEE_FLOAT 32, 44100 Hz | 2.514 | 0.00000 | 0.000 | — | 233.0 |
| touring / on_high | IEEE_FLOAT 32, 44100 Hz | 3.142 | 0.04819 | 0.267 | — | 360.8 |
| touring / on_low | IEEE_FLOAT 32, 44100 Hz | 4.195 | 0.00000 | 0.000 | — | 210.3 |
| touring / off_high | IEEE_FLOAT 32, 44100 Hz | 5.374 | 0.00000 | 0.000 | — | 378.9 |
| touring / off_low | IEEE_FLOAT 32, 44100 Hz | 4.222 | 0.00000 | 0.000 | — | 211.0 |

No file declares a `smpl` loop region. Cue markers, where present, do not establish loop boundaries. Mono uses PCM16 at 48 kHz; Rosso and Touring use IEEE float32 at 44.1 kHz. All are stereo.

## Decoded-tail repair experiment

A 10 ms complementary raised-cosine blend replaces only the tail in memory. It blends the old tail into the unchanged first 10 ms, then repeats from frame L (`loopStart = L/sampleRate`, `loopEnd = N/sampleRate`). The new last sample equals original sample L−1, making the repeat join the original neighbouring pair L−1→L. The blend starts with the untouched old tail sample. Convex weights bound peak by the original peak; they can cause a brief local cancellation. Repeated duration is 10 ms shorter. This is waveform repair, not a pitch or RPM calibration.

| Mono role | Selected by threshold | Prepared maximum wrap step (FS) | Steady-loop RMS change (dB) |
|---|---|---:|---:|
| on_high | YES | 0.00851 | -0.00196 |
| on_low | NO | 0.04263 | +0.00035 |
| off_high | YES | 0.05551 | -0.00124 |
| off_low | YES | 0.06973 | -0.00456 |

The corresponding original runtime helper is `src/engine/loop-seam.js`; its 4,096-bin p99.9 upper bound selects the same three native files. A 0.08 FS floor and 3.5× outlier ratio retain Mono on_low and every Rosso/Touring loop unchanged. These thresholds are explicit bank-derived tuning seeds. The helper's dedicated tests verify native selection, exact repaired joins, unchanged head/body samples, bounded peaks, less than 0.02 dB per-channel steady-loop RMS change, idempotence and original encoded hashes. The analysis itself does not activate the helper.

## Period candidates and uncertainty

Nine evenly placed one-second windows supply autocorrelation candidates from 20–800 Hz and channel-power Hann spectra from 20–4,000 Hz. Windows may overlap and are not independent corroboration. The JSON includes candidate spread, supporting-window count and correlation. Zero padding helps interpolate a peak but does not improve the one-second physical resolution. Stereo channel powers are summed to avoid cancellation from a mono downmix.

Several candidate periods coexist for each sample. For example, Mono's spectra cluster around 113–114 Hz while correlations also favour approximately 28 or 57 Hz. These may be different orders of one cyclic excitation; they cannot establish crankshaft RPM, cylinder count or firing order. All `inferred_rpm` fields deliberately remain null. Do not replace the donor's RPM metadata or pitch law from this evidence alone.

## Reproduce

Requires the existing NumPy installation and Node with TypeScript stripping support; no SciPy or new package is needed. From the repository root:

```sh
python3 prototype/drive-lab/analysis/engine_loop_audit.py
node --test prototype/drive-lab/tests/engine-loop-seam.test.mjs
```

Use a Python environment containing NumPy (this run: 2.3.5). The script first validates a known 120 Hz periodic/stereo-antiphase fixture and a deliberately damaged boundary, then verifies every admitted file against its inventory SHA-256 and size. Profile roles and declared RPM labels come directly from the current configuration module. The output records analyzer, configuration and inventory hashes. The script does not perform a listening test, browser resampling/render test, loudness matching, transmission/limiter analysis or physical-Tesla acceptance.
