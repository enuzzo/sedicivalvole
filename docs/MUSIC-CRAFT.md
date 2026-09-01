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

### 6.7 Fixed recordings need effects that respect authored time

SOUNDTRACK exposed a different failure mode from the adaptive scores: treating a
finished recording as if speed were arrangement data would change an artist's
tempo, pitch, phrase timing, and intent. Every fixed recording therefore stays at
`playbackRate = 1`; speed, acceleration, braking, and energy cannot choose a
track or alter its transport. The listener noticed this boundary as a product
identity issue, not merely a DSP implementation detail.

Vehicle response is allowed only as bounded parallel processing behind the
explicit footer `EFFECTS` master. OPEN changes focus and upper tone,
UNDERWATER applies the braking low-pass gesture, and BLOOM keeps its short
feed-forward event, but none controls the media element clock. Some drivers do
not enjoy braking or launch processing during an otherwise calm listen, so the
master now gates the audible graph without stopping detection or visual macro
snapshots. PLAY THE ROAD retains its authored default with effects on;
SOUNDTRACK retains its fresh-session opt-in. The shared post-source Performance
FX graph has eight passenger-controlled processors: Flanger, Reverb,
Underwater, Phaser, Bitcrush, Bass Drive, Radio Cut, and High Cut. Chorus and
Echo are removed. The
manual Underwater control gives a continuous immersion/surfacing gesture; Bass
Drive deliberately reshapes low-frequency weight; Radio Cut deliberately
removes both frequency extremes; High Cut cleanly removes the upper spectrum
without borrowing Underwater's pressure, resonance, or texture. Full depth is dramatically recognizable, but
bounded gain, feedback, tails, release, and a final compressor prevent clicks,
runaway feedback, silence, or destructive level jumps. The retired Beat Repeat
worklet must not return. Source admission must allow effects before either
family can process a track.

Deterministic browser-graph checks now prove all eight endpoints, zero-depth
neutrality, routing, teardown, unchanged playback rate, and absence of Chorus.
An independent real `OfflineAudioContext` render also proves that every
processor produces a finite, non-silent difference and that the hostile
eight-effect sum remains bounded. These checks precede listening, but only the
Tesla cabin can accept full-depth identity, wet balance, braking intelligibility,
manual surfacing, and perceived peak behaviour.

A playlist relaunch has a second authored-time boundary: random means choosing
a complete recording, never choosing a timestamp inside it. A browser may keep
the `currentTime` of a previously prepared media element, so selecting a new
playlist head must not merely reuse that element and call `play()`. The Illobo
Featured launcher now avoids every audible deck, discards any paused prepared
instance of its random target, creates a fresh media element, and starts at
`0:00`. The regression fixture deliberately leaves a target at `1:27` and proves
that a new playlist gesture still begins at the track head.

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
current no-lead FRACTURE trajectory renders at `-16.775 LUFS` integrated and
`-1.319 dBTP` with zero clipped PCM frames; the simplified JUNCTION render
measures `-19.6 LUFS`, `14.1 LU` range and `-2.7 dBTP`.

### 5.12 Vehicle gestures should perform the mix, not replace the composition

The braking treatment established a useful musical language: motion can make a
short, expressive change to the whole score without starting a new section.
Hard acceleration needs the complementary gesture. It must not become a raw
volume boost, a permanently rising tempo, or a noisy mapping of GPS jerk.

The first acceleration macro is **OPEN**. A single GPS derivative is not a
musical event: callback cadence changes its magnitude, and one positional spike
can imitate a launch. OPEN therefore requires a supported `+30 km/h` trajectory
inside `2.2 s`, at least three coherent samples and `3.8 m/s²` average
acceleration. It opens the stereo field by up to `0.5 dB` at the sides, removes
up to `2.5 dB` around `320 Hz`, adds up to `3 dB` above `6 kHz`, and applies a
`-1 dB` feed-forward trim. More importantly, a parallel band derived from the
score itself rises from `480` to `3200 Hz` during the `350 ms` attack. Its own
soft limiter preserves quiet detail while bounding the added band, and stereo
expansion is now only `0.5 dB` so the gesture does not depend on cabin channel
separation. It releases when recent acceleration remains below `1.15 m/s²`
and observes a five-second refractory period. Braking always takes priority.
The result should feel like an intake opening under force while UNDERWATER
closes and darkens it.

The earlier OPEN failed perceptually because a high `9 kHz` shelf and side-only
expansion can disappear through car-speaker roll-off, cabin reflections, or a
near-mono listening position; the remaining low-mid cut then reads merely as
less body. A vehicle gesture that must be recognized cannot rely on stereo or
extreme treble alone. Assert the focus sweep, a minimum confirmed-event amount,
mono difference, level stability and full-score peak safety. On the FRACTURE
reference, the previous full-hold path reached `1.069` sample peak; the revised
path reaches `0.973`, and the eight-second mono difference RMS rises from
`0.0110` to `0.0166`. These measurements are regression evidence, not a claim
of human or target-vehicle listening acceptance.

Use the confirmed trajectory intensity as the continuous control; GPS-derived
jerk is too noisy to drive a filter or delay directly. BLOOM uses the upper tier
of the same trajectory rather than a separate derivative crossing. **THROW**
should wait until every
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

The current audio-only pass measured 63 ordinary internal chord boundaries in
the rendered master, excluding REST's sparse grammar. All 63 boundaries were
structurally valid: 39 cleared the deliberately conservative listening probes
and 24 were flagged, producing 30 flag events because one boundary can exceed
more than one probe. The events comprise 20 RMS changes above `1 dB`, eight
roughness ratios above `1.15`, and two normalized-flux ratios above `2`.
`Cmaj7 → Amin7` is the first chord priority at 11 of 21 boundaries, followed by
`Amin7 → Bmin9` at 9 of 21 and `Emin9 → Cmaj7` at 4 of 21. EASE remains the
first family to audition at 8 of 9 flagged boundaries; BUILD take 3 carries the
largest roughness ratio (`1.852249`), TURN takes 2 and 3 carry the two flux-only
flags, and BREAK clears all 9 measured boundaries. These counts are not a
verdict — the live browser delay and cross-clip edges are still excluded — but
they turn the listener's report of rough, incoherent changes into a bounded,
ranked review queue instead of a pitch-label argument.

