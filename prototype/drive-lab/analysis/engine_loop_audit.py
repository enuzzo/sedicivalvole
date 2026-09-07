#!/usr/bin/env python3
"""Read-only measurements of admitted Engine loops; never determines engine RPM."""

import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess

import numpy as np


def decode_wave(raw):
    if raw[:4] != b"RIFF" or raw[8:12] != b"WAVE":
        raise ValueError("Expected a little-endian RIFF/WAVE file")
    chunks, loops, cue_points = [], [], []
    offset, fmt, audio = 12, None, None
    while offset + 8 <= len(raw):
        kind, size = struct.unpack_from("<4sI", raw, offset)
        end = offset + 8 + size
        if end > len(raw):
            raise ValueError("Truncated RIFF chunk")
        chunk = raw[offset + 8:end]
        chunks.append(kind.decode("ascii", "replace"))
        if kind == b"fmt ":
            fmt = struct.unpack_from("<HHIIHH", chunk)
        elif kind == b"data":
            if audio is not None:
                raise ValueError("Multiple data chunks are not supported")
            audio = chunk
        elif kind == b"smpl" and size >= 36:
            count = struct.unpack_from("<9I", chunk)[7]
            for index in range(count):
                values = struct.unpack_from("<6I", chunk, 36 + 24 * index)
                loops.append({"type": values[1], "start_frame": values[2], "end_frame_inclusive": values[3]})
        elif kind == b"cue " and size >= 4:
            count = struct.unpack_from("<I", chunk)[0]
            for index in range(count):
                values = struct.unpack_from("<II4sIII", chunk, 4 + 24 * index)
                cue_points.append(values[5])
        offset = end + size % 2
    if fmt is None or audio is None:
        raise ValueError("Missing format or data chunk")
    encoding, channels, sample_rate, _, block_align, bits = fmt
    if len(audio) % block_align:
        raise ValueError("Incomplete audio frame")
    if encoding == 3 and bits in (32, 64):
        samples = np.frombuffer(audio, dtype="<f4" if bits == 32 else "<f8").astype(np.float64)
    elif encoding == 1 and bits in (16, 32):
        samples = np.frombuffer(audio, dtype="<i2" if bits == 16 else "<i4").astype(np.float64) / 2 ** (bits - 1)
    elif encoding == 1 and bits == 24:
        packed = np.frombuffer(audio, dtype=np.uint8).reshape(-1, 3).astype(np.int32)
        values = packed[:, 0] | packed[:, 1] << 8 | packed[:, 2] << 16
        samples = ((values ^ 0x800000) - 0x800000).astype(np.float64) / 8388608
    else:
        raise ValueError(f"Unsupported WAVE encoding {encoding}, {bits} bits")
    samples = samples.reshape(-1, channels)
    if not np.isfinite(samples).all():
        raise ValueError("Non-finite audio data")
    return samples, sample_rate, {"encoding": "IEEE_FLOAT" if encoding == 3 else "PCM", "bits": bits,
                                 "chunks": chunks, "sampler_loops": loops, "cue_frames": cue_points}


def db(value):
    return 20 * math.log10(value) if value > 0 else None


def edge_metrics(samples, sample_rate):
    rows = []
    for channel in range(samples.shape[1]):
        data = samples[:, channel]
        step = float(data[0] - data[-1])
        differences = np.abs(np.diff(data))
        p99 = float(np.quantile(differences, .99))
        p999 = float(np.quantile(differences, .999))
        rms = float(np.sqrt(np.mean(data ** 2)))
        edge_frames = max(1, round(sample_rate * .01))
        rows.append({"channel": channel, "rms": rms, "rms_dbfs": db(rms),
                     "peak": float(np.max(np.abs(data))), "dc": float(np.mean(data)),
                     "wrap_step": step, "wrap_step_dbfs": db(abs(step)),
                     "interior_abs_step_p99": p99, "interior_abs_step_p999": p999,
                     "wrap_to_interior_p99": abs(step) / p99 if p99 else None,
                     "interior_step_percentile_of_wrap": float(np.mean(differences <= abs(step)) * 100),
                     "first_10ms_rms": float(np.sqrt(np.mean(data[:edge_frames] ** 2))),
                     "last_10ms_rms": float(np.sqrt(np.mean(data[-edge_frames:] ** 2))),
                     "unusual_boundary_flag": bool(abs(step) > max(.08, 3.5 * p999))})
    return rows


