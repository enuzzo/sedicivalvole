"""Deterministic evidence for separating voiced notes from harmonic partials."""

from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Iterable

import numpy as np
from scipy.optimize import nnls
from scipy.signal import stft


FRAME_SIZE = 8192
HOP_SIZE = 512
MAX_EXPLANATORY_HARMONIC = 16
HARMONIC_TOLERANCE_CENTS = 35.0
MIN_CANDIDATE_DB = -32.0
MIN_TEMPORAL_RESIDUAL = 0.22


@dataclass(frozen=True)
class HarmonicSource:
    midi: int
    harmonic: int
    cents_error: float


@dataclass(frozen=True)
class CandidateEvidence:
    midi: int
    frequency_hz: float
    db_relative: float
    temporal_residual: float
    explained_fraction: float
    sources: tuple[HarmonicSource, ...]
    verdict: str

    def to_dict(self) -> dict:
        result = asdict(self)
        result["sources"] = [asdict(source) for source in self.sources]
        return result


def midi_to_frequency(midi: int, tuning_cents: float = 0.0) -> float:
    return 440.0 * math.pow(2.0, ((midi - 69) + tuning_cents / 100.0) / 12.0)


def cents_between(actual_hz: float, reference_hz: float) -> float:
    return 1200.0 * math.log2(actual_hz / reference_hz)


def harmonic_sources(
    candidate_midi: int,
    lower_midis: Iterable[int],
    tuning_cents: float = 0.0,
) -> tuple[HarmonicSource, ...]:
    candidate_hz = midi_to_frequency(candidate_midi, tuning_cents)
    sources = []
    for midi in lower_midis:
        if midi >= candidate_midi:
            continue
        fundamental = midi_to_frequency(midi, tuning_cents)
        harmonic = max(2, round(candidate_hz / fundamental))
        if harmonic > MAX_EXPLANATORY_HARMONIC:
            continue
        partial_hz = fundamental * harmonic
        error = cents_between(partial_hz, candidate_hz)
        if abs(error) <= HARMONIC_TOLERANCE_CENTS:
            sources.append(HarmonicSource(midi=midi, harmonic=harmonic, cents_error=round(error, 3)))
    return tuple(sorted(sources, key=lambda source: (abs(source.cents_error), source.midi)))


def _spectral_envelopes(y: np.ndarray, sample_rate: int, frequencies: Iterable[float]) -> dict[float, np.ndarray]:
    frame_size = min(FRAME_SIZE, max(1024, 1 << max(10, int(math.log2(max(1, len(y)))))))
    if frame_size > len(y):
        y = np.pad(y, (0, frame_size - len(y)))
    frequencies_hz, _, spectrum = stft(
        y,
        fs=sample_rate,
        window="hann",
        nperseg=frame_size,
        noverlap=frame_size - min(HOP_SIZE, frame_size // 4),
        nfft=frame_size,
        boundary=None,
        padded=False,
    )
    magnitude = np.abs(spectrum)
    result = {}
    for frequency in frequencies:
        index = int(np.argmin(np.abs(frequencies_hz - frequency)))
        lower = max(0, index - 1)
        upper = min(magnitude.shape[0], index + 2)
        result[frequency] = np.sqrt(np.sum(np.square(magnitude[lower:upper]), axis=0))
    return result


def analyse_candidate(
    y: np.ndarray,
    sample_rate: int,
    candidate_midi: int,
    lower_midis: Iterable[int],
    tuning_cents: float = 0.0,
) -> CandidateEvidence:
    lower_midis = tuple(lower_midis)
    candidate_hz = midi_to_frequency(candidate_midi, tuning_cents)
    source_notes = harmonic_sources(candidate_midi, lower_midis, tuning_cents)
    source_frequencies = [midi_to_frequency(source.midi, tuning_cents) for source in source_notes]
    envelopes = _spectral_envelopes(y, sample_rate, [candidate_hz, *source_frequencies])
    target = envelopes[candidate_hz]
    peak = max(float(np.max(target)), 1e-12)

    reference_frequencies = [midi_to_frequency(midi, tuning_cents) for midi in lower_midis]
    reference_envelopes = _spectral_envelopes(y, sample_rate, reference_frequencies)
    reference_peak = max((float(np.max(value)) for value in reference_envelopes.values()), default=peak)
    db_relative = 20.0 * math.log10(peak / max(reference_peak, 1e-12))

    if not source_notes:
        temporal_residual = 1.0
        explained_fraction = 0.0
    else:
        columns = []
        for frequency in source_frequencies:
            envelope = envelopes[frequency]
            columns.append(envelope / max(float(np.linalg.norm(envelope)), 1e-12))
        columns.append(np.ones_like(target) / math.sqrt(max(1, len(target))))
        dictionary = np.column_stack(columns)
        coefficients, _ = nnls(dictionary, target)
        fitted = dictionary @ coefficients
        temporal_residual = float(np.linalg.norm(target - fitted) / max(np.linalg.norm(target), 1e-12))
        explained_fraction = max(0.0, min(1.0, 1.0 - temporal_residual))

    if db_relative < MIN_CANDIDATE_DB:
        verdict = "inaudible"
    elif source_notes and temporal_residual < MIN_TEMPORAL_RESIDUAL:
        verdict = "harmonic_of"
    elif temporal_residual >= MIN_TEMPORAL_RESIDUAL:
        verdict = "voiced"
    else:
        verdict = "unknown"

    return CandidateEvidence(
        midi=candidate_midi,
        frequency_hz=round(candidate_hz, 3),
        db_relative=round(db_relative, 3),
        temporal_residual=round(temporal_residual, 6),
        explained_fraction=round(explained_fraction, 6),
        sources=source_notes,
        verdict=verdict,
    )