Transition windows must follow the signal tail, not the nominal edit. The
intended chord voice holds for two bars, then decays by `0.99985` per sample,
reaching approximately `-60 dB` only after another `0.96 s` at 48 kHz; the
browser delay adds its own tempo-dependent tail. A 12 ms edge fade or 340 ms
inspection window cannot by itself rule out an outgoing chord colliding with
the next one.

A historical renderer passed five arguments to a four-argument `SamplerVoice`
constructor, duplicating gain where `holdFrames` belonged while JavaScript
silently ignored the intended `barFrames * 2` fifth argument. That defect is a
useful warning: a syntactically valid offline render can contradict its source
comments. The current source passes exactly four arguments, a regression
requires `barFrames * 2`, and the unused `noteVariation.offsetFrames` field was
removed rather than implying a playback offset no renderer consumed.

The current 5,812,361-byte `SVJCTN04` working bank with SHA-256
`0662ec081d7999c7dd365162d72abc63022d773037f175aac9199a7775fe69b5` was
forensically verified as a post-repair render. The corrected renderer predates
the fresh WAV/report and bank writes; the builder always runs that renderer
before packaging. Decoded HEAD and working-bank PCM remain identical until the
new absolute-grid boundary, while all three 160 BPM TURN takes are bit-identical
because the grid correction is a mathematical no-op there. A broken hold would
have diverged much earlier. Keep the working bank: it removes the prior
`91–118 ms` accumulated grid delays and is not evidence of the retired hold bug.
Encoded transition and vehicle listening review remain necessary for musical
acceptance, but a rebuild is not required to establish the two-bar hold fact.

The v4 manifest has the same evidence boundary. It records each section's BPM,
eight-bar length, three takes, one harmonic identity and a string list of the
four-chord grammar, but it has no structured key and no per-bar chord timeline.
The source classifier remains a proposal and filename labels remain declarations,
not authoritative pitch observations. Open work is to add structured key/chord
metadata and validate the encoded performances independently; until then the
bank's chord consonance is a listening question, not an automated proof.

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
multiplied by `1-m`; at `m = 0.48` the sub would fall by roughly 5.7 dB, making
the stated `0.3 dB` preservation test impossible. The implemented topology is
band replacement:

`out = dry + m · (delayedBand − undelayedBand)`

Only the 300 Hz–8 kHz band bends, while the signal outside it remains. The
offline fixture measures the delayed 1 kHz path at about `1018 Hz`, keeps a
60 Hz fundamental within `0.3 dB`, limits in-band peak growth to less than
`0.6 dB`, and requires the effect to null after release. BLOOM may trigger only
from a confirmed OPEN trajectory that also exceeds a `34 km/h` rise,
`5.2 m/s²` average acceleration and `0.7` normalized intensity. It has a
25-second refractory period; UNDERWATER interrupts it with a 250 ms release and
restarts that period.

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

### 6.3 PARK has no tempo; moving slowly has a tactus

The first low-speed maps exposed a perceptual category error. FRACTURE reported
its private `162 BPM` transport at a standstill and JUNCTION reported the native
`127 BPM` written into an ambient clip. Neither score played a corresponding
beat, yet the interface and changing chords told the listener that the parked
car was already rushing. Alternating voiced and silent phrases made the waiting
state feel unstable as well. A private scheduling clock is not necessarily the
tempo a listener hears.

Both scores now share one deterministic motion grammar. Below `0.8 km/h`, PARK
owns a quiet continuous ambience with no beat or bass and reports no perceived
tempo. Crossing `1.2 km/h` performs two delicate high chord tones once; GPS
jitter cannot repeat them until the car remains at or below `0.5 km/h` for three
seconds. CREEP begins at `4 km/h`, ROLL at `10 km/h`, and neither score may expose
a perceived tempo above `100 BPM` through the displayed `20 km/h` state.
FRACTURE keeps its stable
private transport and lets the listener hear it half-time. Diagnostics preserve
that transport separately from the perceived tactus.

The three-second re-arm must advance from elapsed parked time, not from the
number of speed callbacks. A stable `0 km/h` React value produces no new effect
and GPS may repeat no materially different sample, so adding `deltaSeconds`
only inside `setSpeed()` left JUNCTION disarmed indefinitely at a real stop.
Its low-speed bed now advances the departure clock from
`AudioContext.currentTime` during the existing scheduler tick and accounts for
the old speed before applying a new observation. A regression performs one
departure, sends one stopped update, advances three seconds with no speed
change, then requires the next departure to play exactly once.

The build the listener identified as “1430” is now exact: it was the local Vite
development build `20260829-1430` on 29 August, not the unrelated repository
build `20260827-1434`. The server retained its start stamp while hot module
replacement followed the working tree later consolidated through `5685de3`.
That distinction matters because the perceived jump was not hearsay about an
older audio engine: the same code declared the shared native threshold at
`21 km/h`, switched FRACTURE from half-time to full-time there, and enabled the
fast snare/hat texture in one policy change. GPS smoothing and the next musical
boundary placed the audible event near the reported `30 km/h`, where the tactus
could therefore jump from roughly `85` to `170 BPM`.

Do not repair a tactus fault by changing only the number printed in the UI.
FRACTURE now earns full-time drumming through three audible half-time families:
`SILK PULSE` from `10 km/h`, `BROKEN PULSE` from `32 km/h`, and `RHYTHM WEAVE`
from `58 km/h`. Each owns four complementary two-bar cells, so the controlled
rotation spans eight bars. Accents, long rests, ghost articulations, and soft
kick, hat, brushed-snare, and clap colours prevent one isotone event from
becoming a metronome. A speed leap may advance only one family per bar. The
native full break can arm at `88 km/h`, stays latched through boundary noise,
and returns to WEAVE below `82 km/h`; diagnostics report the same half- or
full-time tactus actually sounding.

Assert the trajectory as a musical form, not only as isolated thresholds. The
production-core regression now renders the complete silent ascent and descent:
`0 AIR`, `12 SILK`, `30 SILK`, `45 BROKEN`, `65 WEAVE`, `87 WEAVE`, `90 FULL`,
then the reverse boundary through `83 FULL`, `81 WEAVE`, and `0 AIR`. It requires
every state below `88 km/h` to remain at or below `100` perceived BPM, forbids
sixteenth-note runs in every low-speed cell, proves four-timbre rotation and
intentional rests, and exercises reversal hysteresis. The updated 148-second
reference measures `-16.775 LUFS` and `-1.319 dBTP`. These checks prove timing,
level, and clipping margin; only low-volume listening and a real Tesla can decide
whether the phrasing feels elegant.

