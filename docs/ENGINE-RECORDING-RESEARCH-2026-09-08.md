# Recorded foundations for Engine

## Decision

The most useful next comparison is **snafic's Ford V8 versus cr4sht3st's nominal 3000 RPM Corvette recording** for an eight-cylinder foundation; **Arto Koivisto's Volvo S60 pack** for a documented inline-five; and **C-V's start-cart recording versus imagefilm.berlin's Cessna start** for a turbine foundation. **GiocoSound's BMW 120d** is the strongest alternative organized by engine state, if a distinct diesel voice is welcome. These are research priorities, not approved replacements or a best-sounding ranking.[^1][^2][^5][^6][^7][^8]

None of the reviewed sources is yet an accepted, complete bank covering the required road response. The principal gaps are lossless-original access, verified listening, RPM calibration, steady-load coverage, and seam quality. The Volvo pack additionally requires retaining its separate noncommercial audio conditions. Keeping the currently appreciated Mono, Rosso and Touring untouched remains the appropriate product baseline.

This report records evidence checked on September 8, 2026. It adds no runtime, preset, production asset or deployment. The listening complaint's exact build remains unspecified; the source baseline is `b2c8453`. In that source, Otto, Cinque and Turbine have empty `sounds` maps in `prototype/drive-lab/src/engine/profiles.js`. That establishes their lack of the sampled foundations under review, not an independent diagnosis of everything heard in the vehicle. See the [owner listening record](ENGINE-LISTENING-REFINEMENT-2026-09-08.md).

## Evidence and acceptance

Three evidence classes are kept separate throughout:

- **Source verified:** a named creator or distributor, an exact asset page and its current declared license, with recording details where supplied. A platform label is not independent proof of original ownership.
- **Bytes screened:** downloaded audio was decoded and measured. Hashes identify the exact bytes. A compressed public preview does not establish the original WAV's peak behavior, bandwidth or edit quality.
- **Listening accepted:** a listener has evaluated timbre, artifacts and progression in the intended system. **This class is empty in this research.** No direct auditory judgment by the assistant, owner selection of these candidates, or target-Tesla acceptance is claimed.

The local inventory contains **100 audio files and 1,674.324 decoded seconds** (27 minutes 54 seconds), including duplicate representations of some source material. This is not 100 independent engines or 28 minutes of auditory review. Eight short auditions retain the original playback speed and use a uniform **−6 dB** preparation gain, with no EQ, denoising, pitch shift, limiting or seam repair. They are not loudness matched.

The [screening inventory](qa/2026-09-08-engine-recordings/audio-screening.json), [audition manifest](qa/2026-09-08-engine-recordings/audition-manifest.json), and [download evidence](qa/2026-09-08-engine-recordings/downloads.json) distinguish measured files from metadata-only leads. Local audition WAVs and their notices are in the ignored `_references/engine-recording-research-2026-09-08/` directory. They are excluded from Git, the application and publication. The complete downloaded source archive is temporary local material under `/tmp/sedicivalvole-engine-research-20260908`; the tracked hashes and source URLs survive its removal.

## Shortlist

