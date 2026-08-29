#!/usr/bin/env python3
"""Inventory the ignored MusicRadar 1980s source library without copying it.

The report is development evidence. It records declared musical metadata,
objective level/transient measurements and cautious chroma-based chord
proposals. Filename declarations remain separate from analysis proposals: a
proposal is useful for curation, never permission to assume harmony by itself.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf


NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
TONAL_ROLES = frozenset({"bass", "harmony", "lead"})


def db(value: float) -> float | None:
    if value <= 0:
        return None
    return round(20 * math.log10(value), 3)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def declared_bpm(path: Path) -> int | None:
    for part in reversed(path.parts):
        match = re.search(r"(?:\[|\b)(\d{2,3})(?:\]|\s*bpm|bpm|\b)", part, re.IGNORECASE)
        if match:
            value = int(match.group(1))
            if 60 <= value <= 200:
                return value
    return None


def declared_key(path: Path, bpm: int | None) -> str | None:
    if bpm is None:
        return None
    match = re.search(rf"{bpm}([A-G](?:#|b)?)-\d+\.wav$", path.name, re.IGNORECASE)
    return match.group(1).upper() if match else None


def role_for(path: Path) -> str:
    label = "/".join(path.parts[-3:]).lower()
    if "drums/hits" in label or "drum kits" in label or "gated snares" in label:
        return "one-shot"
    if "fill" in label:
        return "fill"
    if "drums/beats" in label or "beat[" in label:
        return "groove"
    if "perc" in label or "shaker" in label or "tamb" in label:
        return "percussion"
    if "bass" in label:
        return "bass"
    if "lead" in label:
        return "lead"
    if any(token in label for token in ("pad", "piano", "guitar", "strings", "clavy")):
        return "harmony"
    return "texture"


def instrument_for(path: Path, pack: str) -> str:
    if pack == "musicradar-502-eighties":
        parts = path.parts
        kit_index = next(index for index, part in enumerate(parts) if part.startswith("Kit"))
        return parts[kit_index + 1]
    if "Gated Snares" in path.parts:
        return "Gated Snare"
    if "Drum Kits" in path.parts:
        return path.parent.name
    name = path.stem.lower()
    if "fill" in name:
        return "Drum Fill"
    if "beat" in name:
        return "Drum Beat"
    return path.parent.name


def pack_for(path: Path) -> str:
    if "musicradar-eighties-samples" in path.parts:
        return "musicradar-502-eighties"
    return "musicradar-183-80s-pop-drums"


def kit_for(path: Path) -> str | None:
    return next((part for part in path.parts if re.match(r"Kit\d+\s+\d+bpm$", part)), None)


def chord_proposal(y: np.ndarray, sample_rate: int) -> dict | None:
    if y.size < 2048 or float(np.max(np.abs(y))) < 1e-5:
        return None
    harmonic = librosa.effects.harmonic(y, margin=3.0)
    chroma = librosa.feature.chroma_stft(y=harmonic, sr=sample_rate, n_fft=4096, hop_length=2048)
    profile = np.mean(chroma, axis=1)
    total = float(np.sum(profile))
    if total <= 0:
        return None
    profile /= total
    scored: list[tuple[float, int, str]] = []
    for root in range(12):
        for quality, intervals in (("maj", (0, 4, 7)), ("min", (0, 3, 7))):
            chord = np.zeros(12)
            chord[[(root + interval) % 12 for interval in intervals]] = 1
            chord /= np.sum(chord)
            score = float(np.dot(profile, chord))
            scored.append((score, root, quality))
    scored.sort(reverse=True)
    best, second = scored[0], scored[1]
    return {
        "label": f"{NOTE_NAMES[best[1]]}{best[2]}",
        "score": round(best[0], 4),
        "margin": round(best[0] - second[0], 4),
        "topPitchClasses": [NOTE_NAMES[index] for index in np.argsort(profile)[-4:][::-1]],
    }


def analyse(path: Path, root: Path) -> dict:
    info = sf.info(path)
    audio, sample_rate = sf.read(path, dtype="float32", always_2d=True)
    mono = np.mean(audio, axis=1)
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    rms = float(np.sqrt(np.mean(np.square(audio, dtype=np.float64)))) if audio.size else 0.0
    duration = info.frames / info.samplerate
    pack = pack_for(path)
    role = role_for(path)
    bpm = declared_bpm(path)
    bars = duration * bpm / 240 if bpm else None
    onset_audio = librosa.resample(mono, orig_sr=sample_rate, target_sr=22050) if sample_rate != 22050 else mono
    onset_frames = librosa.onset.onset_detect(y=onset_audio, sr=22050, backtrack=False)
    transient_rate = len(onset_frames) / duration if duration > 0 else 0
    correlation = None
    if audio.shape[1] == 2 and audio.shape[0] > 1:
        left_std = float(np.std(audio[:, 0]))
        right_std = float(np.std(audio[:, 1]))
        if left_std > 1e-8 and right_std > 1e-8:
            correlation = round(float(np.corrcoef(audio[:, 0], audio[:, 1])[0, 1]), 4)
    proposal = chord_proposal(onset_audio, 22050) if role in TONAL_ROLES else None
    variant_match = re.search(r"-(\d+)\.wav$", path.name, re.IGNORECASE)
    return {
        "path": path.relative_to(root).as_posix(),
        "sha256": sha256(path),
        "pack": pack,
        "kit": kit_for(path),
        "instrument": instrument_for(path, pack),
        "role": role,
        "declaredBpm": bpm,
        "declaredKey": declared_key(path, bpm),
        "variant": int(variant_match.group(1)) if variant_match else None,
        "sampleRate": info.samplerate,
        "channels": info.channels,
        "subtype": info.subtype,
        "durationSeconds": round(duration, 6),
        "estimatedBars": round(bars, 4) if bars is not None else None,
        "rmsDbfs": db(rms),
        "samplePeakDbfs": db(peak),
        "crestDb": round(20 * math.log10(peak / rms), 3) if peak > 0 and rms > 0 else None,
        "transientsPerSecond": round(transient_rate, 3),
        "stereoCorrelation": correlation,
        "chordProposal": proposal,
    }


def summarise(files: list[dict]) -> dict:
    packs: dict[str, dict] = {}
    for pack, entries in _group(files, "pack").items():
        bpms = sorted({entry["declaredBpm"] for entry in entries if entry["declaredBpm"]})
        packs[pack] = {
            "files": len(entries),
            "bpms": bpms,
            "roles": dict(sorted(Counter(entry["role"] for entry in entries).items())),
            "instruments": dict(sorted(Counter(entry["instrument"] for entry in entries).items())),
            "durationSeconds": round(sum(entry["durationSeconds"] for entry in entries), 3),
            "rmsDbfsRange": _range(entries, "rmsDbfs"),
            "samplePeakDbfsRange": _range(entries, "samplePeakDbfs"),
        }
    kits: dict[str, dict] = {}
    for kit, entries in _group([entry for entry in files if entry["kit"]], "kit").items():
        kits[kit] = {
            "files": len(entries),
            "bpm": next(entry["declaredBpm"] for entry in entries if entry["declaredBpm"]),
            "keys": sorted({entry["declaredKey"] for entry in entries if entry["declaredKey"]}),
            "instruments": sorted({entry["instrument"] for entry in entries}),
            "roles": sorted({entry["role"] for entry in entries}),
            "barCounts": dict(sorted(Counter(str(entry["estimatedBars"]) for entry in entries if entry["estimatedBars"]).items())),
        }
    return {"packs": packs, "kits": kits}


def _group(entries: list[dict], key: str) -> dict[str, list[dict]]:
    groups: defaultdict[str, list[dict]] = defaultdict(list)
    for entry in entries:
        groups[entry[key]].append(entry)
    return dict(sorted(groups.items()))


def _range(entries: list[dict], key: str) -> list[float] | None:
    values = [entry[key] for entry in entries if entry[key] is not None]
    return [min(values), max(values)] if values else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    arguments = parser.parse_args()
    root = arguments.source.resolve()
    paths = sorted(path for path in root.rglob("*.wav") if path.is_file())
    if not paths:
        raise SystemExit("no WAV files found")
    files = []
    for index, path in enumerate(paths, start=1):
        files.append(analyse(path, root))
        if index % 50 == 0 or index == len(paths):
            print(f"analysed={index}/{len(paths)}", flush=True)
    report = {
        "format": "sedicivalvole.eighties-source-audit.v1",
        "sourceRoot": root.name,
        "rawFilesCommitted": False,
        "files": files,
    }
    report["summary"] = summarise(files)
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"output={arguments.output}")


if __name__ == "__main__":
    main()