The gesture needs a known parked origin. A confirmed PARK state followed by a
telemetry jump directly to `5 km/h` still performs the two DEPART swells, because
the road did move through the threshold even if GPS did not report every
intermediate value. The first high-speed fix after launch does not invent a
departure: without a preceding parked observation it establishes state only.
This distinction prevents both a missed real entrance and a synthetic greeting
when the page attaches to an already moving car.

JUNCTION does not slow or relabel its encoded performances. A small synthesized
`Emin9 -> Cmaj7` harmonic bed, with no voice in the bass register, owns the road
through every speed displayed as `20 km/h`. Its `84 2/3 BPM` harmonic grid has
an exact `3:2` relationship to the native `127 BPM` OPEN recording. At
`21 km/h`, OPEN starts from its own downbeat at unity playback rate. Native mode
remains latched only until the vehicle falls below `20.5 km/h`: this keeps a
small GPS-noise guard without leaving `127 BPM` audible at a displayed
`20 km/h`. If loading or decoding fails, the harmonic bed remains the
audible score and another native start is not attempted for ten seconds. The
listener hears a deliberate gear change rather than retry chatter; the encoded
groove is never time-stretched, and no isolated source recording becomes a
low-speed loop. The synthesized CREEP/ROLL grid is both its actual transport and
its perceived tempo; PARK and DEPART have neither, because their constant chord
and one-shot gesture do not establish a clock.

The retry cooldown must advance on the audio scheduler, not on React speed
updates. A steady vehicle above the native threshold can legitimately produce no
new speed effect for minutes; retrying only inside `setSpeed()` turned a stated
ten-second recovery into a permanent safety-bed fallback. The 50 ms player clock
now reviews native readiness after the cooldown, and a regression advances only
`AudioContext.currentTime` before requiring the second request.

That clock must not subscribe repeatedly to the same pending start. A transfer
or decode can legitimately occupy hundreds of 50 ms reviews; attaching a new
rejection handler on each review turned one eventual network failure into a
storm of duplicate status updates and logs. One attempt now owns one observer,
and a regression holds the transfer pending through forty review ticks before
requiring exactly one reported failure and one post-cooldown retry.

This bed is a transition layer, not an oscillator-demo substitute for the
authored bank. Its chord tones stay above the bass register, crossfade slowly,
and pass through a dark filter plus a restrained ambient delay. The two DEPART
tones are paired detuned layers with attacks longer than `400 ms`, low peaks and
tails longer than `2.5 s`; they should read as soft harmonic swells, never naked
pings. Tests bound the register, chord membership, wet/feedback amount, master
level, attack, peak and release, because a listener notices those failures as a
cheap notification sound long before identifying which synthesis parameter did
it.

Smooth target automation is part of that production. `cancelScheduledValues()`
also cancels an automation that began before the cancellation time and may
restore its pre-automation value immediately. Reissuing that sequence on every
unchanged GPS sample restarted the PARK master ramp from zero and could pump or
click during chord reversals. Unchanged levels are now ignored; real changes use
`cancelAndHoldAtTime()` so the value computed at the current audio time becomes
the next target's continuous starting point. The compatibility fallback snapshots
`AudioParam.value` before cancelling. This behavior follows the Web Audio
automation contract rather than the simplified fake-parameter behavior tests
once assumed.

JUNCTION later exposed the same perceptual failure through a different control
path. Its catalogue declared both `Emin9` and `Cmaj7`, but PARK was outside the
micro-progression branch and called `applyChord(0)` on every scheduler tick.
The stopped vehicle therefore held the first `Emin9` group forever. Multiple
oscillators, a valid chord label, filtering and delay did not change the result:
the listener heard one perpetual background note and described it as maddening,
not ambient.

PARK now follows the native score's own harmonic grammar without borrowing its
clock. Six root-light upper voicings move through `Emin9`, `Cmaj7`, `Amin7` and
`Bmin9`, then return through alternate E-minor and C-major inversions. Unequal
`9.8–15.4 s` holds prevent a covert meter; each transition takes `3.6 s` and
steers expression plus filter colour over the complete hold. The sequence keeps
all fundamentals at C4 or above, never enables beat or bass, and retains its
place across repeated stops so PARK does not always greet the driver with the
same chord. DEPART inherits the current colour, while CREEP still resolves to
the existing `Emin9 -> Cmaj7` micro-progression and native OPEN still begins at
unity playback rate.

Assert progression rather than oscillator count. The regression advances only
`AudioContext.currentTime`, reaches all six voicings, rejects an immediate
repeat, verifies every pitch class against its declared chord, requires six
distinct unequal holds, and keeps the shortest hold at least 2.5 times the
crossfade. A deliberately conservative unfiltered 74.9-second reference renders
the same sine/triangle balance, voice weights, master level, expression breath
and crossfades at `-54.290 dBFS` RMS and `-44.313 dBFS` sample peak. It clips no
sample and remains far below an intrusive peak. This proves bounded gain and
harmonic motion, not ambience quality: low-volume listening and a long real-
Tesla stop remain the perceptual acceptance gates.

The first real-browser long stop exposed a scheduler detail the fake parameter
missed. Two PARK `setValueCurveAtTime()` breaths could overlap by only a few
milliseconds after ordinary scheduler drift. Chromium rejects any overlap
between value curves, even when a test double assumes `cancelAndHoldAtTime()`
can shorten the active curve. At roughly 110 seconds the exception stopped the
ambient scheduler. JUNCTION therefore expresses the same five-point breath as
cancellable linear ramps and schedules each unequal hold from the actual
transition time rather than compressing the next hold toward an ideal clock.
An 86-second muted browser run then reached seven voicing changes with no beat,
no bass and zero warnings or errors. Web Audio automation validity belongs to a
real-browser long-duration gate; a permissive fake cannot prove it alone.

FRACTURE revealed why `more than one oscillator is active` is not an adequate
anti-drone rule. Its old PARK pad re-struck the same `Fm7` voicing on every
private transport bar. The dark filter and register made one partial dominate,
so the listener heard a single perpetual note: technically a chord, perceptually
an exposed oscillator, and intolerable at a long stop.

