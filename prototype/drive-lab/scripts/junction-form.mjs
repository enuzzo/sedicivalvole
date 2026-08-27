export const JUNCTION_TAKES = 3;
export const JUNCTION_BARS_PER_SECTION = 8;

/**
 * Eight adaptive states with three authored performances each.
 *
 * Tempo is part of the recording choice, never a browser-side stretch. The
 * slow states use native 127/135 BPM bonus breaks; the faster states use native
 * Jungle recordings. Beat levels are deliberately below the harmonic bus and
 * describe a two-bar phrase envelope, so OPEN introduces rhythm gradually.
 */
export const JUNCTION_SECTIONS = [
  { id: "open", bpm: 127, beatSource: "bonus", bass: false, pad: 1, drive: 0.03, space: 0.62, level: 0.64, beatLevels: [0.08, 0.2, 0.3, 0.38], takes: [
    { beatPhrases: [["01"], ["16"], ["17"], ["18"]], voicing: 0, stab: false },
    { beatPhrases: [["19"], ["20"], ["21"], ["22"]], voicing: 3, stab: false },
    { beatPhrases: [["23"], ["24"], ["25"], ["65"]], voicing: 6, stab: false },
  ] },
  { id: "enter", bpm: 135, beatSource: "bonus", bass: false, pad: 0.95, drive: 0.08, space: 0.5, level: 0.72, beatLevels: [0.34, 0.38, 0.42, 0.44], takes: [
    { beatPhrases: [["02"], ["03"], ["04"], ["05"]], voicing: 1, stab: false },
    { beatPhrases: [["06"], ["07"], ["08"], ["09"]], voicing: 4, stab: false },
    { beatPhrases: [["10"], ["11"], ["12"], ["13"]], voicing: 7, stab: false },
  ] },
  { id: "build", bpm: 158, beatSource: "jungle", bass: true, pad: 0.88, drive: 0.16, space: 0.4, level: 0.82, beatLevels: [0.4, 0.44, 0.46, 0.43], takes: [
    { beatPhrases: [["A:01"], ["A:02"], ["B:01"], ["A:01", "B:02"]], voicing: 2, stab: true },
    { beatPhrases: [["C:01"], ["C:02"], ["A:01", "C:01"], ["B:02"]], voicing: 5, stab: true },
    { beatPhrases: [["D:02"], ["D:01"], ["B:02", "D:02"], ["C:01"]], voicing: 8, stab: true },
  ] },
  { id: "break", bpm: 164, beatSource: "jungle", bass: true, pad: 0.76, drive: 0.24, space: 0.34, level: 0.9, beatLevels: [0.46, 0.5, 0.47, 0.51], takes: [
    { beatPhrases: [["B:02"], ["B:01", "C:02"], ["C:01"], ["D:02", "B:02"]], voicing: 3, stab: true },
    { beatPhrases: [["A:02"], ["C:02", "D:02"], ["A:01"], ["B:01", "C:01"]], voicing: 6, stab: true },
    { beatPhrases: [["D:02"], ["B:02", "C:02"], ["D:01"], ["A:02", "B:01"]], voicing: 9, stab: true },
  ] },
  { id: "full", bpm: 168, beatSource: "jungle", bass: true, pad: 0.68, drive: 0.32, space: 0.3, level: 0.98, beatLevels: [0.5, 0.54, 0.51, 0.55], takes: [
    { beatPhrases: [["A:01", "C:02"], ["A:02", "B:01"], ["B:02", "D:01"], ["C:02", "D:02"]], voicing: 4, stab: true },
    { beatPhrases: [["B:01", "C:01"], ["A:02", "D:01"], ["A:01", "B:02"], ["C:01", "D:02"]], voicing: 7, stab: true },
    { beatPhrases: [["A:02", "D:01"], ["A:01", "C:01"], ["B:01", "D:02"], ["B:02", "C:01"]], voicing: 10, stab: true },
  ] },
  { id: "turn", bpm: 160, beatSource: "jungle", bass: true, pad: 0.76, drive: 0.27, space: 0.36, level: 0.9, beatLevels: [0.48, 0.4, 0.46, 0.36], takes: [
    { beatPhrases: [["B:01", "D:02"], ["D:01"], ["B:02"], ["C:01"]], voicing: 5, stab: true },
    { beatPhrases: [["C:02", "A:01"], ["A:02"], ["C:01"], ["B:02"]], voicing: 8, stab: true },
    { beatPhrases: [["D:02", "C:01"], ["B:01"], ["A:02"], ["C:02"]], voicing: 11, stab: true },
  ] },
  { id: "ease", bpm: 135, beatSource: "bonus", bass: false, pad: 0.94, drive: 0.1, space: 0.52, level: 0.75, beatLevels: [0.4, 0.3, 0.18, 0], takes: [
    { beatPhrases: [["14"], ["15"], ["04"], []], voicing: 6, stab: false },
    { beatPhrases: [["09"], ["12"], ["03"], []], voicing: 9, stab: false },
    { beatPhrases: [["05"], ["11"], ["08"], []], voicing: 12, stab: false },
  ] },
  { id: "rest", bpm: 127, beatSource: null, bass: false, pad: 1, drive: 0.02, space: 0.7, level: 0.62, beatLevels: [0, 0, 0, 0], chordBars: [0, 4], takes: [
    { beatPhrases: [[], [], [], []], voicing: 7, stab: false },
    { beatPhrases: [[], [], [], []], voicing: 10, stab: false },
    { beatPhrases: [[], [], [], []], voicing: 13, stab: false },
  ] },
];

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
