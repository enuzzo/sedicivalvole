# Game-oriented Engine audio research — September 8, 2026

## Finding

Free game-oriented engine sample packs do exist. The earlier recording survey was too narrow for the owner's question. The strongest new leads are Skril Studio's free Rotary X8 and I6 German packs. A game-ready sample bank can originate in recordings; what matters is coherent playable states, RPM/load coverage and seams. This pass also found procedural generators, AI effects and a proprietary RPM-by-throttle wavetable reference. These are distinct options, not interchangeable evidence of audible quality.

This is research and a local listening tool. No new source is integrated or deployed in sedicivalvole. No asset-store entitlement was acquired, no agreement accepted and no proprietary runtime extracted. Listening quality remains owner evaluation.

## New sources and practical fit

| Source | Format / approach | Free status | Actual result and next step |
|---|---|---|---|
| [Skril Studio Rotary X8](https://assetstore.unity.com/packages/audio/sound-fx/transportation/rotary-x8-free-engine-sound-pack-106119) | Engine sound pack for games | Listing FREE, v2.0.0, October 5, 2022, 4.8 MB; Standard Asset Store EULA, Extension Asset | Strong acquisition candidate; package bytes and individual WAV inventory not inspected |
| [Skril Studio I6 German](https://assetstore.unity.com/packages/audio/sound-fx/transportation/i6-german-free-engine-sound-pack-106037) | Engine sound pack for games | Listing FREE, v2.0.0, October 4, 2022, 5.3 MB; same EULA classification | Strong acquisition candidate; not yet in the listening catalogue |
| [SFXMint](https://sfxmint.com/category/mechanical) | Generated engine effects, WAV/MP3 | [CC0 declared](https://sfxmint.com/license), AI origin disclosed | Three unchanged WAVs downloaded and pinned as AI-001–003; not a coherent RPM/load bank |
| [CrunchySFX / Alex Cassells](https://crunchysfx.com/) | Procedural browser synthesis; WAV, sample-rate/bit-depth/channel and loop controls | Generated outputs CC0; application rights reserved; imported audio retains its rights | Useful free authoring tool; no engine-specific calibrated bank established; no output or code imported |
| [omgaudio / Cradlefall](https://omgaudio.vercel.app/) | Procedural editable presets including vehicle/spaceship sounds; WAV/MP3 export | Generated outputs declared CC0 | Useful designed-effect candidate; no combustion model or coherent RPM bank established; no code/audio imported |
| [SoundsFree](https://www.soundsfree.art/) | Web Audio effects, WAV export | Free commercial outputs claimed; MIT footer's exact scope unresolved | Generic effects only in this study; no bank or output acquired |
| [AK Engine Synth / Aleksandr Khilko](https://akaudio.com/en/portfolio/akenginesynth.html) | Physical-model preprocessing into a binary two-dimensional RPM × throttle wavetable | In-house R&D; no free download established | Architecture reference only, not a free asset lead; no runtime, presets or parameters imported |
| [Andy Farnell / Applied Scientific Press](https://aspress.co.uk/sd/practical22.html) | Pure Data combustion pulses, jitter and exhaust models; .pd patches | Examples publicly accessible; exact reuse license unresolved on inspected pages | Study explanations only; no code/audio imported |
| [Flowlab Nightloop](https://flowlab.io/nightloop/) | Browser effects/music; WAV/MP3 and MIDI workflows | Free no-sign-up tool, commercial output use claimed | Generic authoring workflow, not an engine sample bank; no runtime/output imported |

Skril Studio's [product catalogue](https://skrilstudio.com/asset-products/) identifies Attila Szlacki and describes game integration products. Its [official Lite manual](https://skrilstudio.com/Docs/Realistic%20Engine%20Sounds%202%20Lite%20Edition%20Documentation.pdf) names I6 German Free and Rotary Free among engine sets. Counts for the paid collection must not be attributed to the two free packs. An exact free-pack sample count seen only in a secondary listing was not adopted.

The [Unity Asset Store terms](https://unity.com/legal/as-terms), Appendix 1, distinguish embedded Licensed Product use from standalone asset redistribution and define Extension Asset seat terms. FREE is a price, not CC0. A downloadable raw-audio research website is not automatically permitted by a finished-product license. Ordinary official acquisition and exact package inspection are the next steps before planning use. This pass does not assert that source recording ownership was independently verified.

## Three immediately testable additions

The [public SFXMint API documentation](https://sfxmint.com/api/docs) exposes the published sounds without authentication. Only GET metadata and published WAV downloads were used; no generation request was submitted. The following are PCM16 stereo WAVs at 44.1 kHz, byte-identical to the published download hashes:

| Listening code | Published source | Duration | SHA-256 |
|---|---|---:|---|
| AI-001 | [Small Motor Whirring / mechanical-engine-01](https://sfxmint.com/sounds/mechanical-engine-01) | 8 s | `fb95f9cf90ad058aa7d6c70692e67f6eb242a3c907110db970b8922b5451c3f8` |
| AI-002 | [Revving / mechanical-engine-02](https://sfxmint.com/sounds/mechanical-engine-02) | 6 s | `76deccbd11d251a913d8d649020c84c570afddc29482535f40a4fa8e107399ff` |
| AI-003 | [Idling / mechanical-engine-03](https://sfxmint.com/sounds/mechanical-engine-03) | 2 s | `85362e642545c914737a7cb4f512f773f2c9e33bb3eedfe1389bbabb903b7d5c` |

Saved API responses record Stable Audio 3 origin, `loop_status: not_requested` and `loopable: false`. The idle prompt explicitly asks for room reverb: that is a prompt-level conflict with the project's dry Engine goal, not an auditory finding. Independent generated clips do not prove stable engine identity across RPM. The site declares CC0; do not repeat blanket zero-risk marketing or infer independently verified training/recording provenance.

## Listening deliverable

[Engine Listening Room instructions](../tools/engine-listening-room/README.md). Selected direction A: compact filtered catalogue, a player and notes per code. It includes all 100 files from the previous numerical survey, all eight prepared excerpts and the three additions above: **111 entries**, not 111 unique engines. Source levels and preparation are disclosed; `-X` excerpts retain the previous preparation recipe. A single audio element prevents overlapping takes and plays at 1x. Loop merely repeats the file; it does not certify or create a seamless loop.

Audio is kept in ignored `_references/engine-listening-room/media`, with a tracked code/source/hash catalogue and generated source notices. The server is localhost-only and does not expose the repository. Notes stay in localStorage at the exact browser origin, keyed by code and verified against the source hash; JSON export is the sharing mechanism. There is no automatic note transmission, import or cloud synchronization.

## Search discipline and continuation

New searches targeted free game engine banks, ready RPM loops, procedural vehicle synthesis and alternative formats. Domains from the previous pass were excluded from direct follow-up visits. Search result snippets occasionally contained prior domains, but those sites were not reopened. Multiple pages within a newly discovered domain were used to verify its claims. Previously acquired local files and attribution records were reused without browsing their source sites.

Do not reopen these already covered groups for another discovery pass without a specific new reason: Freesound, OpenGameArt, GitHub, itch.io, muted.io, Sonniss, Wikimedia Commons, Creative Commons, arXiv/DOI, Hugging Face, forge.a-lec.org, SourceForge, Speed Dreams, hdl.handle.net/repositorio.itm.edu.co, linktr.ee, imagefilm.berlin, YouTube, FFmpeg, BigSoundBank and Reddit. Add this pass's domains: skrilstudio.com, assetstore.unity.com, unity.com, sfxmint.com, crunchysfx.com, omgaudio.vercel.app, soundsfree.art, akaudio.com, aspress.co.uk and flowlab.io. Public contact links recorded in credits are not evidence that those contact pages were visited or a message sent.

Recommended next work: acquire the two official free Skril packs through the ordinary account workflow, inventory their actual state/RPM/load coverage and audition alongside the current catalogue. Prioritize coherent original states over many pitch-shifted copies. Separately evaluate whether a procedural exhaust/turbo layer improves a chosen real bank. Do not implement a new sound architecture merely because an export format looks convenient. No verified SFZ/SF2 engine bank was found in this bounded pass; this is not a claim that none exists.
