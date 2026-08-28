export const JUNCTION_TAKES = 20;
export const JUNCTION_BARS_PER_SECTION = 8;

const CHORDS = Object.freeze({
  Emin9: { chord: "Emin9", bassKeys: ["E", "Emin"], accentMidis: [52, 55, 59, 62, 66] },
  Emin7: { chord: "Emin7", bassKeys: ["E", "Emin"], accentMidis: [52, 55, 59, 62] },
  Eminsus2: { chord: "Eminsus2", bassKeys: ["E", "Bmin"], accentMidis: [52, 54, 59] },
  Cmaj7: { chord: "Cmaj7", bassKeys: ["C", "G", "E"], accentMidis: [48, 52, 55, 59] },
  Gmaj7: { chord: "Gmaj7", bassKeys: ["G", "Bmin", "E"], accentMidis: [55, 59, 62, 66] },
  Amin7: { chord: "Amin7", bassKeys: ["Amin", "A", "E", "C"], accentMidis: [45, 48, 52, 55] },
  Amin9: { chord: "Amin9", bassKeys: ["Amin", "A", "E", "C"], accentMidis: [45, 48, 52, 55, 59] },
  Bmin9: { chord: "Bmin9", bassKeys: ["B", "Bmin", "E"], accentMidis: [47, 50, 54, 57, 61] },
});

function progression(...chordNames) {
  return chordNames.map((chord, index) => ({ bar: index * 2, ...CHORDS[chord] }));
}

function motif(...events) {
  return events.map(([at, degree, steps]) => ({ at, degree, steps }));
}

/**
 * Five audible identities, each with its own harmonic route, played motif and
 * multisampled lead. Motif degrees always resolve against the chord that is
 * actually voiced, so live family changes cannot introduce an outside note.
 */
export const JUNCTION_FAMILIES = Object.freeze([
  {
    id: "afterdark", label: "AFTERDARK", progression: progression("Emin9", "Cmaj7", "Amin7", "Bmin9"),
    colorSteps: [29], accentOffset: 0, leadInstrument: "Rave_Lead", leadGain: 0.17,
    motif: motif([0, 2, 5], [7, 1, 3], [13, 0, 5], [23, 3, 4], [29, 1, 3]),
  },
  {
    id: "lift", label: "LIFT", progression: progression("Gmaj7", "Cmaj7", "Emin7", "Amin9"),
    colorSteps: [13, 29], accentOffset: 5, leadInstrument: "RavePiano", leadGain: 0.15,
    motif: motif([2, 0, 3], [6, 1, 3], [11, 0, 4], [18, 1, 3], [24, 0, 6]),
  },
  {
    id: "signal", label: "SIGNAL", progression: progression("Cmaj7", "Amin7", "Emin9", "Bmin9"),
    colorSteps: [21], accentOffset: 11, leadInstrument: "Rave_Saw", leadGain: 0.13,
    motif: motif([1, 1, 2], [5, 1, 2], [10, 0, 4], [17, 1, 2], [21, 0, 2], [27, 1, 4]),
  },
  {
    id: "orbit", label: "ORBIT", progression: progression("Eminsus2", "Gmaj7", "Cmaj7", "Amin9"),
    colorSteps: [9, 27], accentOffset: 17, leadInstrument: "Short_String", leadGain: 0.14,
    motif: motif([0, 1, 10], [14, 0, 7], [24, 1, 7]),
  },
  {
    id: "return", label: "RETURN", progression: progression("Amin9", "Cmaj7", "Gmaj7", "Bmin9"),
    colorSteps: [7, 23, 30], accentOffset: 23, leadInstrument: "Stab_FX", leadGain: 0.12,
    motif: motif([3, 0, 2], [9, 1, 2], [15, 0, 3], [22, 1, 2], [28, 0, 3]),
  },
]);

export function junctionFamilyMelodyNotes(family) {
  return family.progression.flatMap((step) => family.motif.map((event) => (
    step.accentMidis[event.degree % step.accentMidis.length]
  )));
}

/**
 * Eight adaptive states with twenty performances each: four takes per family,
 * arranged as two rhythm-locked pairs.
 *
 * Tempo is part of the recording choice, never a browser-side stretch. The
 * slow states use native 127/135 BPM bonus breaks; the faster states use native
 * Jungle recordings. Beat levels are deliberately below the harmonic bus and
 * describe a two-bar phrase envelope, so OPEN introduces rhythm gradually.
 */