The corrected PARK field is an authored 46.2-second voice-leading cycle through
six rootless upper voicings (`Fm9`, `Dbmaj9`, `Ab6/9`, `Eb6/9`, `Cm7`, `Fm11`).
Unequal `6.1–9.2 s` holds are independent of the sequencer, adjacent voices move
no more than two semitones, and two four-voice banks overlap with slow attacks
and releases. A quiet sine body, a trace of filtered air, slow spectral drift,
subtle stereo motion and the shared room provide life without establishing a
pulse. Every pitch stays at C4 or above, so this is harmony without a covert
bassline. Leaving PARK fades that field under the existing two-breath DEPART
gesture; CREEP, ROLL and native FRACTURE keep their original transport grammar.

The regression test checks both authorship and rendered evidence. It requires
six unique consonant voicings, a recurrence longer than 45 seconds, no immediate
repeat, cyclic voice-leading of at most two semitones, no note below MIDI 60,
and at least three audible authored tones in every late-hold spectral probe. A
52-second production-core render must remain continuously audible but below the
PARK RMS/peak ceiling, retain a non-percussive crest factor, report no perceived
tempo, beat or bass, and visit the six voicings in order. This guards the actual
failure the listener heard rather than merely counting synth voices.

The 48 kHz, 60-second offline PARK reference measured `-46.7 dBFS` RMS,
`-33.9 dBFS` peak, `12.8 dB` crest, zero detected onsets and zero clipped frames.
Those are mix diagnostics rather than a listening verdict, but they confirm the
intended category: a low continuous colour with no transient clock, not a lead
note trying to command attention.

Tests assert the exact policy at `0`, `0.5`, `1.2`, `4`, `10`, `19.9`, `20`,
`21` and `30 km/h`, evolving clockless PARK harmony, departure hysteresis and event count, the lack
of low-speed bass, perceived/transport tempo separation, and unity-rate native
playback.

### 6.4 A rounded rhythmic grid must close on every bar

The JUNCTION renderer once rounded one sixteenth-note duration and repeatedly
added that integer. At `127`, `135` and `164 BPM`, the accumulated grid missed an
exact two-bar boundary, so the next chord waited almost a whole sixteenth: about
`91–118 ms`. The bass and break had already changed on the correct frame while
the outgoing chord was still releasing. What the listener described as a rough
harmonic transition was therefore a timing collision, not evidence that the
whole progression was wrong.

Derive each event from its absolute position inside the integer-length bar:
`round(bar * barFrames + step * barFrames / 16)`. Never derive a later boundary
by accumulating one rounded subdivision. The renderer test covers every authored
BPM and permits at most one frame of error.

The same boundary principle governs decoding. Before the first native downbeat,
JUNCTION decodes both the selected primary performance and a distinct companion
for the same authored state. At every later eight-bar boundary, the requested
take may start only when it is already decoded. Otherwise the player continues
with a distinct decoded complete performance at the exact boundary, records the
fallback, and defers the requested take; the same primary take may never repeat
immediately. Decode reservations include in-flight work, so a new decode evicts
before allocation rather than briefly turning the six-clip contract into seven
retained or reserved clips.

The bound includes AudioBuffers retained by scheduled, playing and retiring
`AudioBufferSourceNode`s, not only entries visible in the decoded cache. A
threshold exit can hold a source for a 1.2-second release after its performance
record is cleared; evicting that asset from the Map does not release the source's
buffer. Each live source therefore retains its asset identity, cache trimming
pins those identities, diagnostics count the union of decoded, decoding and
source-held assets, and a threshold-bounce regression requires the real union to
remain at or below six. The same tracking stops a retiring take before the shared
sample gate opens for a restarted native take, preserving one primary groove.

Phrase colour is boundary state too. Scheduling the next eight-bar performance
up to 800 ms early once replaced the global open-filter cutoff immediately; a
brake gesture during that window therefore used the future phrase's colour on
the current take. Future effects are now scheduled explicitly at their boundary,
the active cutoff changes only when the pending performance is promoted, and a
brake change refreshes both the active target and the already scheduled boundary
target without touching playback rate or pitch.

Vehicle trajectories have an equivalent freshness rule. A gap longer than
`1.6 s` releases OPEN and clears its rolling evidence; no accepted interval may
exceed `1.4 s`. Updating only the observation timestamp would make an old launch
look newly measured and perform an effect the driver did not request. The
braking derivative retains its stricter `700 ms` freshness because it answers a
different question: whether the latest speed fall is still occurring now.

### 6.5 A score switch is one musical transition

FRACTURE and JUNCTION once risked stacking score-local fades: two individually
polite envelopes can still make a conspicuous level hole or a delayed entrance
when they run in series. The score selector now owns one central four-second
equal-power crossfade. Separate score gains follow one shared angle, with
`fracture = cos(angle)` and `junction = sin(angle)`, so their squared gains sum
to one throughout the hand-off. A selector-driven JUNCTION entrance bypasses
the redundant internal native fade; JUNCTION still uses its own rhythmic
entrance when the car itself crosses into native mode while that score is
already active.

Constant power solves level continuity, not tonal compatibility. FRACTURE's
F-natural-minor field and JUNCTION's E-minor identity share only C and G; during
the present four-second equal-power overlap both scores remain above `-12 dB`
for about `2.71 s` and above `-6 dB` for about `1.33 s`. Adjacent fundamentals
and chord extensions can therefore produce rough minor-second beating even
though the gain law is mathematically correct. A generic low-pass cannot remove
that conflict. The eventual authored bridge needs per-voice control: contract
FRACTURE toward the shared C/G pivot, avoid direct non-pivot overlap above
`-20 dB`, then let JUNCTION resolve through its own harmony at the next musical
boundary. Until that bridge is rendered, tested and auditioned in the vehicle,
the selector is technically continuous but not musically verified.

Rapid reversals are part of the instrument, not an error case. A new selection
cancels both active Web Audio curves, samples the current shared angle, and
travels back from that exact point in proportion to the remaining distance. It
must not restart a four-second fade from an endpoint, overlap an active value
curve, or let an obsolete completion timer mute the score the driver just
restored. Tests assert constant power, cancellation on both gains, proportional
reverse duration and the final restored levels.

JUNCTION's synthesis and bank graph are created lazily on first selection.
Starting and remaining in FRACTURE therefore does not construct the eight
low-speed oscillators, filters, delay or sample path for an unheard score. This
is a performance optimization with a musical benefit: inactive orchestration
has no hidden scheduling state that can leak into a later entrance.