def seam_candidate(samples, sample_rate):
    """Measure an in-memory proposal only; never writes or replaces audio."""
    frames = round(sample_rate * .01)
    weights = (.5 - .5 * np.cos(np.linspace(0, math.pi, frames)))[:, None]
    candidate = samples.copy()
    candidate[-frames:] = samples[-frames:] * (1 - weights) + samples[:frames] * weights
    old_rms = float(np.sqrt(np.mean(samples ** 2)))
    new_rms = float(np.sqrt(np.mean(candidate[frames:] ** 2)))
    assert np.max(np.abs(candidate)) <= np.max(np.abs(samples)) + 1e-12
    return {"status": "analysis_only_not_applied_to_audio_files", "method": "Complementary raised-cosine tail/head blend in the decoded tail; loop starts after the head; coefficients sum to one",
            "blend_frames": frames, "duration_removed_ms": frames / sample_rate * 1000,
            "loop_start_s": frames / sample_rate, "loop_end_s": len(samples) / sample_rate,
            "steady_loop_rms_change_db": db(new_rms / old_rms), "peak_cannot_increase": True,
            "channels_analysis": edge_metrics(candidate[frames:], sample_rate),
            "transition_max_abs_step": float(np.max(np.abs(np.diff(candidate[-frames - 2:], axis=0)))),
            "limitations": "Changes loop duration and phase; can cause short local cancellation; no repeat-listening or resampled runtime render yet."}


def peak_indices(values, lower, upper):
    ids = np.arange(max(1, lower), min(len(values) - 1, upper + 1))
    return ids[(values[ids] > values[ids - 1]) & (values[ids] >= values[ids + 1])]


def parabolic_offset(values, index):
    left, center, right = values[index - 1:index + 2]
    denominator = left - 2 * center + right
    return float(np.clip(.5 * (left - right) / denominator, -.5, .5)) if denominator else 0


