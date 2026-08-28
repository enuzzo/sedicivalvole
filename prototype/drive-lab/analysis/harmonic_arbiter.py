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
HARMONIC_TOLERANCE_CENTS = 8.0
MIN_CANDIDATE_DB = -32.0
MIN_TEMPORAL_RESIDUAL = 0.22
DIRECT_SEARCH_TOLERANCE_CENTS = HARMONIC_TOLERANCE_CENTS
MIN_DIRECT_SOURCE_HZ = 30.0


@dataclass(frozen=True)
class HarmonicSource:
    midi: int
    harmonic: int
    cents_error: float


@dataclass(frozen=True)
class IndependentSourceEvidence:
    hypothesis_frequency_hz: float
    observed_peak_frequency_hz: float
    cents_from_hypothesis: float
    nearest_midi: int
    nearest_note_cents: float
    candidate_harmonic: int
    fundamental_snr_db: float
    db_relative_to_candidate: float
    supporting_partials: int
    plausible: bool
    status: str = "review_evidence_only"


@dataclass(frozen=True)
class CandidateEvidence:
    midi: int
    frequency_hz: float
    db_relative: float
    temporal_residual: float
    explained_fraction: float
    sources: tuple[HarmonicSource, ...]
    independent_sources: tuple[IndependentSourceEvidence, ...]
    valid: bool
    reason: str
    verdict: str

    def to_dict(self) -> dict:
        result = asdict(self)
        result["sources"] = [asdict(source) for source in self.sources]
        result["independent_sources"] = [asdict(source) for source in self.independent_sources]
        return result


def midi_to_frequency(midi: int, tuning_cents: float = 0.0) -> float:
    return 440.0 * math.pow(2.0, ((midi - 69) + tuning_cents / 100.0) / 12.0)


def cents_between(actual_hz: float, reference_hz: float) -> float:
    return 1200.0 * math.log2(actual_hz / reference_hz)


def frequency_to_midi(frequency_hz: float, tuning_cents: float = 0.0) -> float:
    return 69.0 + 12.0 * math.log2(frequency_hz / 440.0) - tuning_cents / 100.0


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


def _windowed_spectrum(y: np.ndarray, sample_rate: int) -> tuple[np.ndarray, np.ndarray]:
    if len(y) < 32:
        return np.array([0.0]), np.array([0.0])
    centred = np.asarray(y, dtype=np.float64) - float(np.mean(y))
    windowed = centred * np.hanning(len(centred))
    n_fft = max(65_536, 1 << math.ceil(math.log2(len(windowed))))
    frequencies = np.fft.rfftfreq(n_fft, 1.0 / sample_rate)
    magnitude = np.abs(np.fft.rfft(windowed, n=n_fft))
    return frequencies, magnitude


def _peak_and_noise(
    frequencies: np.ndarray,
    magnitude: np.ndarray,
    expected_hz: float,
    tolerance_cents: float = DIRECT_SEARCH_TOLERANCE_CENTS,
) -> tuple[float, float, float]:
    tolerance_hz = max(0.8, expected_hz * (math.pow(2.0, tolerance_cents / 1200.0) - 1.0))
    peak_mask = np.abs(frequencies - expected_hz) <= tolerance_hz
    if not np.any(peak_mask):
        return expected_hz, 0.0, 0.0
    peak_indices = np.flatnonzero(peak_mask)
    strongest_index = int(peak_indices[np.argmax(magnitude[peak_indices])])
    observed_peak_hz = float(frequencies[strongest_index])
    peak = float(magnitude[strongest_index])
    distance = np.abs(frequencies - expected_hz)
    noise_mask = (distance >= max(8.0, tolerance_hz * 3.0)) & (distance <= 36.0)
    noise = float(np.median(magnitude[noise_mask])) if np.any(noise_mask) else 0.0
    return observed_peak_hz, peak, max(noise, 1e-12)


def independent_harmonic_sources(
    y: np.ndarray,
    sample_rate: int,
    candidate_midi: int,
    tuning_cents: float = 0.0,
) -> tuple[IndependentSourceEvidence, ...]:
    """Inspect possible fundamentals directly, without transcription proposals.

    This deliberately produces review evidence only. A spectral peak can show that
    a lower source is plausible, but magnitude alone cannot prove whether the
    disputed upper component is its partial or an independently voiced note.
    """

    candidate_hz = midi_to_frequency(candidate_midi, tuning_cents)
    frequencies, magnitude = _windowed_spectrum(y, sample_rate)
    _, candidate_peak, _ = _peak_and_noise(frequencies, magnitude, candidate_hz)
    evidence = []
    for candidate_harmonic in range(2, MAX_EXPLANATORY_HARMONIC + 1):
        source_hz = candidate_hz / candidate_harmonic
        if source_hz < MIN_DIRECT_SOURCE_HZ:
            break
        observed_source_hz, fundamental_peak, fundamental_noise = _peak_and_noise(
            frequencies,
            magnitude,
            source_hz,
        )
        fundamental_snr_db = 20.0 * math.log10(max(fundamental_peak, 1e-12) / fundamental_noise)
        supporting_partials = 0
        for source_harmonic in range(1, min(candidate_harmonic, 5)):
            partial_hz = source_hz * source_harmonic
            _, partial_peak, partial_noise = _peak_and_noise(frequencies, magnitude, partial_hz)
            partial_snr_db = 20.0 * math.log10(max(partial_peak, 1e-12) / partial_noise)
            if partial_snr_db >= 10.0:
                supporting_partials += 1
        source_db_relative = 20.0 * math.log10(
            max(fundamental_peak, 1e-12) / max(candidate_peak, 1e-12)
        )
        midi_float = frequency_to_midi(observed_source_hz, tuning_cents)
        nearest_midi = round(midi_float)
        nearest_frequency = midi_to_frequency(nearest_midi, tuning_cents)
        cents_from_hypothesis = cents_between(observed_source_hz, source_hz)
        plausible = (
            fundamental_snr_db >= 12.0
            and source_db_relative >= MIN_CANDIDATE_DB
            and supporting_partials >= 2
            and abs(cents_from_hypothesis) <= DIRECT_SEARCH_TOLERANCE_CENTS
        )
        if plausible:
            evidence.append(
                IndependentSourceEvidence(
                    hypothesis_frequency_hz=round(source_hz, 3),
                    observed_peak_frequency_hz=round(observed_source_hz, 3),
                    cents_from_hypothesis=round(cents_from_hypothesis, 3),
                    nearest_midi=nearest_midi,
                    nearest_note_cents=round(cents_between(observed_source_hz, nearest_frequency), 3),
                    candidate_harmonic=candidate_harmonic,
                    fundamental_snr_db=round(fundamental_snr_db, 3),
                    db_relative_to_candidate=round(source_db_relative, 3),
                    supporting_partials=supporting_partials,
                    plausible=True,
                )
            )
    return tuple(evidence)


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
    independent_sources = independent_harmonic_sources(
        y,
        sample_rate,
        candidate_midi,
        tuning_cents,
    )
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
        valid = True
        reason = "below_candidate_floor"
        verdict = "inaudible"
    else:
        valid = False
        reason = "proposal_conditioned_feature_not_decision_authority"
        verdict = "unknown"

    return CandidateEvidence(
        midi=candidate_midi,
        frequency_hz=round(candidate_hz, 3),
        db_relative=round(db_relative, 3),
        temporal_residual=round(temporal_residual, 6),
        explained_fraction=round(explained_fraction, 6),
        sources=source_notes,
        independent_sources=independent_sources,
        valid=valid,
        reason=reason,
        verdict=verdict,
    )