Readiness belongs to the musical transition contract. Creating an AudioContext
does not mean FRACTURE can sound: its AudioWorklet module and node must be loaded,
constructed and connected first. Score selection now waits only for that real
readiness point, then schedules the audible crossfade without waiting for its
four-second tail. If FRACTURE cannot become ready, JUNCTION's zero-beat harmonic
bed is the audible fallback; a missing AudioWorklet or rejected resume is exposed
as an explicit score error rather than letting Signal Gate open onto silence.
The optional BLOOM processor does not block the underlying score.

Readiness must also be bounded. A browser can resolve HTTP headers while never
finishing the bank body, an AudioWorklet module can remain pending, and a decode
can stall without rejecting. Each external stage therefore owns a deadline, but
their lifetime rules differ. The bank-transfer deadline covers both headers and
body and aborts its request. AudioWorklet readiness may reject without blocking
the underlying score fallback. A browser decode cannot be aborted: its deadline
rejects the current readiness attempt while retaining that native reservation
until `decodeAudioData` itself settles. Retries reuse the same reserved work
instead of starting another decode; a late success becomes the decoded cache
entry and only native settlement releases the slot. The outer JUNCTION deadline
is longer than one complete allowed transfer-plus-decode sequence. Through any
timeout the zero-beat bed remains audible. Tests drive fake clocks and repeated
retries against never-resolving native decodes, because a source-code check
cannot prove either bounded readiness or bounded native lifetime.

Teardown is another lifetime boundary. `decodeAudioData` may settle after the
driver has left JUNCTION or the complete AudioContext has been destroyed. A
late native promise once repopulated the decoded map after `destroy()` had
cleared it, silently retaining PCM for a score that no longer existed. Destroy
now aborts the player-owned bank transfer, marks the player closed and clears
in-flight reservations; native settlement may finish internally but cannot
re-enter the retained cache or rebuild state after teardown. Deferred-transfer
and deferred-decode regressions destroy the player first, settle the external
work afterward and require zero retained and zero in-flight clips.

Crossfade cleanup follows the audio clock, not wall time. Browser timers keep
advancing while an AudioContext is suspended, but scheduled gain curves do not.
A one-shot four-second wall timer could therefore deactivate JUNCTION and mark
the selector ready before the audible four-second curve had moved at all. The
completion callback now rereads `AudioContext.currentTime` and reschedules
until the musical endpoint is real, and its continuation predicate stops the
reschedule loop when a closed context freezes that clock. Likewise, a readiness
failure that restores the other score remains an explicit degraded state after
the fade completes; generic cleanup must not erase the error merely because the
safety bed is audible.

Runtime processor failure is a different state from load failure. Web Audio
makes a failed AudioWorkletNode permanently silent. If FRACTURE dies, switch
immediately to JUNCTION's harmonic safety bed and report the recovered score to
the product state; fading for four seconds from an already silent node only
turns a recovery into a four-second hole. If a JUNCTION native load rejects
while its bed is already the outgoing score, keep that bed active until the
central FRACTURE crossfade completes. BLOOM is optional and serial, so its
processor-error path reconnects the dry score bus before disconnecting the
failed node. Behavioral fake-AudioContext tests assert all three topologies.
If the JUNCTION bank fails while FRACTURE is still loading, that not-yet-created
worklet is not an audible fallback: expose the already-running JUNCTION safety
bed immediately instead of waiting up to the readiness deadline at zero gain.
A held brake also sends one BLOOM release, not one command on every 40 ms control
tick; control-rate repetition must never become event-rate musical spam.

The six-decoded-clip ceiling is an absolute runtime contract, not advice from a
bank manifest. Parsing and deployment reject a JUNCTION bank that declares any
other limit, while the player clamps requested capacity to six as defense in
depth. Otherwise a stale or malformed bank could turn a musically harmless
metadata field into unbounded decoded PCM on the Tesla browser.

The limiter's release is part of PARK authorship too. FRACTURE initially met its
stopped-vehicle level target on a fresh launch, then returned roughly `10 dB`
quieter after a loud drive. The lookahead window stored magnitudes as
`Float32`, while its running peak kept JavaScript double precision. When the
peak left the window, the rounded stored value missed an extremely tight
equality check; the limiter therefore retained one historic gain reduction for
the rest of the session. A technically present ambience below audibility is not
a constant PARK field.

Keep the running maximum and its history at the same precision. The direct DSP
regression feeds a deliberately non-Float32 peak, waits beyond both lookahead
and release, and requires unity gain. A production-core regression then drives
FRACTURE at high energy, returns to PARK, and requires the settled ambience to
recover within `3 dB` of its fresh-launch RMS while preserving its no-beat and
no-bass state. Ceiling protection and release must always be tested together:
one without the other can turn a limiter into a permanent volume control.

Correct release also exposed a second defect that the latched limiter had
hidden. With the historic master curve, the current FRACTURE reference rose to
`-11.9 LUFS` integrated and `+0.3 dBTP`; dense driving held the output close to
the limiter ceiling instead of letting the arrangement breathe. A previous
apparently conservative master measurement was therefore partly the sound of a
broken release, not safe gain staging.

Preserve PARK's absolute master gain and trim density before the limiter. The
stopped field remains at `0.552`, while the densest arrangement reaches `0.368`:
adding six real lanes, articulation, saturation and spatial sends still creates
the build, but the master no longer adds another `4.4 dB` merely because energy
rose. FRACTURE now uses a `0.64` sample ceiling with inter-sample margin. The
current 48 kHz full trajectory measures `-16.775 LUFS` and `-1.319 dBTP`, with
zero clipped PCM frames. A full 148-second production-core
test applies BS.1770 K-weighting and four-times band-limited interpolation, so a
future change cannot silently turn orchestration back into permanent limiting.

Effects calibrated downstream of faulty dynamics must be remeasured too. Once
the limiter released normally, the full brake saturator added `1.8 dB` to the
real score. Increasing its internal full-depth trim from `0.52` to `0.62`
restored the effect to `-0.26 dB` while the energy above `2 kHz` still falls
`12.31 dB`. This is the intended contract: controlled pressure, resonance and
saturation change the character, but braking neither empties the score nor
rewards the gesture with a loudness jump.

