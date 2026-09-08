# Engine listening refinement — September 8, 2026

## Owner evidence and scope

The owner listened inside Tesla to build **20260908-0807** and reported markedly
better motion, progression and braking. A second, louder listening pass described
the first three voices (Mono, Rosso, Touring) as genuinely good and requested
refinement. This is physical owner feedback, not a full acceptance of all six
voices. Otto/Cinque sounded artificial, Turbine resembled a sustained whistle,
and the first three had perceived echo/flanging. Preserve their full, deep body.
The later 0834 build changed held-GPS bank initialization, not that audible tuning.

## What real ratios establish

A gear number does not uniquely determine road speed or engine effort. Calculate
locked-driveline RPM as `km/h × 1000 / (60 × tyre circumference) × gear × final drive`.
Nominal tyre diameter is `rim inches × 0.0254 + 2 × width metres × aspect ratio`.
These calculations neglect loaded-radius deformation and clutch/converter slip.
They establish possible RPM, **not measured OEM automatic shift schedules**.

- [Porsche 911 GT3 PDK, 10/2024 official technical data](https://newsroom.porsche.com/dam/jcr:ca1882c7-1588-4a2e-995c-fe19ef1281fc/pag-911-gt3-pdk-en.pdf.PDF): seven ratios 3.75/2.38/1.72/1.34/1.11/0.96/0.84, final drive 4.54, driven rear tyre 315/30 ZR21. At 30 km/h, second is about 2,380 RPM and third 1,720 RPM. Third is mechanically plausible; the owner prefers a more deliberate second-gear urban character.
- [Toyota GR Yaris, official Japanese-market specifications](https://toyotagazooracing.com/gr/yaris/): eight-speed GR-DAT ratios 4.435/2.809/1.933/1.497/1.266/1.000/0.793/0.650, front final drive 3.329, tyre 225/40R18. The automatic strategy also considers accelerator/brake operation, and SPORT favors lower gears. Our GPS inference cannot read those pedals. At 30, second is about 2,336 RPM; third about 1,607.
- [Toyota GR Yaris Rally2 competition car](https://toyotagazooracing.com/jp/rally2/cars/): five-speed Sadev sequential transmission, not the road car's eight-speed automatic. The inspected official page gives no numerical gear set; no Rally2 RPM schedule is invented here. Competition setup is not a suitable universal city-driving map.

The following **illustrative gear choices are ours**, applied to the published
road-car ratios; they do not assert either OEM would select that gear:

| Speed | Illustrative gear | GT3 PDK calculated RPM | GR Yaris DAT calculated RPM |
|---|---|---:|---:|
| 20 km/h | 2 | 1,587 | 1,557 |
| 30 km/h | 2 | 2,381 | 2,336 |
| 40 km/h | 3 | 2,294 | 2,143 |
| 80 km/h | 4 | 3,574 | 3,319 |
| 100 km/h | 5 | 3,701 | 3,509 |
| 130 km/h | 6 | 4,161 | 3,603 |

## Implemented original calibration

The five piston profiles keep their existing fixed virtual wheel radius (0.32 m),
gear ratios and final drives. Only the second-to-third schedule changes:

| Profile | Light-load upshift | Full inferred-load upshift | Third-to-second coast threshold |
|---|---:|---:|---:|
| Mono | 38 km/h | 40 km/h | 31 km/h |
| Rosso | 38 | 40 | 31 |
| Touring | 37 | 39 | 30 |
| Otto | 36 | 38 | 29 |
| Cinque | 38 | 40 | 31 |

At steady 30, initial selection and an ascending journey use second at roughly
2,110–2,730 virtual RPM. Otto can retain third at exactly 30 while slowing, until
29; hysteresis prevents hunting. The short pre-shift approach near 40 may reach
about 3,630 RPM under load. Settled 20/30/40 remain below 3,000 RPM. The accepted
80–130 ratios and ceiling are unchanged; full-load top gear still engages before
the cap. No artificial deceleration gain duck or change to stationary TAMARRO.

## Acoustic diagnosis and changes

The inspected Engine graph goes directly to the shared master, bypassing Flux
creative effects. There is no added reverb/flanger to switch off. The cabin,
embedded recording ambience and independent loop phase relationships remain
possible contributors; owner perception alone cannot isolate their proportions.
[iZotope's processing explanation](https://www.izotope.com/community/blog/understanding-chorus-flangers-and-phasers-in-audio-production)
describes the moving phase cancellations caused by delayed copies. This informs
a cautious layering hypothesis, not a claim that the app contains that effect.

- `sample-mix.js`: smooth normalized squared sine/cosine weights favor the dominant
  on/off and low/high recording away from the crossover midpoint. At 20% load,
  the secondary weight is approximately 0.105 instead of 0.309. Total expected
  layer energy stays constant; midpoint overlap remains for continuous timbre.
  This is not dereverberation and cannot remove ambience embedded in a WAV.
- Mono: independent procedural-layer gain moves from 0.78 to 0.48, retaining its
  recording foundation and reducing competing periodic layers.
- Original piston synthesis: direct pressure weight 0.55 instead of 0.20;
  pipe returns 0.34/0.18/0.10 instead of 0.55/0.30/0.20; feedback
  0.24/0.20/0.16 instead of 0.54/0.45/0.36. Intake feedback/return also fall.
  Otto and Cinque body gains compensate part of the reduced resonant energy.
- Cinque: continuous compressor tone 0.018 instead of 0.065; timed pressure
  release and evidence-loss cancellation remain intact.
- Turbine: blade coefficient 0.010–0.026 instead of 0.070–0.150, with small
  filtered irregularity. Existing low airflow carries the body, without adding
  piston gears or a louder white-noise layer. This is an original fictional
  instrument, not an acoustically calibrated aircraft or car turbine replica.

[Allen, Rizzi, Burdisso and Okcu, NASA/NTRS 20120010346](https://ntrs.nasa.gov/citations/20120010346)
study time-varying tonal and broadband turbofan synthesis. Their finding that
short-term fluctuations improve realism motivates avoiding a perfectly steady
whistle. No measured data, synthesis code or model constants are imported.

## Verification and listening workbench

The accepted 0834 source/audio baseline is retained in ignored local references.
Final comparison uses the same 132-second browser-rendered motion route at
44.1 and 48 kHz, all six voices, original output levels and separate short A/B
clips. Signal checks cover finite output, clipping, RPM/load/gear cap parity,
city/return selection, smooth constant-power mixing, firing order, pressure-tail
decay isolated from deliberate turbo spool, and subordinate settled turbine tone.
Audio measurements do not prove listening preference in Tesla.

The existing protected Engine LAB keeps speed, inferred/explicit drive demand,
automatic/manual gears and diagnostics. Its obsolete 0.25 m/donor-ratio copy is
corrected. A new comparison/annotation interface is **proposed, not shipped**:
three directions were offered (A/B listening, technical bench, guided sequence),
with the owner's selection pending. Recommended A/B would repeat identical
inputs, keep levels explicit, and save/export local preferences and notes.
No synthetic QA mail is sent and no new third-party code or media is admitted.

Final publication identity, validation totals and measured changes are recorded
below after verification.

## Measured final comparison

At 48 kHz, original-level steady cruise RMS change relative to build 0834:

| Voice | 30 km/h | 80 km/h | 130 km/h |
|---|---:|---:|---:|
| Mono | +0.51 dB | +0.47 dB | -0.22 dB |
| Rosso | +1.26 dB | +0.77 dB | -0.05 dB |
| Touring | -0.27 dB | +0.11 dB | -0.14 dB |
| Otto | +1.09 dB | -1.54 dB | +0.69 dB |
| Cinque | +0.03 dB | -0.20 dB | -0.37 dB |
| Turbine | -0.85 dB | -0.71 dB | -0.47 dB |

These are level measurements, not loudness-matched preference scores. All twelve
132-second renders are finite and unclipped, with 130/160 road-cap parity.
[Exact source hashes and signal evidence](qa/2026-09-08-engine-refinement/audio-metrics.json).
Local source snapshots, 48 kHz full renders and short 30/80/130 clips are retained
in ignored `_references/audio/engine/listening-refinement-20260908/`; the accepted
baseline remains in `road-progression-20260908/after`.