| Candidate | Documented source / original format | License on the specific source | Preparation state | Recommended role and material gap |
|---|---|---|---|---|
| snafic, Ford Galaxy V8 takes 1–2 | Two recordings, 110.620 / 66.009 s; 44.1 kHz, 24-bit stereo WAV | CC BY 4.0 | Both public MP3 previews screened; excerpts prepared | First V8 character audition; no numeric RPM or load labels |
| cr4sht3st, `med.wav` | Claimed Corvette LS6 at 3000 RPM; 6.035 s, 44.1 kHz, 16-bit mono WAV | CC0 1.0 | Exact asset page verified; bytes unavailable | Strong nominal-RPM anchor; one state, not a complete bank |
| Arto Koivisto / el-bee, Volvo S60 | Four recordings; 2.4-litre inline-five, stock exhaust; 96 kHz, 24-bit mono WAV | CC BY-NC 4.0 | All four asset licenses checked; originals not acquired | Best exact Cinque research lead; RPM markers and contamination require original-file inspection |
| C-V, Jet Engine Start Cart | Start/shutdown; 162.375 s, 48 kHz, 16-bit stereo WAV | CC0 1.0 | Asset page verified; audio retrieval blocked | First turbine acquisition priority; no calibrated sustained spool bank |
| imagefilm.berlin, Cessna turbine start | Airfield recording; 177.125 s, 48 kHz, 24-bit stereo WAV | CC BY 4.0 | Metadata only | Second turbine candidate; environmental noise and stationary spans unverified |
| GiocoSound, BMW 120d | Twelve-file set, inside/outside engine states; checked steady files are 48 kHz, 24-bit stereo WAV | Checked idle/low/medium/high outside assets and medium inside: CC0 1.0 | Five individual steady-state pages verified | Best organized alternative donor; low/medium/high lack numeric RPM |
| Jonas Jocys, Audi R8 | 128.338 s, 48 kHz, 24-bit stereo WAV; separate microphone perspectives | CC BY 4.0 | MP3 preview screened; excerpt prepared | Reserve character candidate; cylinder count is unspecified |

Formats and engine descriptions above come from the creators' pages, not inference from filenames or spectral peaks.[^1][^2][^3][^5][^6][^7][^8] A listing's word “stereo” does not establish useful stereo capture; channel behavior is separately measured below.

## Otto and other combustion voices

### Ford and Corvette

The Ford pack supplies longer source takes with a direct recording attribution. Its stated vehicle is an approximately 1970s “Ford Galaxy”; precise model year, displacement and operating loads are unknown. Preserve that spelling and uncertainty rather than attaching an unsupported specification. The first preview has a stable-level four-second region beginning at 16.25 s; take two at 36.75 s. Those windows prioritize inspection, not looping acceptance.[^1]

The Corvette asset is unusually useful because the creator supplies a nominal 3000 RPM value. That is a better calibration starting point than a forum guess from the loudest spectral peak, but it remains creator-supplied metadata rather than measured tachometer evidence. The same uploader's `idle.wav` describes a different vehicle, a 1975 Pontiac Firebird: combining the two must not be presented as a coherent recording session from one engine.[^2]

The recommended V8 experiment would first compare the unprocessed originals at fixed source speed, then test a small, explicitly bounded transposition range. It should not span idle to redline by stretching one midrange loop. If the source cannot retain its identity across adjacent bands, obtain more states or reduce the proposed range rather than compensate with a dominant synthetic oscillator.

### R8 and Maserati

Jonas Jocys documents a Sound Devices 633 and two microphones: an MKH416 above the vehicle and an SE-electronics wide-cardioid microphone behind it. The channels should therefore be auditioned separately before summing. The R8 badge alone does not establish whether this recording is a V8 or V10. A clipping complaint in the page comments is disputed by the creator; it remains a disputed claim, not an accepted defect.[^3]

The Maserati GranTurismo S recording by lmartins explicitly provides a V8 with starting, revving and idle. Its original is already a **64 kbps M4A**, not a lossless master. The Wikimedia OGG mirror is the same recording and does not count as independent material or restore missing detail. It is a useful character reference with a weaker source-format ceiling than the Ford originals.[^4]

### BMW and motorcycles

GiocoSound separates outside and inside start, stop, idle, low, medium and high states. Outside idle, low, medium and high are respectively 3.117, 2.110, 2.804 and 2.036 seconds. Their specific asset pages declare CC0; that verification is narrower than a license audit of all twelve files. An authored diesel experience is a legitimate alternative, but it should not be relabelled as Otto or Cinque simply because the material is organized conveniently.[^5]