JUNCTION exposed the complementary program-dependence fault. Its former single
low-pass fell to `430 Hz` with no saturation or level compensation. Dense break
states lost little, while the sparse REST material lost more than six loudness
units; one fixed filter was therefore not one musical gesture across the form.
The corrected chain uses a logarithmic sweep to `550 Hz`, restrained resonance
from `Q 0.65` to `0.85`, a `84/16` filtered-to-residual blend, `tanh(2x)` soft
saturation and `-4.32 dB` post-shaper calibration. Clean and processed paths
crossfade continuously; playback rate, transport and pitch remain untouched.

The calibration decodes only the tracked 24-clip `SVJCTN04` bank identified by
SHA-256 `0662ec081d7999c7dd365162d72abc63022d773037f175aac9199a7775fe69b5`.
Across all eight states and three takes, the full brake changes BS.1770
integrated loudness by `-2.992` to `+0.706 LU`, reduces energy above `2 kHz` by
at least `5.347 dB`, and keeps the highest processed sample peak at
`-5.249 dBFS`. The checked-in calibration is bound to both that bank hash and
the runtime parameters, so replacing either invalidates the regression. These
are encoded-program measurements, not a listening verdict: the live delay,
low-speed safety bed, automation curve and Tesla cabin still require audition.

The calibration file is reproducible evidence, not a hand-entered assertion.
`npm run analyze:junction-brake` decodes every tracked Ogg performance with
FFmpeg, applies the full-depth browser filter, parallel blend, WaveShaper and
makeup gain, then recomputes BS.1770 loudness, high-band energy and sample peak.
The committed regression requires all 24 clips to reproduce within `0.025 dB`
or LU while also matching the bank SHA-256 and runtime parameters; the current
maximum numerical drift is `0.000002`. This closes the measurement-provenance
gap, but it still does not turn encoded metrics into a Tesla listening verdict.

### 6.6 A tempo ladder still needs one harmonic author

The 1980s source audit found useful native drum recordings at `85`, `95`,
`110`, `120`, `125`, `130` and `140 BPM`, but the tonal construction kits are
not alternate-tempo renders of one composition. Their filename root tags do not
prove a shared progression, voicing, phrase start or downbeat, and the chroma
proposal margins are often too small to bridge that evidence gap. Treating
these packs as interchangeable decks would pass metadata checks while sounding
like a collage.

NIGHTSHIFT therefore takes one stricter route: a single native two-bar drum
recording is the rhythmic spine at any instant, while project-authored pads,
bass, arpeggio and sparse high-speed punctuation perform one A-minor grammar.
Each production asset is a complete eight-bar mix; the runtime never exposes or
layers a source loop. Three complete takes per state, recent-take memory and
unequal PARK holds prevent immediate or short-cycle repetition without changing
musical identity.

The perceived acceleration is orchestration as well as tempo. PARK has six
slowly crossfaded consonant voicings and breathing dynamics with no clock, beat
or bass. The first moving family is `85 BPM`; bass and arpeggio enter by degree,
and `120 BPM` drumming cannot arrive before `82 km/h`. Separate descent
thresholds stop a boundary reversal from chattering. State changes wait for the
end of the current eight-bar performance. If the next decode misses that
boundary, the player repeats one already decoded complete performance and
reports the fallback instead of making silence or cutting a phrase.

The enforceable contract checks the six native states, entrance/exit
hysteresis, eight-bar harmony, one drum cell at a time, three takes, recent-take
avoidance, six-clip decoded bound, absence of playback-rate automation, mixed
bank identity and raw-source exclusion. The full offline trajectory measures
`-21.4 LUFS` integrated, `6.6 LU` LRA and `-3.8 dBFS` true peak. These figures
protect bounds and headroom; they do not claim listening acceptance in the
Tesla cabin.

### 6.7 Calibrate sampled scores at the same playback stage

A real Tesla drive exposed NIGHTSHIFT as materially louder than the other Play
the Road experiences even though its full offline render and encoded clips did
not exceed JUNCTION's loudest clips. The mismatch was in the runtime graph:
JUNCTION applied a `0.72` performance-entry gain before its output bus, while
NIGHTSHIFT sent every complete sample performance into the corresponding bus at
unity. Dense, continuous NIGHTSHIFT material therefore gained about `2.85 dB`
at the exact stage where the two sampled scores should have matched.

Every sampled adaptive score must use the shared performance-entry gain and pass
the tracked encoded-bank audit before listening. `npm run
analyze:sampled-score-levels` decodes only the public `.svb` artifacts and
reports first-pass EBU R128 integrated loudness, range and true peak for every
asset. The current JUNCTION clips span `-30.57` to `-16.71 LUFS` with a maximum
`-2.54 dBTP`; NIGHTSHIFT spans `-25.54` to `-18.89 LUFS` with a maximum
`-3.65 dBTP`. These figures catch gain and bank drift, but do not replace a
matched-volume cabin comparison because arrangement density and spectral balance
strongly influence perceived level.

FRACTURE is synthesized rather than sampled, so it must not inherit the sample
trim by category. Its full production-core fixture was rerun after the report
and reproduced `-16.775 LUFS` and `-1.319 dBTP`; no blind correction was made.
Use the same order for future level defects: measure the shipped signal, inspect
the complete runtime gain graph, change the narrowest shared calibration point,
then accept the result at low volume in the target cabin.

The 2026-08-31 pre-correction real-cabin pass also confirmed that UNDERWATER was
audibly active. That proves the effect path, not the final mix: the sampled-score
normalization defect means the complete effects/listening matrix must be repeated
after the shared gain correction is published. Never let one working effect or
one loud source stand in for matched-level, alert-safe cabin acceptance.

### 6.8 Evidence must bound both musical inference and slow-bank readiness

The failed pitch-residual shortcut was not repaired by choosing another scalar
threshold. `npm run analyze:junction-pitch-evidence` now rebuilds a tracked
stereo fixture grid across shared ADSR, filter cutoff, phase seed, detuned
unison, chorus, partial slope, saturation and stereo coherence. A phase-aware
two-frequency model reaches `1.0` recall and `0.0` false-positive rate on the
valid controlled cases. Every deliberately short, unresolved-detuned or
independently chorused case abstains as `unknown` with an explicit reason.

The important result is the boundary, not the perfect synthetic score. The
published JUNCTION assets are complete processed mixes, so they cannot prove
the isolated processing provenance needed to exclude detune, chorus and
nonlinear cross-products. The tracked report therefore keeps
`real_audio_pitch_gate_authorized` false. This is a reproducible replacement for
the anti-correlated magnitude residual: it can rank review evidence, but it
cannot certify a real pitch set until the same validity inputs are observable.

