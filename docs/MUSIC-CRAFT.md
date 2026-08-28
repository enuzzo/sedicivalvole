# Music Craft

Status: **living document**. This is the project's accumulated musical
knowledge — theory, production technique, and the specific mistakes this
codebase has actually made and fixed.

It is not a rulebook and it must never be used as one. Every entry exists
because something sounded wrong and the reason was found; a rule that stops
someone writing good music is a bad rule and should be deleted. Where an entry
constrains, it says why, and the why is always something a listener noticed.

**Keep it current.** Whenever a musical defect is diagnosed, a technique is
researched, or a way to make the score better is discovered, record it here in
the same session. `AGENTS.md` requires it.

---

## 1. The mistakes this project has made

These are all real. Each one shipped, was heard, and was traced.

### 1.1 Transposing a melody twice

The theme was written as semitone offsets above the chord root and then added to
`chord.bassMidi`, which already carried that root, *and* to `chord.rootOffset`,
which carried it a second time. Over `Dbmaj7` the theme played A-C-E-G against
Db-F-Ab-C — a semitone clash on two voices at once.

It was reported as sounding "like a child playing notes with no awareness". That
is exactly what a double transposition sounds like, because it is not a wrong
choice of note, it is arithmetic.

**The lesson.** Decide once whether a line is written in the key or written
relative to the chord, and never let both be true. If a chord record carries the
root, nothing else may.

### 1.2 Folding each note into range separately

A sampled instrument has a finite range. Folding an out-of-range note down by
octaves until it fits seems obviously right and is obviously wrong: two notes a
few semitones apart can need different numbers of octaves, and the interval
between them inverts. A line rising from B4 to D5 came out of the piano as B3
falling to D3.

**The lesson.** Fit the *line*, not the note. Choose one whole-octave offset for
a whole phrase and apply it to every note in it. Every interval then survives
exactly. `fitOctave` in `scripts/sample-library.mjs` does this.

### 1.3 A chord that was never actually a chord

The pad was monophonic and played one note of each chord. The harmony the whole
score was written around had never sounded: a bass root, a single colour tone,
and a melody. Reported as "the harmony is monotonous", which it was, because
there was barely any.

**The lesson.** Check that what you believe is playing is playing. A snapshot in
the diagnostics is cheaper than a year of wondering why it sounds thin.

### 1.4 A tempo that escalated

An early engine ramped 110 to 174 BPM with speed. It sounds like a record being
played faster, which is the one thing this product must never do.

**The lesson.** See §3.

### 1.5 An effect that was an attenuator

The brake filter swept to 200 Hz. That removes so much of the signal's energy
that it reads as the volume being cut rather than as the mix going under water.
Reported as "it practically zeroes the volume".

**The lesson.** A filter is not a fader, but past a certain depth it becomes
one. If an effect should change character and not level, measure the level and
make the measurement a test. `tests/score-brake.test.mjs` does.

### 1.6 No dynamics at all

The piece hit the limiter at a standstill exactly as hard as at the ceiling. An
arrangement that gains six lanes across a drive gained no weight, because the
limiter handed back whatever was added.

**The lesson.** Adding parts does not make music louder if something downstream
is holding the ceiling. Leave headroom for the arrangement to grow into: the
resting state should sit several decibels below the full one *before* the
limiter is asked for an opinion.

### 1.7 Treating every sample as the same kind of material

JUNCTION originally treated performed loops and chromatic multisamples as if
both were generic notes. The result ignored finished performances and then
folded independently played notes into the wrong octave (§1.2).

**The lesson.** Ask what the material already is. A chord one-shot is a supplied
performance waiting to be arranged; a chromatic multisample really is an
instrument waiting to be played. Keep the loop native and complete. For the
multisample, request an exact recorded note, derive it from the chord currently
voiced, and reject the build if that note is absent.

---

## 2. Consonance: the rules worth knowing

The only two intervals that reliably sound like a mistake:

- a **minor second** — two notes one semitone apart in the same register;
- a **minor ninth** — an octave plus a semitone, which beats almost as badly.

Everything else is available. In particular these are *good* and a naive checker
will wrongly reject them:

| Interval | Over | Name | Verdict |
|---|---|---|---|
| Semitone apart in **pitch class**, octaves apart in register | anything | — | fine, and common |
| G over Dbmaj7 | major 7th chord | ♯11 | the characteristic colour of the chord |
| D over Cm7 | minor 7th chord | 9th | warm, standard |
| F over Abmaj7 | major 7th chord | 13th | standard |