dklon's self-recorded motorcycle collection contains seventeen engine MP3s and a kickstand sound. The supplied filenames do not identify individual makes or link takes into engine-specific banks. Two files produce decoder warnings (`090912-001.mp3` and `090913-011.mp3`); all decode to measurable output, but that is not a clean decode gate. The collection remains a conditional alternative under CC BY-SA 3.0, with model identification and source repair still open.[^12]

## Cinque

The strongest precisely identified inline-five lead is **Volvo S60 Engine Ramp Test**, recorded by Arto Koivisto, publishing as el-bee. The four assets pair engine-bay and exhaust perspectives for start/idle and uphill second-gear acceleration/deceleration. The originals reportedly contain RPM markers. Idle files last 42 seconds and ramps 46 seconds. A stock 2.4-litre inline-five is stated; turbocharging is not established.[^6]

This pack also documents limitations honestly: the engine-bay ramp received a steep high-pass filter because of wind exposure; the exhaust recording has reported airflow contamination above 4000 RPM and decelerates after 6000 RPM. These observations are the author's, not results of this report's listening. The two microphone tracks must not be blindly layered, and the original WAV markers must be inspected before relying on them for calibrated slices.[^6]

CC BY-NC 4.0 does not automatically rule out a noncommercial sedicivalvole integration, but it is a separate license with its own definition and downstream constraints. A future adaptation must keep the attribution **Arto Koivisto**, link the source/license, identify edits, and retain applicable noncommercial restrictions. The project's PolyForm Noncommercial license cannot be substituted for the audio license. No new permission or contact request is needed merely to continue private research.

A second valuable lead is Luisa Fernanda Durango Bermúdez's 2021 **Awesome Car SFX Library** thesis and metadata at Instituto Tecnológico Metropolitano. It documents an Audi TT RS 2020 recording inventory and other cars. The available thesis and metadata establish a research lead; they do **not** establish access to the audio bank or permission to redistribute it. Thesis publication consent is not an asset license. This lead stays outside the ready-to-audition shortlist.[^22]

## Turbine

A replacement should contain identifiable rotating machinery, not merely broadband air noise. That is a design requirement arising from the rejected breath-like result, not a claim that every real turbine recording automatically sounds better. A useful donor needs recoverable tonal structure and sustained operating regions without speech, nearby handling, wind buffeting or room coloration dominating the intended voice.

C-V's CC0 start-cart field recording is the first acquisition priority. The creator identifies a J79 and a start/shutdown sequence; the hardware identification is not independently corroborated. imagefilm.berlin's Cessna start is an alternative with a documented Zoom H5 airfield recording and requested website attribution. Neither source is yet a proved multi-spool loop set.[^7][^8]

qubodup's **Jet Turbine Noise** is accessible and has a CC0 label, but it is derived from an unnamed US-government video. The original agency and rights chain were not established. Its preview is suitable for a local reference audition, not an asset-clearance conclusion. kyles' **motor industrial turbine spinning** is another accessible CC0-labelled mechanical recording, but the brief description does not identify an aircraft engine. It should retain its industrial identity.[^9][^10]

The Wikimedia **T-9 Jet Engine Test Cell** video offers a more explicit provenance trail: a US Department of Defense publication involving a B-1B engine at Tinker, with a public-domain review on Commons. That is stronger source documentation than an unattributed government claim. US public-domain status nevertheless should not be described as an unconditional worldwide rights determination for an Italian publisher. It remains a reference pending source/jurisdiction review and audio extraction.[^11]

Two secondary sources are less attractive: DerrickMckinnon's jet start is already a 22.05 kHz mono MP3; craigsmith's turbine-room recording is an archival Hollywood transfer whose original rights chain is not established by its CC0 upload label. Neither should outrank a directly documented recording solely because it is easy to download.[^23][^24]

Some search results titled “jet engine” openly describe substitutes such as a heater or whistles and rumble. They are excluded from the recorded-engine shortlist. A plausible title and a permissive license do not prove the requested physical source.[^29]

## Packs, games and misleading shortcuts

