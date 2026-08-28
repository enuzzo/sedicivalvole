#!/usr/bin/env node

// Development-only audit of the chord recordings the JUNCTION renderer can
// actually select. This mirrors the renderer's current index arithmetic but
// never decodes, copies, or rewrites source audio.

import { readdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { JUNGLE_ROOT } from "./sample-library.mjs";
import { JUNCTION_ARRANGEMENT, JUNCTION_HARMONY } from "./junction-form.mjs";

const outputArgument = process.argv.indexOf("--output");
const outputPath = outputArgument >= 0 ? resolve(process.argv[outputArgument + 1]) : null;
const chordDirectory = join(JUNGLE_ROOT, "Synth One Shots");

const files = (await readdir(chordDirectory)).filter((file) => file.endsWith(".wav"));
const choicesByChord = new Map();
for (const file of files) {
  const match = basename(file, ".wav").match(/^Jungle_([A-Za-z-]+)_(.+)$/);
  if (!match) continue;
  const [, instrument, chord] = match;
  const choices = choicesByChord.get(chord) ?? [];
  choices.push({ file, instrument, chord });
  choicesByChord.set(chord, choices);
}

const performances = JUNCTION_ARRANGEMENT.map((section, sectionIndex) => {
  const chordSelections = JUNCTION_HARMONY.map((entry) => {
    const choices = choicesByChord.get(entry.chord) ?? [];
    const choiceIndex = choices.length > 0
      ? (section.voicing + sectionIndex) % choices.length
      : null;
    const selected = choiceIndex === null ? null : choices[choiceIndex];
    return {
      bar: entry.bar,
      chord: entry.chord,
      choices: choices.map((choice) => choice.file),
      choice_index: choiceIndex,
      selected_file: selected?.file ?? null,
    };
  });
  const stabSelections = section.stab
    ? [1, 3, 5, 7].map((barInCycle) => {
      const held = [...JUNCTION_HARMONY].reverse().find((entry) => entry.bar <= barInCycle);
      const choices = choicesByChord.get(held.chord) ?? [];
      const choiceIndex = choices.length > 0
        ? (section.voicing + sectionIndex + barInCycle + 1) % choices.length
        : null;
      return {
        bar: barInCycle,
        chord: held.chord,
        choices: choices.map((choice) => choice.file),
        choice_index: choiceIndex,
        selected_file: choiceIndex === null ? null : choices[choiceIndex]?.file ?? null,
      };
    })
    : [];
  return {
    arrangement_index: sectionIndex,
    section: section.id,
    take: section.take,
    performance_id: section.performanceId,
    voicing_seed: section.voicing,
    chord_selections: chordSelections,
    stab_selections: stabSelections,
  };
});

const chordCoverage = JUNCTION_HARMONY.map(({ chord }) => {
  const allChoices = choicesByChord.get(chord) ?? [];
  const selectedFiles = new Set(performances.flatMap((performance) => (
    performance.chord_selections
      .filter((selection) => selection.chord === chord)
      .map((selection) => selection.selected_file)
  )));
  return {
    chord,
    available_files: allChoices.map((choice) => choice.file),
    selected_files: [...selectedFiles].filter(Boolean),
    available_count: allChoices.length,
    selected_count: selectedFiles.has(null) ? selectedFiles.size - 1 : selectedFiles.size,
  };
});

const report = {
  schema: "sedicivalvole.junction-voicing-selection-review.v1",
  role: "selection_observability",
  authority: "measurement",
  decision_status: "review_required",
  renderer_formula: "(section.voicing + sectionIndex) % choices.length",
  source_order: "filesystem_readdir_order_matching_current_renderer",
  performance_count: performances.length,
  diversity_status: chordCoverage.every((entry) => entry.selected_count === 1)
    ? "collapsed_to_one_choice_per_chord"
    : "multiple_choices_reachable",
  chord_coverage: chordCoverage,
  performances,
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) await writeFile(outputPath, serialized);
else process.stdout.write(serialized);
