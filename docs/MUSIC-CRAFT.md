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

### 1.7 Playing over a sample library instead of using it

JUNCTION originally drove multisampled instruments with melodies written here.
That throws away the performances that are the reason to use a sample library,
and it introduced §1.2.

**The lesson.** Ask what the material already is. A pack of chord one-shots is a
progression waiting to be sequenced, not a synthesiser waiting for a part.

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

### 4.4 What must never leave

Some lanes belong to the resting scene and never exit: the pad, the sub and the
principal theme. That is what preserves the identity of the piece at every
speed. A reduced arrangement is not silence.

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

The shipped bank therefore contains one mixed, processed 192-bar production,
not playable source files. Each of the eight energy states has three complete
eight-bar takes, for 24 rendered sections with different two-bar break phrases,
harmonic voicings, density, drive and space. The browser keeps one compressed
decoder alive and chooses a different take only at an authored eight-bar
boundary, explicitly excluding the take that just played. This solves three
faults at once: a two-bar loop no longer exposes its repetition immediately,
the source recordings are not offered as a library, and the Tesla does not
decode a hundred-megabyte PCM bank into memory.

The reason a listener notices this distinction is form: variety must arrive as
an intentional change of musical pressure, harmony and orchestration, not as a
random sample roulette or a short loop restarting under a new effect.

Randomness therefore needs grammar. Choosing an entire prepared take at the
same eight-bar boundary already used by the adaptive arrangement makes the
result less predictable without breaking a fill, changing harmony under a
sustained sound, or placing a sample merely because it was available. Memory of
the previous take prevents the easiest audible failure: an allegedly varied
system selecting the same performance twice in succession.

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
at 0.28, and energy still grows through orchestration, drive, punctuation and
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

---

## 7. Sources and material

- `_references/audio/samples/` — MusicRadar SampleRadar packs. Royalty-free to
  use in music. See `THIRD_PARTY_NOTICES.md` for the terms and what follows from
  them.
- The jungle pack is unusually regular and the arrangement depends on it: every
  beat loop is exactly two bars, folders are per tempo, the key is in the
  filename, and **E exists at every tempo** — which is why a sampled score in E
  can change tempo without changing key.