**muted.io Performance Cars** provides 68 numbered WAVs under a distributor-declared CC0 license. Downloaded originals are all 96 kHz, 24-bit, two-channel PCM, totalling 647.190 seconds; there are no embedded format tags or an accompanying vehicle/RPM/recordist inventory. The site's owner Seb is identified, but per-recording authorship is not. This is a large screening pool, not a cleared, labelled engine bank.[^13]

All 68 files have channel correlation rounded to 1.00000 in the 24 kHz screening decode. Accordingly, useful spatial stereo is not demonstrated by their two-channel containers. A numerical stable-level search prioritizes files 029, 039 and 002 for listening; it does not establish what engines or actions they contain. File 029 has a prepared local excerpt specifically labelled **unidentified**.

qubodup's Opel Astra 1.6 16V source has a separate four-second loop archive. The archive's selectable CC BY 3.0 license differs from the source recording's current CC BY 4.0 option. The two archive WAVs are original-level 96 kHz/24-bit and normalized 44.1 kHz/16-bit representations of the loop. Their measured RMS differs by approximately **20.24 dB**. A casual audition would strongly favor the louder version without proving any timbral improvement.[^14]

domasx2's six racing loops are explicitly **one source pitched into six versions**. They do not supply six independently recorded RPM timbres. The page records a historical source replacement; a complaint about the superseded source's old license must not be applied indiscriminately to the current pack. The current CC0 declaration still merits tracing to the referenced original before an import.[^15]

DerMeehdrescher's **Generic V8 Engine Sound** has two lossless acceleration/deceleration WAVs under CC BY-SA 4.0, but the actual files last only **1.099 and 1.035 seconds**. The page does not document recording method or vehicle, so physical versus synthesized origin is unresolved. pauliuw's two CC0-labelled “Engine sounds2” MP3s similarly lack useful provenance; their science-fiction tags alone do not prove synthesis.[^16][^17]

NOX Sound's vehicle collection is a promising broader CC0 lead, with 161 advertised sounds inside a larger pack. Exact engine models, sustained-state coverage and individual bytes were not audited. It should remain a bounded follow-up, not inflate the verified inventory.[^18]

Speed Dreams' sound directory is useful because its November 2024 credit document names original recordings and June Ravenmoon's edits. A pinned directory snapshot at `5ee49962064902d70cb702952d567ffccebf752c` links V8 derivatives to cr4sht3st, Ears68 and Heigh-hoo; V10/V12 sources are also named. The attempted four V8 downloads returned HTTP 429, so no claims about their audio bytes are made. Some other entries say CC BY without an exact version or refer to YouTube: those are not fully cleared by the game's general license. The repository-wide tree response was truncated; the complete sound-directory listing, not that tree, supplied the inventory evidence.[^19]

Stunt Rally's own maintainer documents a switch to engine-sim-generated RPM layers, then identifies unresolved licenses in community engine setup files. This is the maintainer's risk assessment, not a universal legal rule about all simulation output. The current material is neither a straightforward bank of real recordings nor a clean shortcut through asset-level licensing.[^20]

Jreo SVA explicitly supplies synthesized audio. Its audio uses CC BY 4.0 while its code uses MIT; conflating those licenses would be an error. Robin Doerfler's procedural dataset supplies extensive RPM/torque annotations, but the sounds are generated and the dataset is CC BY-NC 4.0. Both can inform organization or testing, not satisfy the request for a recorded foundation.[^21][^25]

Sonniss's free GDC bundles illustrate a different boundary: permission to incorporate sound in a finished production does not authorize redistribution of raw assets in this public repository. The checked EULA is version 2.0, effective August 27, 2026. No bundle was downloaded. VDrift's software license likewise does not establish the licenses of its separately hosted car data; no cleared bank is claimed from it.[^26][^27]

## Signal findings and reproducible auditions