So a consonance check must compare **actual voiced pitches**, not pitch classes.
`tests/score-harmony.test.mjs` builds the chord as it is really voiced and looks
for distances of exactly 1 or 13 semitones.

### 2.1 The avoid notes that actually caught us

- **The fourth over a dominant chord.** Ab over Eb7 is a minor ninth above the
  chord's third. Suspending the chord — Eb9sus4, where the fourth replaces the
  third — turns the problem note into the chord's own colour.
- **The root above a major seventh.** Ab above Abmaj7's G, in the same octave,
  is a hard minor second. Voice the chord as a **sixth** instead: Ab6 is softer
  and the clash disappears.
- **A ninth landing under the melody.** Fm9 puts G directly below a theme's Ab.
  Voice it as an **eleventh** instead: Fm11 puts the extension a tone clear.
- **A flattened fifth in the middle of the chord.** Gm7♭5's Db sat a semitone
  under the theme's C in one voicing and a minor ninth above it in another. A
  **shell** — root, third, seventh, no fifth — solved it, and the chord still
  functions because the bass carries the root.

### 2.2 Writing one line over several chords

A fixed melody over a moving progression is stronger than a melody dragged
around by the chord roots, *provided* the progression stays in one key. Pick the
notes that are chord tones or consonant extensions of every chord in the cycle.
In F natural minor, F, Ab, C, Eb and G work over Fm7, Dbmaj7 and Abmaj7 alike.

Two things a checker must get right, and both bit us:

- a theme of 32 steps over a 4-bar section is heard **twice**, so a note at step
  8 sounds over bar 0 *and* bar 2. Check both, not just the first.
- a held note sounds over the chord it **runs into**, not only the one it starts
  on.

### 2.3 Bass lines and transposition

A bass line may transpose with the harmony where a melody may not, because it
uses so few degrees. But name the **degree**, never the interval: a fixed seven
semitones is wrong over any chord with a flattened fifth. `bassInterval` reads
the fifth from the chord itself.

---

## 3. Tempo, and why it barely moves

The perceptual rule this project is built on: **the music must never sound like
a recording being slowed down or sped up.**

So tempo moves between 162 and 176 BPM with a sharp knee — a range small enough
that a driver never hears the piece "speed up", and mostly spent by urban speed.
What changes with the vehicle instead is *interpretation*:

- **subdivision** — half-time at rest, full break at speed. This is what makes a
  standstill sound slow without the clock being slow, and it is the single most
  effective device in the whole system.
- **density** — how many lanes are playing.
- **orchestration** — which instrument states the theme.
- **register** — the same theme, played higher.
- **articulation** — ghost-note weight, hat subdivision.
- **space** — reverb and delay open as the arrangement releases.

For a sampled score the same rule takes a stronger form: the tempo is a
**folder**, not a stretch factor. Loops are recorded at 158 through 172 BPM, so
a tempo change is a change of *recording* at its own native rate. Nothing is
ever time-stretched. This is not a compromise — it is better than stretching,
because there is no artefact to hide.

---

## 4. Arrangement over time

### 4.1 Continuous versus structural

A hard boundary, and the reason GPS jitter cannot dismantle the music:

- **continuous** — brightness, filter pressure, drive, space, dynamics, ghost
  weight, hat subdivision. These follow smoothed energy every block.
- **structural** — scene changes, lane entries and exits, fills, section
  changes. These happen only on a bar or phrase boundary, behind hysteresis,
  dwell and a minimum tenure.

### 4.2 How fast to move

Both directions were wrong once and the fix was not symmetrical:

- **Climbing** one scene per phrase left the piece resting for ten seconds while
  the vehicle was already moving. Resolve the thresholds to a fixed point, but
  **cap the climb** — two scenes per boundary — so the arrangement still builds
  and the announcing fill has something to announce.
- **Thinning** should not be capped. A vehicle that has genuinely stopped must
  not keep playing a full break.
- **Order matters more than speed.** Queue lane exits from the top of the
  arrangement down. Removing the kick while the break detail still chatters over
  it reads as the music breaking, not thinning.

### 4.3 Silence is a part

At a true standstill the piece plays a phrase and then leaves one. A resting
arrangement held continuously is unbearable at a red light. But *moving slowly
is not a standstill* — gating the whole half-time band this way emptied out
everything below thirty km/h, which was its own defect.