Cold-cache readiness has an equally physical boundary. The public JUNCTION and
NIGHTSHIFT banks are `5,812,361` and `5,504,595` bytes. At the slowest browser
hint observed in the vehicle, `1.35 Mbps` with `250 ms` RTT, they need more than
the old `12 s` deadline even before conservative transport headroom. The shared
budget now applies `18%` headroom and a `45 s` transfer deadline; JUNCTION's
outer readiness bound is `56 s`, long enough for one allowed transfer plus one
allowed decode.

Both players retain an audible harmonic safety bed, abort a body that really
stalls at the transfer deadline, expose the exact timeout reason, wait ten audio
seconds and retry without another selection. NIGHTSHIFT now has the same
single-attempt, abort, cooldown and teardown discipline JUNCTION already had.
Deterministic fake-clock tests use the real bank byte lengths, prove that the old
deadline could not cover the measured boundary, and then exercise failure and
recovery for both scores. This changes readiness policy, not bank format or
authored playback rate.

### 6.9 A fixed-recording skip is a short mix, not a metadata swap

The first Soundtrack player paused the audible media before it promoted and
played the next prepared element. That control flow was logically tidy but
audibly guaranteed a hole, and the visible credit could follow the latest click
rather than the sound still leaving the speakers. Fixed recordings need the
same sample-conscious transition discipline as an authored score even though
their arrangement does not react to driving.

Each transient media element now enters the shared effects chain through its
own gain stage. The nominal `450 ms` equal-power state supplies matched
65-sample AudioParam curves, so squared gain remains one through a normal skip.
A reversal begins from the gain vector that is actually audible at that audio
clock instant; a third prepared target can join without a level hole. The deck
retains at most three media elements. A fourth simultaneous identity is not
silently mixed: the controller collapses to the current dominant deck and
starts a fresh bounded transition.

Attribution must be computed from the same gain vector. During a fade the card
names every track above the audible epsilon, marks the requested target, and
settles only when the guarded audio-clock revision completes. The QR is a
separate passenger handoff for the requested current track and points to the
public content page, never the audio relay or stream. Tests must cover the
normal `450 ms` duration, mid-fade reversal, third-target retarget, unit power,
three-element bound, stale completion, and all audible credits. Cabin listening
still decides whether the transition is perceptually clean through the Tesla
browser and sound system.

The first live rapid-navigation run exposed an additional transaction boundary:
do not promote the requested title, QR, or queue current merely because its
media element was prepared. Commit all three only after the incoming deck has
started and the gain schedule has been accepted. If play or scheduling fails,
restore the prior queue, stable gain, audible element and credit as one unit.
Otherwise the attribution can be truthful about the old audible deck while the
rest of the interface falsely claims the new target.

### 6.10 An effect threshold must be perceptual, not merely numeric

The target-vehicle run showed UNDERWATER in the visual state while a Jamendo
recording sounded completely dry. The routing state was changing, but the
fixed-recording filter mapped its normalized amount by interpolating linearly
between `18 kHz` and `520 Hz`. At the `0.4` visual engage threshold this still
left the cutoff around `11 kHz`: a numerically large movement that is weak over
road noise and many mastered recordings because pitch and filter frequency are
heard approximately logarithmically.

The cutoff now follows a logarithmic frequency sweep. The same `0.4` threshold
lands below `5 kHz`, while zero remains `18 kHz` and full braking remains
`520 Hz`; playback rate and track choice are unchanged. A deterministic test
owns the threshold, because an ON badge without a clearly changed sound is a
product failure even when every state variable is technically non-zero.

### 6.11 Source changes are transactions, not awaited interface events

A fixed-recording player can be musically correct and still feel broken on a
weak connection if the old library remains visible while the new catalogue or
score prepares. The passenger's source tap is the transport decision: replace
the visible pane, stop or silence the outgoing source, and state which source is
loading before awaiting network, decoding, effects, or AudioContext work.

Every asynchronous source change needs a monotonic revision. Before any late
completion may start media, unmute a score, commit title/credit, or clear a
loading state, it must still own both the latest revision and the selected
source. If a Soundtrack resume becomes obsolete while its play promise is
pending, pause it explicitly after settlement. If an adaptive score becomes
obsolete, keep its engine muted. This preserves the musical boundary the
passenger actually chose and prevents two individually valid promises from
producing the wrong audible result together.

Natural track end is a separate hard boundary, not an ordinary crossfade from
an already-ended deck. Start only a fresh target at `0:00`. Dormant preload
failure must not poison the current audible deck, and a failed replacement
catalogue must not relabel or stop music that is still playing. Deterministic
stress should interleave NEXT, PREVIOUS, explicit selection, pause/resume and
failure while asserting the deck ceiling and one coherent audible identity.

The chooser itself belongs to this transaction. An alternative source cannot
become a passive summary merely because another queue is active: every path
must remain a complete enabled control, including at the narrow vehicle
breakpoint. Its preview artwork must come from that source's last truthful
catalogue, not from the active queue. Otherwise choosing Illobo can erase the
visual affordance and Jamendo covers needed to return, making a healthy player
look like a one-way state machine. Assert the full Jamendo → Illobo → Jamendo
round trip, retained alternative artwork, and a rapid reverse selection whose
late request cannot reclaim either pane or audio.

### 6.12 Prove the audible graph, not the badge or the control object

A second target-vehicle pass showed UNDERWATER on screen while Illobo, Jamendo,
and NIGHTSHIFT all remained dry. The Soundtrack defect was not filter tuning:
the App forwarded `audioMacros.open`, `.underwater`, and `.bloom`, but the
shared macro snapshot stores those scalars under `audioMacros.values`. The
normalizer correctly failed undefined values to zero, so the badge and visual
consumer could be active while the fixed-recording audio graph received three
zeros. A test must therefore assert the exact object boundary that feeds every
audible engine; an active detector or badge is not routing evidence.

NIGHTSHIFT exposed a separate perceptual failure. Its local linear filter still
bottomed out at `5.5 kHz`, and the visible engagement threshold stayed near
`13 kHz`. All three music paths now use one shared two-stage logarithmic brake.
At the minimum visible amount `0.4`, its corner frequencies are approximately
`1487 Hz` and `1606 Hz`, reinforced by a bounded `240 Hz` pressure shelf and
small makeup gain; full depth reaches approximately `460 Hz` and `497 Hz`.
Two stages make the state categorical over cabin noise without replacing it
with a mute, and the final limiter contains the makeup and any manual wet sum.