The screening uses a 24 kHz floating-point decode with original channel count. Whole-file RMS, sample peak, channel correlation and mono-sum energy are calculated. Candidate four-second spans minimize the coefficient of variation of sixteen 250 ms RMS blocks above a relative silence gate. This selects **level stability only**; no RPM, sound-source classification or perceptual quality score is inferred.

| Measured file | Level-stable span | Whole-file RMS | Mono sum relative to channel RMS | Interpretation |
|---|---:|---:|---:|---|
| Ford take 1 preview | 16.25–20.25 s | −23.46 dBFS | −0.52 dB | Inspect this span and nearby transitions |
| Ford take 2 preview | 36.75–40.75 s | −22.63 dBFS | −3.31 dB | Evaluate individual channels before summing |
| R8 preview | 48.75–52.75 s | −22.12 dBFS | −3.30 dB | Different mic perspectives; correlation is −0.07969 |
| Maserati preview | 12.50–16.50 s | −14.45 dBFS | approximately 0 dB | Correlation is 1.00000; no stereo benefit demonstrated |
| qubodup jet preview | 26.25–30.25 s | −7.41 dBFS | −2.20 dB | Much louder than V8 previews; provenance remains unresolved |
| kyles industrial turbine preview | 12.25–16.25 s | −18.83 dBFS | −1.03 dB | Mechanical reference, not established aircraft audio |
| muted.io 029 original | 6.75–10.75 s | −19.43 dBFS | approximately 0 dB | Stable level; vehicle/action unidentified |
| Opel original-level loop | 0–4 s | −28.57 dBFS | −0.86 dB | Existing four-second loop; quality and seam not accepted |

The R8 and Ford take-two mono losses do not independently prove audible comb filtering. Near-independent channels naturally lose about 3 dB when averaged; differences in microphone placement and phase require frequency-dependent inspection and listening. The measurements do justify comparing left, right and summed versions before choosing a production perspective.

Several decoded MP3 previews exceed digital full scale in floating point: the R8 reaches approximately +3.23 dBFS and the jet +3.78 dBFS. Lossy decoding and resampling can produce overshoots. This does **not** prove that the original recording clipped, nor does the absence of full-scale samples prove it did not. The audition preparation's −6 dB gain preserves headroom for these measured excerpts without silently limiting them.

The auditions deliberately do not pretend to be complete loops. Most contain twelve seconds around the screening region; the muted excerpt contains ten and Opel four. Use the manifest's exact source intervals to inspect the surrounding original performance. The second V8 take and R8 should receive channel-separated auditions during the next evaluation, using originals rather than relying on preview stereo.

Reproduce the numeric inventory with Python 3, NumPy, ffmpeg and ffprobe:

```sh
python3 scripts/analyze_engine_research.py \
  /tmp/sedicivalvole-engine-research-20260908 \
  /tmp/engine-audio-screening.json
```

Recreate the eight excerpts from verified local inputs with `python3 scripts/prepare_engine_research_auditions.py INPUT_DIRECTORY OUTPUT_DIRECTORY`. The preparation manifest records the edits and source licenses; the same decoder reproduced all eight recorded output hashes.

The analysis script neither downloads nor edits audio. The tracked environment record captures the decoder version. Source download hashes and individual audio hashes prevent a changed mirror from silently becoming the same candidate. Two motorcycle decode warnings remain explicitly recorded; the inventory's successful completion must not be reported as an all-clean audio validation.

## Asset permission boundaries

| Asset terms | Finished application | Public raw/edited asset repository | Required treatment |
|---|---|---|---|
| CC0 1.0, legitimate rights holder | Generally allowed | Generally allowed | Retain provenance voluntarily; dedication does not verify the uploader's ownership |
| CC BY 3.0 / 4.0 | Allowed with conditions | Allowed with conditions | Correct version, creator, source/title where applicable, license and edit history; no conflicting blanket restrictions |
| CC BY-SA 3.0 / 4.0 | Conditional, preserve applicable audio obligations | Conditional, preserve ShareAlike for adaptations | Keep audio separate and appropriately licensed; do not automatically claim the whole application must change license |
| CC BY-NC 4.0 | Only within the license's noncommercial scope | Conditional with retained restrictions | Do not replace with PolyForm terms or assume their definitions are identical |
| US-government public domain claim | Jurisdiction/source dependent | Jurisdiction/source dependent | Verify actual source and international applicability before claiming worldwide clearance |
| Sonniss GDC EULA | Production incorporation permitted under terms | Raw standalone redistribution restricted | Outside the public-raw-asset shortlist |
| No exact asset license or unresolved chain | Unresolved | Unresolved | Study only; do not infer permission from the host repository's code license |