const JUNCTION_SECTION_BLUEPRINTS = [
  { id: "open", bpm: 127, beatSource: "bonus", bass: false, pad: 1, melody: 0.34, drive: 0.03, space: 0.62, level: 0.64, beatLevels: [0.08, 0.2, 0.3, 0.38], takes: [
    { beatPhrases: [["01"], ["16"], ["17"], ["18"]], voicing: 0, stab: false },
    { beatPhrases: [["19"], ["20"], ["21"], ["22"]], voicing: 3, stab: false },
    { beatPhrases: [["23"], ["24"], ["25"], ["65"]], voicing: 6, stab: false },
  ] },
  { id: "enter", bpm: 135, beatSource: "bonus", bass: false, color: true, pad: 0.95, melody: 0.56, drive: 0.08, space: 0.5, level: 0.72, beatLevels: [0.34, 0.38, 0.42, 0.44], takes: [
    { beatPhrases: [["02"], ["03"], ["04"], ["05"]], voicing: 1, stab: false },
    { beatPhrases: [["06"], ["07"], ["08"], ["09"]], voicing: 4, stab: false },
    { beatPhrases: [["10"], ["11"], ["12"], ["13"]], voicing: 7, stab: false },
  ] },
  { id: "build", bpm: 158, beatSource: "jungle", bass: true, color: true, pad: 0.88, melody: 0.76, drive: 0.16, space: 0.4, level: 0.82, beatLevels: [0.4, 0.44, 0.46, 0.43], takes: [
    { beatPhrases: [["A:01"], ["A:02"], ["B:01"], ["A:01", "B:02"]], voicing: 2, stab: true },
    { beatPhrases: [["C:01"], ["C:02"], ["A:01", "C:01"], ["B:02"]], voicing: 5, stab: true },
    { beatPhrases: [["D:02"], ["D:01"], ["B:02", "D:02"], ["C:01"]], voicing: 8, stab: true },
  ] },
  { id: "break", bpm: 164, beatSource: "jungle", bass: true, color: true, pad: 0.76, melody: 0.9, drive: 0.24, space: 0.34, level: 0.9, beatLevels: [0.46, 0.5, 0.47, 0.51], takes: [
    { beatPhrases: [["B:02"], ["B:01", "C:02"], ["C:01"], ["D:02", "B:02"]], voicing: 3, stab: true },
    { beatPhrases: [["A:02"], ["C:02", "D:02"], ["A:01"], ["B:01", "C:01"]], voicing: 6, stab: true },
    { beatPhrases: [["D:02"], ["B:02", "C:02"], ["D:01"], ["A:02", "B:01"]], voicing: 9, stab: true },
  ] },
  { id: "full", bpm: 168, beatSource: "jungle", bass: true, color: true, pad: 0.68, melody: 1, drive: 0.32, space: 0.3, level: 0.98, beatLevels: [0.5, 0.54, 0.51, 0.55], takes: [
    { beatPhrases: [["A:01", "C:02"], ["A:02", "B:01"], ["B:02", "D:01"], ["C:02", "D:02"]], voicing: 4, stab: true },
    { beatPhrases: [["B:01", "C:01"], ["A:02", "D:01"], ["A:01", "B:02"], ["C:01", "D:02"]], voicing: 7, stab: true },
    { beatPhrases: [["A:02", "D:01"], ["A:01", "C:01"], ["B:01", "D:02"], ["B:02", "C:01"]], voicing: 10, stab: true },
  ] },
  { id: "turn", bpm: 160, beatSource: "jungle", bass: true, color: true, pad: 0.76, melody: 0.82, drive: 0.27, space: 0.36, level: 0.9, beatLevels: [0.48, 0.4, 0.46, 0.36], takes: [
    { beatPhrases: [["B:01", "D:02"], ["D:01"], ["B:02"], ["C:01"]], voicing: 5, stab: true },
    { beatPhrases: [["C:02", "A:01"], ["A:02"], ["C:01"], ["B:02"]], voicing: 8, stab: true },
    { beatPhrases: [["D:02", "C:01"], ["B:01"], ["A:02"], ["C:02"]], voicing: 11, stab: true },
  ] },
  { id: "ease", bpm: 135, beatSource: "bonus", bass: false, pad: 0.94, melody: 0.46, drive: 0.1, space: 0.52, level: 0.75, beatLevels: [0.4, 0.3, 0.18, 0], takes: [
    { beatPhrases: [["14"], ["15"], ["04"], []], voicing: 6, stab: false },
    { beatPhrases: [["09"], ["12"], ["03"], []], voicing: 9, stab: false },
    { beatPhrases: [["05"], ["11"], ["08"], []], voicing: 12, stab: false },
  ] },
  { id: "rest", bpm: 127, beatSource: null, bass: false, pad: 1, melody: 0.12, drive: 0.02, space: 0.7, level: 0.62, beatLevels: [0, 0, 0, 0], chordBars: [0, 4], takes: [
    { beatPhrases: [[], [], [], []], voicing: 7, stab: false },
    { beatPhrases: [[], [], [], []], voicing: 10, stab: false },
    { beatPhrases: [[], [], [], []], voicing: 13, stab: false },
  ] },
];

function expandTakes(sectionId, baseTakes) {
  const phrasePool = baseTakes.flatMap((take) => take.beatPhrases);
  return Array.from({ length: JUNCTION_TAKES }, (_, takeIndex) => {
    const familyIndex = takeIndex % JUNCTION_FAMILIES.length;
    const familyVariant = Math.floor(takeIndex / JUNCTION_FAMILIES.length);
    const rhythmVariant = Math.floor(familyVariant / 2);
    const base = baseTakes[(familyIndex * 2 + rhythmVariant) % baseTakes.length];
    const phraseOffset = (familyIndex * 5 + rhythmVariant * 7) % phrasePool.length;
    return {
      beatPhrases: Array.from({ length: 4 }, (_, phraseIndex) => (
        phrasePool[(phraseOffset + phraseIndex * 7) % phrasePool.length]
      )),
      voicing: base.voicing + familyIndex * 5 + familyVariant * 11,
      stab: base.stab,
      family: JUNCTION_FAMILIES[familyIndex].id,
      rhythmId: `${sectionId}-${familyIndex}-${rhythmVariant}`,
      melodyVariant: familyVariant,
    };
  });
}

export const JUNCTION_SECTIONS = JUNCTION_SECTION_BLUEPRINTS.map((section) => ({
  ...section,
  takes: expandTakes(section.id, section.takes),
}));

export const JUNCTION_SECTION_IDS = JUNCTION_SECTIONS.map((section) => section.id);

export const JUNCTION_ARRANGEMENT = Array.from({ length: JUNCTION_TAKES }, (_, take) => (
  JUNCTION_SECTIONS.map((section) => ({
    ...section,
    ...section.takes[take],
    take,
  }))
)).flat();

export function junctionSectionFrames(section, sampleRate = 48000) {
  const barFrames = Math.round((60 / section.bpm) * 4 * sampleRate);
  return barFrames * JUNCTION_BARS_PER_SECTION;
}
