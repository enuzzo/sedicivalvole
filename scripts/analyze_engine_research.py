#!/usr/bin/env python3
"""Inventory local research audio without changing it; requires ffmpeg and numpy.

This is signal screening, not listening, RPM estimation or source clearance.
Usage: python3 scripts/analyze_engine_research.py INPUT_DIRECTORY OUTPUT_JSON
"""
import hashlib
import json
import math
import re
from pathlib import Path
import subprocess
import sys

import numpy as np


def db(value):
    return round(20 * math.log10(max(float(value), 1e-12)), 3)


def analyze(path, root):
    probe = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)
    ]))
    stream = next(s for s in probe["streams"] if s["codec_type"] == "audio")
    channels = int(stream["channels"])
    decoded = subprocess.run([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", "0:a:0", "-ar", "24000",
        "-f", "f32le", "-acodec", "pcm_f32le", "-"
    ], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    raw = decoded.stdout
    audio = np.frombuffer(raw, dtype="<f4").reshape(-1, channels).astype(np.float64)
    mono = audio.mean(axis=1)
    rms = np.sqrt(np.mean(audio ** 2))
    block = 6000
    n = len(audio) // block
    block_rms = np.sqrt(np.mean(audio[:n * block].reshape(n, -1) ** 2, axis=1))
    # Find a four-second region of stable level, above a relative silence gate.
    # Stable level does not establish stable pitch, engine identity or loopability.
    windows = []
    for i in range(max(0, n - 15)):
        values = block_rms[i:i + 16]
        if values.mean() >= max(rms * 0.35, 1e-5):
            windows.append((float(values.std() / max(values.mean(), 1e-12)), i))
    best = min(windows) if windows else None
    result = {
        "file": str(path.relative_to(root)),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "bytes": path.stat().st_size,
        "codec": stream["codec_name"],
        "source_sample_rate_hz": int(stream["sample_rate"]),
        "source_channels": channels,
        "source_bits_per_sample": int(stream.get("bits_per_raw_sample") or stream.get("bits_per_sample") or 0),
        "decoded_duration_s": round(len(audio) / 24000, 6),
        "analysis_sample_rate_hz": 24000,
        "rms_dbfs": db(rms),
        "sample_peak_dbfs": db(np.abs(audio).max()),
        "samples_at_or_above_fullscale": int(np.count_nonzero(np.abs(audio) >= 1)),
        "mono_sum_vs_channel_rms_db": db(np.sqrt(np.mean(mono ** 2)) / max(rms, 1e-12)),
        "stereo_correlation": round(float(np.corrcoef(audio.T)[0, 1]), 5) if channels == 2 else None,
        "stable_level_window": {"start_s": best[1] / 4, "duration_s": 4,
                                "rms_coefficient_of_variation": round(best[0], 6)} if best else None,
        "decoder_messages": re.sub(r"0x[0-9a-fA-F]+", "<address>", decoded.stderr.decode("utf-8", errors="replace")),
        "auditory_review": "not_performed",
    }
    return result


if __name__ == "__main__":
    root = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2])
    files = sorted(p for p in root.rglob("*") if p.suffix.lower() in {".wav", ".mp3", ".flac", ".ogg"})
    records = [analyze(path, root) for path in files]
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({
        "method": "24 kHz float decode; no gain, EQ, denoise, pitch change or channel remix before metrics",
        "limitations": "Resampling and lossy decoding affect peaks. Fullscale counts do not prove clipping. Level stability does not prove a usable loop. No auditory review or RPM inference.",
        "files": records,
    }, indent=2) + "\n")
    print(json.dumps({"files": len(records), "duration_s": round(sum(r["decoded_duration_s"] for r in records), 3)}))