These are source-screening conclusions, not assurances of title or a transfer of liability. Creative Commons expressly notes that other rights may remain relevant. For any selected integration, snapshot the exact license, identify the original and edited file hashes, retain third-party exceptions, and synchronize `THIRD_PARTY_NOTICES.md`, `LICENSE-SCOPE.md`, `NOTICE`, README credits and the asset change inventory before publication.[^28]

## Proposed next comparison

1. **Acquire originals through ordinary permitted access.** Prioritize Ford, Corvette, Volvo, C-V, Cessna and the four BMW exterior steady states. Freesound public pages expose previews, while original download links require login. Later direct requests returned 403 and a browser request was blocked; those access boundaries were not bypassed. Use normal authorized download access if the owner elects to continue.
2. **Create a source-only listening sheet.** Compare full-speed recordings first, with original gain documented. Then add a separately labelled level-matched copy for preference comparisons. Score mechanical identity, low-end body, whine/air balance, environmental contamination, fatigue and usable duration. Keep “not assessed” distinct from a poor score.
3. **Prove one coherent bank.** Inspect source markers and pitch structure, label idle/low/mid/high plus available load/coast states, and preserve a consistent microphone perspective. Do not mix different vehicles under an asserted single-engine identity. An RPM claim needs creator metadata or defensible analysis with uncertainty, not the strongest spectral bin.
4. **Prepare seam candidates outside the product.** Record sample boundaries, crossfades and any filtering; test repeated joins, modest transposition and adjacent-band blends. Reject loops with unstable periodic artifacts, repeated transients, or missing body that can only be concealed by loud synthesis. These are future acceptance checks, not already passed gates.
5. **Use the existing protected A/B LAB only after candidate selection.** Preserve one active take, original-level disclosure, stable calibration identifiers, and the accepted Telemetry visual. Public defaults remain unchanged during comparison. Road validation must retain restrained urban response, strong 80 km/h character, progression through 130 km/h, dry output, GPS/lifecycle behavior and neutral TAMARRO.

The first decision should be an actual listening preference, not a commitment to install every attractive library. Ford/Corvette offer the best focused V8 path; Volvo is the exact inline-five lead with explicit license and recording caveats; C-V/Cessna are the strongest turbine acquisition leads. BMW is a well-organized alternative if a different engine personality wins. No current evidence justifies replacing three rejected synthesized voices with three arbitrarily pitched copies of one recording.

## Sources

The numbered notes link directly to the exact source pages. Dates below are publication dates where available; all were consulted on September 8, 2026. Recording specifications and licenses are creator/distributor declarations unless the report explicitly identifies a local measurement.