The entrance is part of the orchestration too. FRACTURE once opened with its
principal theme and sub already active; listeners experienced the repeated,
hard-edged synth attack as a "keyboard" before the journey had begun. The fixed
entry is atmosphere alone. Low end and pulse join with movement, while the
melody waits for the BREAK scene and a phrase boundary. A score can establish
its world before it states its tune.

### 4.4 What preserves identity

Identity does not require every identifying part to play continuously. The
atmosphere belongs to the resting scene and never exits; the sub and principal
theme may leave after a sustained stop and return only when movement supports
them. This makes the score recognizable without turning its motif into an
alarm. A reduced arrangement is not silence, and ambience is not an empty state.

---

## 5. Mixing

### 5.1 Stereo

A mix measured at 3.6% width is mono, whatever it sounds like on headphones.
What fixed it:

- the low end and the backbeat stay **centred** — a car's two speakers must
  reinforce them, not smear them;
- everything carrying **detail rather than weight** is placed off-centre, with a
  constant-power pan law so nothing changes level as it moves;
- a **mid/side width trim that stays mono below 140 Hz**, so widening never
  cancels the bass;
- the pad through a **stereo chorus**, so the harmony is the widest thing and
  the rhythm stays tight.

Do not put the saturator on the placed material: driving it folds the field back
to the middle.

### 5.2 Space

- One **shared room** for the whole arrangement. Several instruments each in
  their own reverb sound like several recordings.
- **Pre-delay of 20–30 ms** keeps the attack in front of the room and makes the
  space read as larger. 26 ms here.
- **Filter the send** top and bottom. A tail carrying the fundamental is mud; a
  tail carrying the top is hiss.

### 5.3 Separation

Everything except the kick and the sub is high-passed before the bus. Without it
the pad, the bass and the break all pile into the two octaves that carry weight
and the mix reads as mud at speed. The reese is high-passed above the sub's own
octave: they share a root, and without separation they cancel as often as they
add.

### 5.4 Making a sample sound played

A sampler that plays the same file at the same level every time is the loudest
tell that nothing is being performed. Reported here as sounding like "a cheap
keyboard". The treatment, in order of how much it matters:

1. **Per-note variation** — gain, sample start offset, a cent or two of detune.
   This matters more than every effect combined.
2. **Saturation** — sampled instruments are too clean and too static to sit in a
   mix alone.
3. **Width** — a drifting mid/side spread, not a delay, so it survives mono.
4. **Reverb with pre-delay** — see §5.2.
5. **Tone** — roll off the top, high-pass the bottom.