The proof stack must cross independent layers: source-level routing assertions,
exact transfer-function checks, a real build, and a decoded real-recording
measurement. On representative 15-second source excerpts at minimum visible
depth, the energy above `4 kHz` fell from `-28.1` to `-48.9 dB` for Illobo and
from `-20.9` to `-39.7 dB` for Jamendo. These `20.8 dB` and `18.8 dB` changes
prove a materially darkened signal before cabin listening; they do not replace
the final Tesla test.

Manual performance effects follow the same rule. They belong after the complete
audible source, not inside one player's private graph. All eight processors now
share one serial post-source graph for adaptive scores and fixed recordings.
Each full-depth endpoint must exceed a tested wet floor, and the sum must end in
a limiter. Manual and vehicle Underwater parameters require separate names:
an earlier draft reused `underwaterWet` for both and the later object spread
would have silently replaced the braking value. A control can be individually
correct and still disable another effect when its parameter namespace is not
owned. The former Beat Repeat is retired because its only perceptible state was
also musically objectionable; retaining a bad effect just because it is audible
is not success.

### 6.13 A performance-effects tap must cross an audible threshold

The first cabin test of the manual effects produced visible state changes with
no useful audible result. A passenger performance control cannot begin at an
engineering-demo depth: its primary tap must land immediately on a musical,
unmistakable state, while a separate continuous control remains available for
fine adjustment. The selected FX Deck therefore maps each tap to an authored
default—Flanger `0.78`, Reverb `0.72`, Underwater `0.76`, Phaser
`0.78`, Bitcrush `0.72`, Bass Drive `0.74`, Radio Cut `0.76`, and High Cut
`0.76`—and uses a
sublinear response curve so the lower half of the slider still changes the wet
graph materially. Those one-tap values all remain below a separate stunt zone:
the final `82–100%` of every slider uses a smooth accelerated curve that reaches
zero at the boundary and full strength only at the endpoint. A tap therefore
stays musical, while the passenger who deliberately pushes to `100%` gets a
categorically more extreme processor rather than a barely louder version of the
same state.

The effects remain conventional Web Audio building blocks rather than visual
facsimiles. Flanger uses a modulated short delay; Reverb uses a normalized
`ConvolverNode`, pre-delay, and bounded tone filtering; Underwater uses two logarithmic low-pass stages plus a
pressure shelf and adds stunt-only saturated pressure texture; Phaser uses four
modulated all-pass stages; Bitcrush uses a quantizing `WaveShaperNode`; Bass Drive combines a low shelf with bounded
saturation; and Radio Cut combines high-pass, low-pass, presence, and bounded
drive. High Cut uses two clean low-pass stages after the other tone processors,
preserves the low band, and reaches approximately `1.15 / 2.09 kHz` only at
full stunt depth. The complete serial sum terminates in a dynamics compressor.

New wet nodes must be initialized explicitly at zero before the graph starts.
The platform default for a `GainNode` is unity; relying only on the first ramp
briefly exposes every wet branch at launch, creating a transient even though
the steady-state parameters are correct. Neutral initialization is therefore a
tested part of effect construction, not only of later automation.

Tests protect the exact roster, zero-depth neutral state, authored-hit/stunt
separation, modulation, filters, feedback, drive curves, bounds, oscillator
lifecycle, and teardown. In a real browser `OfflineAudioContext`, a deterministic
wide-band fixture compared each authored tap with its own `100%` render. Full
depth is `1.3925–2.5184×` more different from dry than its corresponding tap;
manual Underwater is `1.8005×`. The eight full-depth wet-minus-dry RMS values
span `0.11920–0.50727`; the largest individual peak is `0.99121`; and all eight
at full depth together remain finite and non-silent at `0.22828` RMS / `0.60941`
peak. This proves that the final slider segment increases character without
using clipping or an uncontrolled full-bus level jump as the effect. It does not
replace target-Tesla listening.

The owner later preferred a complementary clean high-frequency control over
Echo. Dedicated real-browser sine renders verify the perceptual contract rather
than merely the parameter endpoints: `300 Hz` changes by only `+0.30 dB` at
full depth, while `8 kHz` falls by `−12.94 dB` at the authored `0.76` tap and
`−59.68 dB` at `100%`. A fresh deterministic wide-band render keeps the current
eight-effect hostile sum finite and non-silent at `0.25913` RMS / `0.91672`
peak. Bass Drive, Radio Cut, and High Cut are contiguous in the performance
surface and share one visual family marker; that grouping does not merge their
state or processing paths.

Sources: [Web Audio API 1.1](https://www.w3.org/TR/webaudio-1.1/),
[MDN `BiquadFilterNode.type`](https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type),
[MDN `WaveShaperNode.oversample`](https://developer.mozilla.org/en-US/docs/Web/API/WaveShaperNode/oversample),
[MDN `DynamicsCompressorNode`](https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode),
and [MDN `AudioNode.connect()` feedback cycles](https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect).

---

## 7. Sources and material

The product owner explicitly superseded the earlier no-inspection boundary for
the ignored source library. The 1980s audit at `dd6bb5e` inspected all 684 local
WAVs without committing or serving them. It found a native drum ladder from
`85–140 BPM` and six internally coordinated tonal construction kits from
`93–126 BPM`. The audit keeps filename declarations separate from chroma
proposals because root tags and low-margin chord estimates do not prove that
two different kits share one progression or downbeat.

**Listener-facing consequence:** the third score uses the drum-only pack as a
native-tempo rhythmic spine under one project-authored A-minor grammar. It does
not layer apparently compatible tonal loops across kits. This is the musical
difference between arranging with a library and making a collage: one primary
groove, one harmonic author, and complete eight-bar performances at every
runtime boundary. Exact inventory and admission evidence live in
[`EIGHTIES-SAMPLE-AUDIT-2026-08-29.md`](EIGHTIES-SAMPLE-AUDIT-2026-08-29.md).

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
- Web Audio API 1.1, `AudioParam.cancelAndHoldAtTime()` automation semantics:
  <https://webaudio.github.io/web-audio-api/#dom-audioparam-cancelandholdattime>.