[^1]: snafic. *Ford Galaxy - V8*, April 10, 2020: [pack 28791](https://freesound.org/people/snafic/packs/28791/), [take 1 / 512704](https://freesound.org/people/snafic/sounds/512704/), [take 2 / 512703](https://freesound.org/people/snafic/sounds/512703/). Vehicle description, two original formats, CC BY 4.0 and public previews.
[^2]: cr4sht3st. [*med.wav*, June 1, 2012](https://freesound.org/people/cr4sht3st/sounds/157144/) and [creator profile](https://freesound.org/people/cr4sht3st/). Corvette/3000 RPM statement, CC0 and distinction from the differently identified idle recording.
[^3]: Jonas Jocys. [*Audi R8 Idling Reving Backfire.wav*, January 30, 2019](https://freesound.org/people/Jonas_Jocys/sounds/457733/). Recording perspective, original metadata, CC BY 4.0 and disputed comment.
[^4]: lmartins. [*Maserati GranTurismo S*, April 2, 2019](https://freesound.org/people/lmartins/sounds/465453/); [Commons derivative](https://commons.wikimedia.org/wiki/File:Maserati_GranTurismo_S_Exhaust.ogg). Original compressed format and CC BY 4.0.
[^5]: GiocoSound. [*Car_Sound_BMW_120d*, September 6, 2017](https://freesound.org/people/GiocoSound/packs/22622/): [outside idle 401552](https://freesound.org/people/GiocoSound/sounds/401552/), [outside low 401556](https://freesound.org/people/GiocoSound/sounds/401556/), [outside medium 401555](https://freesound.org/people/GiocoSound/sounds/401555/), [outside high 401551](https://freesound.org/people/GiocoSound/sounds/401551/), [inside medium 401547](https://freesound.org/people/GiocoSound/sounds/401547/). Individual formats and CC0 declarations.
[^6]: Arto Koivisto / el-bee. [*Volvo S60 Engine Ramp Test*, July 29, 2022](https://freesound.org/people/el-bee/packs/35809/): [engine idle 644881](https://freesound.org/people/el-bee/sounds/644881/), [exhaust idle 644880](https://freesound.org/people/el-bee/sounds/644880/), [engine ramp 644879](https://freesound.org/people/el-bee/sounds/644879/), [exhaust ramp 644878](https://freesound.org/people/el-bee/sounds/644878/). Recording method, contamination, markers and CC BY-NC 4.0.
[^7]: C-V. [*Jet Engine Start Cart.wav*, October 5, 2023](https://freesound.org/people/C-V/sounds/704945/). Field-recording description, original format and CC0.
[^8]: imagefilm.berlin. [*Cessna private jet turbine starting*, recording August 2024](https://freesound.org/people/imagefilm.berlin/sounds/761480/). Airfield/microphone description, CC BY 4.0; requested attribution [imagefilm.berlin](https://www.imagefilm.berlin/).
[^9]: qubodup. [*Jet Turbine Noise.flac*](https://freesound.org/people/qubodup/sounds/205581/). Declared CC0; derivative government-video source whose originating agency remains unresolved.
[^10]: kyles. [*motor industrial turbine spinning.flac*](https://freesound.org/people/kyles/sounds/453477/). Title-level mechanical description and CC0.
[^11]: US Department of Defense / Wikimedia Commons contributors. [*T-9 Jet Engine Test Cell*, August 13, 2013](https://commons.wikimedia.org/wiki/File:T-9_Jet_Engine_Test_Cell.webm). Source publication and Commons public-domain review; [linked original video](https://www.youtube.com/watch?v=IzwspwZHeeY).
[^12]: dklon. [*Engines - Startup, Idle & Rev*, June 21, 2016](https://opengameart.org/content/engines-startup-idle-rev). Creator's recording statement, archive and CC BY-SA 3.0.
[^13]: muted.io. [*Performance Cars*, November 14, 2020](https://muted.io/performance-cars/), [about](https://muted.io/about/) and [credits](https://muted.io/credits/). Distributor CC0 statement, archive and site identity; no per-recording authorship established.
[^14]: qubodup. [*Car Engine Loop 96kHz, 4s*, February 19, 2012](https://opengameart.org/content/car-engine-loop-96khz-4s) and [Opel source recording 147243](https://freesound.org/people/qubodup/sounds/147243/). Separate loop/source license versions and available representations.
[^15]: domasx2. [*Racing car engine sound loops*](https://opengameart.org/content/racing-car-engine-sound-loops). Explicit single-source pitch variants and source-replacement discussion.
[^16]: DerMeehdrescher / Meehdrescher Studios. [*Generic V8 Engine Sound*, February 28, 2022](https://opengameart.org/content/generic-v8-engine-sound). Two-loop description, requested attribution and CC BY-SA 4.0.
[^17]: pauliuw. [*Engine sounds2*, December 9, 2010](https://opengameart.org/content/engine-sounds2). Two MP3 downloads and CC0; source mechanism unspecified.
[^18]: NOX Sound Design. [*Essentials Series SFX*](https://nox-sound-design.itch.io/essentials-series-sfx-nox-sound). Advertised vehicle collection and CC0 statement; public [contact routes](https://linktr.ee/Nox_Sound).
[^19]: Speed Dreams contributors / June Ravenmoon and named recording creators. [*SoundCredits.txt*, pinned commit 5ee4996](https://forge.a-lec.org/speed-dreams/speed-dreams-data/raw/commit/5ee49962064902d70cb702952d567ffccebf752c/data/data/sound/SoundCredits.txt), November 29, 2024 entries; [2024 project retrospective](https://speed-dreams.net/en/blog/saying-goodbye-to-2024). Specific derivative/source mapping; [Ears68 original](https://freesound.org/people/Ears68/sounds/260445/) was not independently retrieved.
[^20]: CryHam / Stunt Rally contributors. [*Data development notes*](https://github.com/stuntrally/stuntrally3/blob/main/docs/data.md), December 24, 2024 and April 18, 2025 entries. Simulation layers and maintainer-reported community-source licensing concern.
[^21]: Jreo. [*Jreo SVA*](https://jreo.itch.io/jreo-sva) and [g4-svd](https://github.com/jreo03/g4-svd), inspected tree `2b20c4cf972dd1c37460d1963e34619a23789ae2`. Synthesized audio and separate audio/code licenses.
[^22]: Luisa Fernanda Durango Bermúdez. [*Awesome Car SFX Library*, Instituto Tecnológico Metropolitano, 2021](https://hdl.handle.net/20.500.12622/5641); [metadata attachment](https://repositorio.itm.edu.co/server/api/core/bitstreams/5c3e6d11-f791-4c19-991e-6cd15ab99499/content). Recording inventory study only; audio rights/access not established.
[^23]: DerrickMckinnon. [*Starting of jet engine*, February 25, 2025](https://freesound.org/people/DerrickMckinnon/sounds/789950/). Original MP3 specifications and CC BY 4.0.
[^24]: craigsmith. [*S28-19 Engine room; high whine from turbines.wav*](https://freesound.org/people/craigsmith/sounds/675727/). Archival transfer history and upload's CC0 declaration; original rights unresolved.
[^25]: Robin Doerfler. [*Procedural Engine Sounds* dataset card](https://huggingface.co/datasets/rdoerfler/procedural-engine-sounds/blob/main/README.md), [Zenodo record](https://doi.org/10.5281/zenodo.16883336), [related paper](https://arxiv.org/abs/2603.07584). Generated rather than recorded sound and CC BY-NC 4.0.
[^26]: Sonniss. [*GameAudioGDC bundles*](https://sonniss.com/gameaudiogdc/) and [bundle license v2.0, August 27, 2026](https://sonniss.com/gdc-bundle-license/). Finished-production versus standalone-asset permissions.
[^27]: VDrift contributors. [Software repository](https://github.com/VDrift/vdrift) and [separate vehicle data](https://sourceforge.net/p/vdrift/code/HEAD/tree/vdrift-data/). Separate source/data boundary; no asset clearance claimed.
[^28]: Creative Commons. [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). Attribution, adaptation, sharing and other-rights boundaries.
[^29]: rockittt. [*Jet engine (Faked)*, February 28, 2022](https://freesound.org/people/rockittt/sounds/622406/); Cell31_Sound_Productions. [*Jet Engine-Close.wav*, November 25, 2022](https://freesound.org/people/Cell31_Sound_Productions/sounds/661160/). Explicitly disclosed substitute sound sources; no audio imported.