Sources: Sound on Sound, [Using Reverb &
Delay](https://www.soundonsound.com/techniques/using-reverb-delay); Music Guy
Mixing, [How to Use Reverb on Piano for Depth and
Fullness](https://www.musicguymixing.com/reverb-on-piano/).

### 5.5 A container does not turn samples into music

JUNCTION was proposed as hundreds of source recordings concatenated into one
opaque blob. That changes the filename, not what the browser receives: the
recordings remain extractable and it is still a redistributed sample bank.
MusicRadar permits using the material in music and asks that the samples not be
redistributed, so the product boundary must be musical as well as technical.

The shipped bank therefore contains a mixed, processed 1,280-bar production,
not playable source files. Each of the eight energy states has 20 complete
eight-bar takes, for 160 rendered clips built from 134 distinct source
recordings, with different two-bar break phrases, exact-note multisampled
motifs, harmonic voicings, density, drive and space. The single downloadable bank is
segmented into independently decodable performance clips. The browser keeps at
most six clips decoded, starts two distinct complete takes on the same
sample-accurate boundary, and moves an equal-power balance between them while
varying bounded tone, stereo position and tempo-related delay. This solves four
faults at once: a two-bar loop no longer exposes its repetition immediately,
the source recordings are not offered as a library, the browser creates a
continuum rather than selecting one of only 24 fixed outcomes, and the Tesla
does not decode a hundred-megabyte PCM bank into memory.

The reason a listener notices this distinction is form: variety must arrive as
an intentional change of musical pressure, harmony and orchestration, not as a
random sample roulette or a short loop restarting under a new effect.

Randomness therefore needs grammar. Choosing two entire prepared takes at the
same eight-bar boundary already used by the adaptive arrangement makes the
result less predictable without breaking a fill, changing harmony under a
sustained sound, or placing a sample merely because it was available. Their
shared tempo, duration, harmony **and exact rhythmic spine** make live mixing
safe; unrelated stems would not. Four entries of recent-listening memory prefer
families, rhythm groups and takes that have not just played, rather than merely
rejecting one immediate duplicate.

### 5.6 Energy is not a permanently loud break

JUNCTION's first adaptive bank played at 168 BPM in every state. Even after it
gained three takes, the first break layer entered at full gain and the bassline
ran at rest. A listener therefore heard almost only the beat, and 30 km/h felt
like maximum attack. More samples did not solve the musical fault because the
score had no meaningful absence from which rhythm could arrive.

Rest now contains only sparse supplied chord performances and their spatial
tails. The break and bassline are genuinely absent. Near 13 km/h a native 127
BPM break enters below the harmony and rises over four two-bar phrases; later
states use native 135, 158, 164 and 168 BPM recordings. Nothing is stretched in
the browser, and 168 BPM is a high-energy ceiling rather than the permanent
floor. The maximum primary-break gain is bounded at 0.55, additional layers sit
at 0.20, and energy still grows through orchestration, drive, punctuation and
space rather than tempo alone.

Bass variation must also remain harmonic. The available tempo folders do not
all contain the same roots, so each two-bar chord chooses the first available
consonant bass: root first, then a safe inversion or fifth. Choosing a filename
randomly would reintroduce the exact pitch fault that authored variation is
supposed to prevent.

The listener notices this as scale: stopping creates air, urban speed has room
to groove, and a full Jungle break means something because it was not already
there. The assertable parts — beatless rest, rising low-speed beat envelope,
native tempo ladder, bounded break level, gapless sections and take
anti-repetition — live in `tests/junction-bank.test.mjs`.

### 5.7 File count is not perceived variety

The first real drive exposed a useful contradiction: JUNCTION contained 104
clips assembled from 126 recordings, yet the listener heard approximately ten
ideas. The runtime was selecting different breaks and voicings correctly, but
every take followed the same four-chord progression and the same broad lead
identity. Random file choice was working; musical identity was not changing.

JUNCTION now has five authored families. Each family owns a different compatible
four-chord route, rhythmic punctuation, played motif and dedicated multisampled
voice — Rave Lead, Rave Piano, Rave Saw, Short String or Stab FX. Every energy
state contains four takes from every family, divided into two rhythm-locked
pairs. At an eight-bar boundary the browser first prefers a family outside the
four-entry recent window, then mixes two takes only inside one rhythm group.
This keeps harmony and drums safe while making the change large enough to be
heard. High-energy states also trigger more exact chord-tone colour performances.
The rebuilt bank has 160 complete clips while retaining the six-decoded-clip
bound; the raw source-file count is intentionally no longer treated as the goal.

The listener also found 40–60 km/h too urgent. Native tempo selection now keeps
40 km/h in the 127 BPM state and 60 km/h in the 135 BPM state; 158 BPM begins
only above approximately 65 km/h. The rule is tested at the road speeds the
listener named, rather than only at abstract energy fractions.

The general lesson: count **families, progressions, colour events and exposed
take pairs**, not only assets. The diagnostic flight recorder now reports those
exposure counts so a future drive can distinguish “the randomizer did not
rotate” from “it rotated technically but the writing still sounded the same.”

### 5.8 Loading is not an entrance

The first JUNCTION production correctly kept its rest state free of beat and
bass, yet the listener still heard a small piece of music immediately after
`PLAY THE ROAD`. The ambient harmony was musically valid but functionally acted
as an unwanted audio splash: the driver had not moved, so the road had not given
the score a reason to enter.

Preparation and audibility are separate responsibilities. JUNCTION may load,
decode and schedule its beatless rest take behind the launch gesture so it is
ready on a slow connection, while its own final output gain remains zero through
`4 km/h`. A smooth score-local gate reaches full level at `10 km/h`, before the
quiet native-tempo break enters near `13 km/h`. The global master is not used for
this rule because stopped-vehicle FRACTURE voice auditions must remain audible.

The listener notices intention rather than latency: silence follows the launch,
motion introduces atmosphere, and rhythm still has its later threshold. The
movement gate is a pure tested mapping in `tests/junction-bank.test.mjs`; this
prevents a future preload optimization from accidentally restoring launch music.

### 5.9 Two correct breaks can still make one wrong groove

The listener heard occasional drum and rhythmic lines that did not fuse. Both
takes were individually complete, equal in length, tempo-compatible and
harmony-compatible, but the browser was cross-mixing different break patterns.
Mathematical alignment at the bar line does not make two drummers play the same
groove: their kicks, ghosts and fills can still flam or mask one another.

The live mixer now treats rhythm as a compatibility dimension. Every family has
two rhythmic identities per energy state, each represented by two differently
voiced takes. A pair may be mixed only when its `rhythmId` matches, so both decks
carry the same break performance and the second deck adds harmonic/timbral
colour instead of another beat. Its level remains subordinate throughout the
phrase. The current eight-bar performance finishes completely before the next
one begins.

There was a second hidden boundary fault: clips were cut from one continuous
development render, so a randomly selected block could begin with the held note
or reverb state of whatever block happened to precede it offline. Every block
now resets voices and stateful DSP, then receives an eight-millisecond click-safe
edge. The bank records and tests self-contained sections, rhythm-locked groups,
complete-boundary transitions and recent-history avoidance.

### 5.10 A quantized entrance still needs dynamics

After rhythm locking, a break could still arrive too literally when the road
crossed from beatless rest into the first rhythmic state. The sample-accurate
eight-bar boundary was correct, but a correct start time is not an expressive
entrance: the first kick appeared at its complete authored level. The inverse
fault happened on deceleration, when a complete break reached its boundary and
then vanished into the ambient state with only the click-safe edge ramp.

Keep the musical boundary and add a performance-level gesture around it. A
rhythmic section following rest rises over four seconds. When the road requests
rest, the active mixed performance releases toward a near-silent floor over four
seconds; the following ambient section recovers gently. If the driver accelerates
again before the release completes, cancel the scheduled descent, hold its
current value and restore it smoothly rather than restarting the clip. This
envelope sits after both rhythm-locked decks, so their balance and shared drum
spine cannot drift during the transition.

The listener should hear the road invite and dismiss rhythm instead of switching
it. The test asserts entrance duration, release duration, quiet floor and
cancellable recovery, while telemetry records `fade-in`, `fade-out`, `quiet` or
`steady` for comparison with the next drive.

### 5.11 Perceived variety is not musical correctness

The next listening pass invalidated the five-family solution. The larger bank
did rotate files, families, exact-note multisamples and effects, yet the result
was heard as an incoherent pile of out-of-key notes and tiny melodies. Metadata
compatibility prevented some literal errors, but it could not make simultaneous
independent musical identities sound like one authored performance. Perceived
variety is not correctness, and more randomized compatible-by-metadata clips are
not a substitute for composition.

JUNCTION therefore returns to one stable synchronous bed. Every energy state
uses the same `Emin9 – Cmaj7 – Amin7 – Bmin9` grammar and one complete primary
performance; energy changes the printed atmosphere, harmony, bass and break
layers vertically. The browser may choose another interchangeable performance
only at an eight-bar boundary and only to avoid an immediate repeat. It never
adds a tonal second deck, automatic rave lead or multisample melody. This is the
adaptive-music distinction that matters here: horizontal resequencing chooses
between compatible complete segments, while vertical variation changes layers
inside one identity. Shuffle is useful only after those identities are truly
interchangeable.

FRACTURE exposed the related melodic fault. Its repeating keyboard-like
`riff`/`response` figure was unwanted as a theme, so changing its patch, delaying
its entrance or hiding it behind more effects would preserve the actual defect.
The production arranger now gives both lanes a permanent zero goal. Atmosphere,
harmony, sub/reese, drums, dynamics and space carry the work; the retired voices
remain only in the explicit parked audition harness. An unwanted theme should
be removed, not cosmetically revoiced.

The assertable contract now rejects multiple JUNCTION tonal identities, rave
multisample/lead use, incompatible harmonic layering and immediate primary
repetition while preserving native tempo, complete boundaries, the six-clip
decoded limit and the four-second transition envelope. FRACTURE tests reject
any live activation of the retired lanes while proving low end and rhythm still
grow with road energy. Offline references remain part of the decision: the
no-lead FRACTURE drive renders at `-16.0 LUFS` integrated with `3.8 LU` range,
`-0.8 dBFS` true peak and zero clipped PCM frames; the simplified JUNCTION
render measures `-19.5 LUFS`, `14.2 LU` range and `-2.7 dBFS` true peak.

### 5.12 Vehicle gestures should perform the mix, not replace the composition

The braking treatment established a useful musical language: motion can make a
short, expressive change to the whole score without starting a new section.
Hard acceleration needs the complementary gesture. It must not become a raw
volume boost, a permanently rising tempo, or a noisy mapping of GPS jerk.

The first acceleration macro is **OPEN**. Two consecutive acceleration readings
above `3 m/s²`, while travelling at least `15 km/h`, open the stereo field by up
to `4 dB` at the sides, remove up to `3.5 dB` around `320 Hz`, add up to `2 dB`
above `9 kHz`, and apply a small feed-forward trim. It attacks over `350 ms`,
holds for at most four seconds, releases over one second, and then observes a
six-second refractory period. Braking always takes priority. The result should
feel like the mix opening under force while UNDERWATER closes and darkens it.

Use acceleration as the continuous control and jerk only as a later discrete
qualifier. GPS-derived jerk is too noisy to drive a filter or delay directly.
The next candidate, **BLOOM**, may sweep a short filtered comb from `8 ms` toward
`0.8 ms` with bounded feedback and wet level; **THROW** should wait until every
score shares an exact transport because a tempo-synchronous echo cannot be
truthful without one. Before either enters production, assert short-term level,
true peak, stereo width, spectral change, maximum duty cycle and the opposite
direction of the braking response.

---

## 6. Testing music

The thing that made the difference: **write the check, not the note**.

`tests/score-harmony.test.mjs` found five real faults while the ten-section form
was being written — a chord outside the key, three separate minor-ninth clashes,
and a bass interval that was wrong over a flattened fifth. Every one would have
had to be heard, described and hunted otherwise.

What is worth asserting:

- nothing leaves the key;
- no melody note forms a minor second or minor ninth with the chord **as
  voiced**, over **every** chord it is actually heard against;
- a bass degree resolves to a real chord tone of every chord in the form;
- the form has the variety it claims — distinct harmonies, distinct themes, and
  more than one timbre;
- an effect that should change character does not change level (measure it);
- every voice the interface offers actually makes a sound.

And the rendering harness matters as much as the tests. `render-reference.mjs`
runs the identical DSP in Node and writes a WAV, so listening review needs no
browser and no vehicle; `analyse-render.mjs` reports band balance, stereo width
and crest, which is how "it sounds thin" became "the mix is 3.6% wide and the
mids are 15 dB down".

### 6.1 A filename declares harmony; it does not prove it

JUNCTION's chord loader keys one-shots from their filenames. That was enough to
find a file called `Bmin9`, but not enough to know whether its ninth is a
separately voiced C-sharp, a harmonic of F-sharp, A, or B, or absent entirely.
This matters because the listening fault was heard as rough, incoherent chord
changes: a test built from the same unverified label would merely certify its
own assumption.

Pitch-class chroma cannot arbitrate this case. Folding every octave into twelve
classes discards the register that distinguishes a played note from an
overlapping partial. Basic Pitch and a CQT chromagram can therefore agree on a
false C-sharp, especially on saturated or detuned synth material. Agreement
between correlated detectors is not independent evidence.

The analysis contract now has four separate layers:

- `declared` preserves the pack filename without using it as a detection prior;
- `observed.proposals` contains high-recall transcription candidates, while the
  authoritative pitch set remains `null`;
- the temporal harmonic-residual feature explains candidate energy from lower
  fundamentals proposed by the transcription model, but cannot decide a pitch;
- an independent lower-source search enumerates `candidate frequency / k` for
  harmonics 2 through 16 and inspects those fundamentals directly in the sustain
  spectrum. It is review evidence only: finding a plausible source does not prove
  that the candidate is its partial. Reports distinguish that calculated
  hypothesis from the strongest observed spectral peak; cents are measured from
  the observation, never from a value the search itself derived.

The first real inventory corrected another assumption: the source directory has
33 chord hits, but the current four-chord JUNCTION grammar can reach only eight
of them — two each for `Emin9`, `Cmaj7`, `Amin7`, and `Bmin9`. Analyse those
eight and every reachable adjacent pair before scaling to the remaining tonal
library. A sample may be blocked automatically, but admission remains a recorded
human decision; the tool never renames or rewrites the pack.

The first proposer-only run proves why this boundary is necessary. The clean
`JayPad_Cmaj7` proposal contains C, E, G, and B, while the file declared
`FifthHit_Amin7` also proposes C-sharp, G-sharp, B, and F-sharp. That is evidence
that the files deserve arbitration, not evidence that the latter label is
wrong: harmonics, saturation, and transcription errors are still live
explanations. `unknown` is the correct machine verdict until those alternatives
are falsified.

The first synthetic arbiter grid deliberately placed B1, A2 and F-sharp3 below
C-sharp5, so their partials occupied the disputed band. An independently
enveloped C-sharp appeared detectable down to `-20 dB` at three saturation
drives: the fixture reported `1.0` recall, `0.0` false-positive rate and only
`0.012246` separation in normalized temporal residual. The narrow margin was the
important result. Adding the omitted F-sharp2 source, without changing the
threshold, produced `0.666667` false-positive rate and a negative `-0.006729`
margin. The earlier success was a fixture artefact, so the residual is no longer
a decision authority.

The corrected real-audio pass made that fragility audible in the evidence.
Every Basic Pitch proposal crossed the synthetic `0.22` residual threshold;
B5 in the Emin9 pad crossed it by only `0.006971`. Adding F-sharp2 then showed
why: its third harmonic, the sixth harmonic of its octave and the fifth harmonic
of A2 congest the same region. The NNLS residual decreases when a voicing is
richer, so it is anti-correlated with the classification we wanted. It is no
longer an input to any voiced-versus-harmonic verdict; audible candidates remain
`unknown`. Keep the number only as descriptive review data.

The two files declared `Bmin9` expose the distinction between pitch class and
voicing. Basic Pitch proposes different registers, but both fold to exactly
`C-sharp, D, F-sharp, A, B`, the declared B-minor-nine pitch classes. The
independent source scan finds no qualifying lower source for the proposed C-sharp5
in `V-String`; this is absence of supporting evidence, not proof of a separately
played ninth. In `WaveStrings` it finds a plausible F-sharp3 hypothesis at the
third harmonic. The earlier `-1.955 cents` value was computed from the hypothesis,
not a measured peak, and is withdrawn until the corrected report is regenerated.
That leaves the ninth ambiguous in `WaveStrings`, while the two files still agree
harmonically at pitch-class level. Before interpreting `V-String`, verify its
lowest actual F-sharp octave and record the search floor: a null search without
that bound is not evidence. A later phase-coherence test should heterodyne source
and candidate bands, unwrap phase and compare the measured frequency ratio. A
ratio near `3.0000` supports a harmonic; a stable tempered ratio near `2.9966`
supports two voices. A sustain shorter than `300 ms`, band SNR below `20 dB`,
independent modulation, unison detune, or multiple unresolved components must
invalidate that test rather than force a verdict.

The bounded review pass now records what the earlier null concealed. For the
proposed C-sharp5 in `V-String`, the F-sharp3 hypothesis measures only `2.151 dB`
local SNR and `-52.184 dB` relative to the candidate, below a declared
`-32 dB` detection floor. The report therefore states a minimum `32 dB`
candidate-to-undetected-source ratio instead of treating an empty source list as
proof. Basic Pitch's lowest F-sharp proposal in that file is F-sharp4, whose
third harmonic is C-sharp6 rather than C-sharp5. These are strong reasons to
prioritize the file for review, but they remain proposal and bounded-search
evidence, not an authoritative C-sharp verdict. `WaveStrings` remains genuinely
ambiguous: its F-sharp3 hypothesis is detected at `30.559 dB` local SNR and
`-3.314 dB` relative to the candidate.

The same proposal inventory shows why the two `Bmin9` recordings must not be
treated as anonymous substitutes. `V-String` proposes C-sharp5 beside D5;
`WaveStrings` proposes C-sharp4 beside D4. Each pair is a one-semitone review
flag. Across the two records, the lowest proposed note moves by `17` semitones
and the amplitude-weighted register centroid by `9.543` semitones, both well
beyond the five- and four-semitone interchangeability probes. The current
report intentionally leaves loudness, rendered roughness and boundary flux
`null`: proposal pitch sets can prioritize a rendered transition review, but
cannot admit or reject a production take on their own.

Selection observability then exposed a separate implementation fact. The
renderer uses `(section.voicing + sectionIndex) % choices.length`; the voicing
seed and arrangement index always have matching parity, so all 24 JUNCTION
performances select index zero for every main chord and every stab. The audible
deck is therefore `EmmPad_Emin9`, `JayPad_Cmaj7`, `FifthHit_Amin7`, and
`V-String_Bmin9`; the other four reachable files are not present in the current
master. This falsifies the assumed two-voicing variety, but does **not** authorize
turning the second files on: their proposed register centroids do not form an
interchangeable deck. First prove compatibility, then change selection.

The first audio-only pass measured 63 ordinary internal chord boundaries in the
rendered master, excluding REST's sparse grammar. With deliberately uncalibrated
probes, 22 boundaries were flagged for listening: `Cmaj7 → Amin7` accounted for
10, `Amin7 → Bmin9` for 8, and `Emin9 → Cmaj7` for 4. EASE accounted for 8 of
its 9 measured boundaries, while BREAK produced none. These counts are not a
verdict — the live browser delay and cross-clip edges are still excluded — but
they turn the listener's report of rough, incoherent changes into a bounded
review queue instead of a pitch-label argument.

Transition windows must follow the signal tail, not the nominal edit. A chord
voice currently decays by `0.99985` per sample after its two-bar hold, reaching
approximately `-60 dB` only after `0.96 s` at 48 kHz; the browser delay adds its
own tempo-dependent tail. A 12 ms edge fade or 340 ms inspection window cannot
by itself rule out an outgoing chord colliding with the next one.

Even a correct pitch-class inventory is not enough to mix two takes. Compare
their actual registers: flag notes separated by one or thirteen semitones,
measure roughness over the transition, keep lowest-note distance within five
semitones, register centroid within four semitones, and loudness within one LU.
Spectral flux and listening review complete the admission record.

### 6.2 BLOOM: replace the band, not the sub

BLOOM is a short acceleration-only Doppler bend shared by both scores. The safe
version is a feed-forward variable delay: `8 ms → 0.8 ms` over `400 ms`, updated
per sample and read with four-point Hermite interpolation. Feedback is rejected
on the full mix because its program-dependent resonance cannot fit JUNCTION's
headroom.

A global `(1-m)·dry + m·filteredDelay` crossfade is also rejected. High-passing
the delayed send does not protect the bass if the global dry path is still
multiplied by `1-m`; at `m = 0.42` the sub would fall by roughly 4.7 dB, making
the stated `0.3 dB` preservation test impossible. The implemented topology is
band replacement:

`out = dry + m · (delayedBand − undelayedBand)`

Only the 300 Hz–8 kHz band bends, while the signal outside it remains. The
offline fixture measures the delayed 1 kHz path at about `1018 Hz`, keeps a
60 Hz fundamental within `0.3 dB`, limits in-band peak growth to less than
`0.5 dB`, and requires the effect to null after release. BLOOM may trigger only
when OPEN is already active and acceleration crosses from at most `1.5 m/s²` to
at least `4 m/s²` within three readings / 300 ms. It has a 25-second refractory
period; UNDERWATER interrupts it with a 250 ms release and restarts that period.

Never let `no source candidate` mean `voiced`. It means the conditioned feature
has no basis and must abstain. Search possible lower sources independently, then
record `valid` and a reason for every piece of evidence. Likewise, a high note
outside the decision-relevant chord register can be `not_evaluated`; uncertainty
should be reserved for notes that could actually change admission.

One implementation fault also justified a regression check: an iterable of
lower notes was consumed while finding harmonic sources, leaving the relative
level reference empty and producing `0 dB` for every candidate. Materialize
one-shot iterables before reusing them; otherwise a scientifically plausible
report can carry internally false evidence without raising an exception.

---

## 7. Sources and material

- `_references/audio/samples/` — MusicRadar SampleRadar packs. Royalty-free to
  use in music. See `THIRD_PARTY_NOTICES.md` for the terms and what follows from
  them.
- The jungle pack is unusually regular and the arrangement depends on it: every
  beat loop is exactly two bars, folders are per tempo, the key is in the
  filename, and **E exists at every tempo** — which is why a sampled score in E
  can change tempo without changing key.
- The nested `Jungle Samples/Rave Synths/` library contributes native 127/135
  BPM bonus beats and chromatic multisamples named by exact note. Its other
  melodic loops declare tempo but not key; they remain excluded from automatic
  selection until they are catalogued by listening, because a large library is
  not permission to guess harmony.