def period_metrics(samples, sample_rate):
    # Channel powers/correlations are summed, avoiding stereo downmix cancellation.
    length = min(sample_rate, len(samples))
    offsets = np.unique(np.rint(np.linspace(0, len(samples) - length, 9)).astype(int))
    nfft = 1 << (2 * length - 1).bit_length()
    spectral_power = np.zeros(nfft // 2 + 1)
    candidates = []
    for window_id, offset in enumerate(offsets):
        data = samples[offset:offset + length].copy()
        data -= np.mean(data, axis=0)
        transformed = np.fft.rfft(data, n=nfft, axis=0)
        corr = np.fft.irfft(np.sum(np.abs(transformed) ** 2, axis=1), n=nfft)[:length]
        energy = np.sum(data ** 2, axis=1)
        prefix = np.concatenate(([0.0], np.cumsum(energy)))
        lags = np.arange(length)
        normalization = np.sqrt(prefix[length - lags] * (prefix[length] - prefix[lags]))
        corr /= np.maximum(normalization, 1e-20)
        ids = peak_indices(corr, math.ceil(sample_rate / 800), math.floor(sample_rate / 20))
        ids = sorted(ids, key=lambda index: -corr[index])
        selected = []
        for index in ids:
            if corr[index] < .1:
                break
            frequency = sample_rate / (index + parabolic_offset(corr, index))
            if any(abs(math.log2(frequency / old)) < .04 for old in selected):
                continue
            selected.append(frequency)
            candidates.append({"frequency": frequency, "correlation": float(corr[index]), "window": window_id})
            if len(selected) == 3:
                break
        windowed = data * np.hanning(length)[:, None]
        spectral_power += np.sum(np.abs(np.fft.rfft(windowed, n=nfft, axis=0)) ** 2, axis=1)
    groups = []
    for item in sorted(candidates, key=lambda item: item["frequency"]):
        group = next((group for group in groups if abs(math.log2(item["frequency"] / np.median([x["frequency"] for x in group]))) < .04), None)
        if group is None:
            groups.append([item])
        else:
            group.append(item)
    groups.sort(key=lambda group: (-len({item["window"] for item in group}), -np.median([item["correlation"] for item in group])))
    periodicities = []
    for group in groups[:5]:
        frequencies = [item["frequency"] for item in group]
        frequency = float(np.median(frequencies))
        periodicities.append({"frequency_hz": frequency, "period_ms": 1000 / frequency,
                              "frequency_p10_hz": float(np.quantile(frequencies, .1)),
                              "frequency_p90_hz": float(np.quantile(frequencies, .9)),
                              "median_correlation": float(np.median([item["correlation"] for item in group])),
                              "windows_supporting": len({item["window"] for item in group})})
    ids = peak_indices(spectral_power, math.ceil(20 * nfft / sample_rate), math.floor(4000 * nfft / sample_rate))
    selected = []
    maximum = float(np.max(spectral_power))
    log_power = np.log(np.maximum(spectral_power, 1e-30))
    for index in sorted(ids, key=lambda index: -spectral_power[index]):
        frequency = (index + parabolic_offset(log_power, index)) * sample_rate / nfft
        if any(abs(frequency - old["frequency_hz"]) < 5 for old in selected):
            continue
        selected.append({"frequency_hz": frequency, "relative_peak_db": 10 * math.log10(float(spectral_power[index]) / maximum)})
        if len(selected) == 5:
            break
    return {"windows": len(offsets), "window_duration_s": length / sample_rate,
            "frequency_resolution_hz": sample_rate / length,
            "autocorrelation_period_candidates": periodicities,
            "averaged_spectrum_peaks": selected, "inferred_rpm": None,
            "uncertainty": "Candidates may be harmonics, subharmonics, firing, shaft, exhaust, or transmission components; cylinder/order metadata and listening are required."}


def self_test():
    sample_rate = 12000
    time = np.arange(sample_rate * 2) / sample_rate
    sine = (.3 * np.sin(2 * np.pi * 120 * time))[:, None]
    edges = edge_metrics(sine, sample_rate)
    assert not edges[0]["unusual_boundary_flag"]
    assert edges[0]["wrap_to_interior_p99"] < 1.01
    damaged = sine.copy()
    damaged[-1] = .9
    assert edge_metrics(damaged, sample_rate)[0]["unusual_boundary_flag"]
    analysis = period_metrics(np.concatenate((sine, -sine), axis=1), sample_rate)
    assert any(abs(item["frequency_hz"] - 120) < .5 for item in analysis["autocorrelation_period_candidates"])
    assert abs(analysis["averaged_spectrum_peaks"][0]["frequency_hz"] - 120) < .5
    assert analysis["inferred_rpm"] is None
    candidate = seam_candidate(damaged, sample_rate)
    assert candidate["peak_cannot_increase"]
    assert abs(candidate["channels_analysis"][0]["wrap_step"]) < abs(edge_metrics(damaged, sample_rate)[0]["wrap_step"])


def rounded(value):
    if isinstance(value, float):
        return round(value, 8)
    if isinstance(value, dict):
        return {key: rounded(item) for key, item in value.items()}
    if isinstance(value, list):
        return [rounded(item) for item in value]
    return value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("engine-loop-measurements.json"))
    parser.add_argument("--markdown", type=Path, default=Path(__file__).with_name("engine-loop-measurements.md"))
    args = parser.parse_args()
    self_test()
    root = Path(__file__).resolve().parents[1]
    module = (root / "src/engine/profiles.js").as_uri()
    query = f'import {{ ENGINE_PROFILES }} from {json.dumps(module)}; console.log(JSON.stringify({{node:process.version,assets:ENGINE_PROFILES.flatMap(p=>p.assets.filter(a=>/^(on|off)_(low|high)$/.test(a.role)).map(a=>({{...a,profile:p.id}})))}}));'
    profiles = json.loads(subprocess.check_output([os.environ.get("NODE_BINARY", "node"), "--input-type=module", "--eval", query], text=True))
    assert len(profiles["assets"]) == 12, "Review changed core inventory before rerunning"
    rows = []
    for asset in profiles["assets"]:
        path = root / "public" / asset["url"].lstrip("/")
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        assert digest == asset["sha256"] and len(raw) == asset["bytes"], f"Inventory mismatch: {asset['url']}"
        samples, sample_rate, wave_format = decode_wave(raw)
        row = {"profile": asset["profile"], "role": asset["role"], "url": asset["url"],
                     "source": asset["source"], "sha256": digest, "encoded_bytes": len(raw),
                     "declared_reference_rpm_unverified": asset["rpm"], "native_sample_rate": sample_rate,
                     "channels": samples.shape[1], "frames": samples.shape[0], "duration_s": len(samples) / sample_rate,
                     "wave_format": wave_format, "channels_analysis": edge_metrics(samples, sample_rate),
                     "period_analysis": period_metrics(samples, sample_rate)}
        if asset["profile"] == "mono":
            row["seam_candidate"] = seam_candidate(samples, sample_rate)
        rows.append(row)
    report = {"schema": "sedicivalvole.engine-loop-audit.v1", "purpose": "read-only review evidence; no RPM or audibility verdict",
              "analyzer_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "inventory_sha256": hashlib.sha256((root / "src/engine/source-inventory.json").read_bytes()).hexdigest(),
              "configuration_sha256": hashlib.sha256((root / "src/engine/upstream/configurations.ts").read_bytes()).hexdigest(),
              "numpy": np.__version__, "node": profiles["node"], "self_test": "pass",
              "method": {"audio_preprocessing": "None for edge measurements; per-window channel means removed only for spectral/period analysis",
                         "unusual_boundary_flag": "abs(first-last) > max(0.08 FS, 3.5 * interior abs-step p99.9), uncalibrated review cue only; runtime uses a conservative histogram upper bound instead of exact quantile",
                         "periods": "Nine evenly placed one-second windows (may overlap; not independent evidence); overlap-energy-normalized autocorrelation, 20–800 Hz lag search; top three positive peaks per window, clustered within 0.04 octave",
                         "spectrum": "Average channel-power Hann periodograms over the same windows; strongest 20–4000 Hz local peaks, at least 5 Hz apart; zero padding interpolates but does not improve 1 Hz physical resolution",
                         "scope": "Native file wrap only; runtime resampling, sample gains, crossfades, limiter and perceived Tesla audio are not measured"},
              "assets": rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(rounded(report), indent=2) + "\n")
    lines = ["# Admitted Engine loop measurements", "", "Read-only native-file analysis. No audio file was written or replaced. Exact hashes and full channel/period details are in `engine-loop-measurements.json`.", "",
             "## Native wrap boundaries", "", "The wrap step is the absolute first-minus-last sample at the current full-file loop. Values below use the worse channel; the p99.9 ratio is also the worse channel. The flag is an uncalibrated listening-priority cue, not a claim that a click was heard.", "",
             "| Profile / role | Format | Duration (s) | Maximum wrap step (FS) | Maximum wrap / interior p99.9 | Review flag | Strongest spectral peak (Hz) |", "|---|---|---:|---:|---:|---|---:|"]
    for row in rows:
        channels = row["channels_analysis"]
        lines.append(f'| {row["profile"]} / {row["role"]} | {row["wave_format"]["encoding"]} {row["wave_format"]["bits"]}, {row["native_sample_rate"]} Hz | {row["duration_s"]:.3f} | {max(abs(c["wrap_step"]) for c in channels):.5f} | {max(abs(c["wrap_step"]) / c["interior_abs_step_p999"] for c in channels):.3f} | {"YES" if any(c["unusual_boundary_flag"] for c in channels) else "—"} | {row["period_analysis"]["averaged_spectrum_peaks"][0]["frequency_hz"]:.1f} |')
    lines += ["", "No file declares a `smpl` loop region. Cue markers, where present, do not establish loop boundaries. Mono uses PCM16 at 48 kHz; Rosso and Touring use IEEE float32 at 44.1 kHz. All are stereo.", "",
              "## Decoded-tail repair experiment", "", "A 10 ms complementary raised-cosine blend replaces only the tail in memory. It blends the old tail into the unchanged first 10 ms, then repeats from frame L (`loopStart = L/sampleRate`, `loopEnd = N/sampleRate`). The new last sample equals original sample L−1, making the repeat join the original neighbouring pair L−1→L. The blend starts with the untouched old tail sample. Convex weights bound peak by the original peak; they can cause a brief local cancellation. Repeated duration is 10 ms shorter. This is waveform repair, not a pitch or RPM calibration.", "",
              "| Mono role | Selected by threshold | Prepared maximum wrap step (FS) | Steady-loop RMS change (dB) |", "|---|---|---:|---:|"]
    for row in rows:
        if "seam_candidate" not in row:
            continue
        candidate = row["seam_candidate"]
        lines.append(f'| {row["role"]} | {"YES" if any(c["unusual_boundary_flag"] for c in row["channels_analysis"]) else "NO"} | {max(abs(c["wrap_step"]) for c in candidate["channels_analysis"]):.5f} | {candidate["steady_loop_rms_change_db"]:+.5f} |')
    lines += ["", "The corresponding original runtime helper is `src/engine/loop-seam.js`; its 4,096-bin p99.9 upper bound selects the same three native files. A 0.08 FS floor and 3.5× outlier ratio retain Mono on_low and every Rosso/Touring loop unchanged. These thresholds are explicit bank-derived tuning seeds. The helper's dedicated tests verify native selection, exact repaired joins, unchanged head/body samples, bounded peaks, less than 0.02 dB per-channel steady-loop RMS change, idempotence and original encoded hashes. The analysis itself does not activate the helper.", "",
              "## Period candidates and uncertainty", "", "Nine evenly placed one-second windows supply autocorrelation candidates from 20–800 Hz and channel-power Hann spectra from 20–4,000 Hz. Windows may overlap and are not independent corroboration. The JSON includes candidate spread, supporting-window count and correlation. Zero padding helps interpolate a peak but does not improve the one-second physical resolution. Stereo channel powers are summed to avoid cancellation from a mono downmix.", "",
              "Several candidate periods coexist for each sample. For example, Mono's spectra cluster around 113–114 Hz while correlations also favour approximately 28 or 57 Hz. These may be different orders of one cyclic excitation; they cannot establish crankshaft RPM, cylinder count or firing order. All `inferred_rpm` fields deliberately remain null. Do not replace the donor's RPM metadata or pitch law from this evidence alone.", "",
              "## Reproduce", "", "Requires the existing NumPy installation and Node with TypeScript stripping support; no SciPy or new package is needed. From the repository root:", "", "```sh", "python3 prototype/drive-lab/analysis/engine_loop_audit.py", "node --test prototype/drive-lab/tests/engine-loop-seam.test.mjs", "```", "",
              "Use a Python environment containing NumPy (this run: " + np.__version__ + "). The script first validates a known 120 Hz periodic/stereo-antiphase fixture and a deliberately damaged boundary, then verifies every admitted file against its inventory SHA-256 and size. Profile roles and declared RPM labels come directly from the current configuration module. The output records analyzer, configuration and inventory hashes. The script does not perform a listening test, browser resampling/render test, loudness matching, transmission/limiter analysis or physical-Tesla acceptance.", ""]
    args.markdown.parent.mkdir(parents=True, exist_ok=True)
    args.markdown.write_text("\n".join(lines))
    print(f"Measured {len(rows)} verified core loops; wrote {args.output}")


if __name__ == "__main__":
    main()
