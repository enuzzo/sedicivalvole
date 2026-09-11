#!/usr/bin/env python3
"""Package the owner-supplied icon without redrawing, cropping or changing its proportions."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'logo/pistons-v1/source.png'
OUT = ROOT / 'prototype/drive-lab/public/brand/pistons-v1'
OUT.mkdir(parents=True, exist_ok=True)
source = Image.open(SOURCE).convert('RGBA')
assert source.width == source.height
opaque = Image.new('RGBA', source.size, '#000000')
opaque.alpha_composite(source)
opaque = opaque.convert('RGB')
files = []
for size in (16, 32, 48, 256, 512):
    path = OUT / f'mark-{size}.png'
    source.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)
    files.append(path)
for size in (16, 32, 48, 180, 192, 256, 512):
    path = OUT / f'icon-{size}.png'
    opaque.resize((size, size), Image.Resampling.LANCZOS).save(path, optimize=True)
    files.append(path)
icon = OUT / 'favicon-transparent.ico'
source.resize((256, 256), Image.Resampling.LANCZOS).save(icon, sizes=[(16,16),(32,32),(48,48)])
files.append(icon)
report = ROOT / 'prototype/drive-lab/public/report-support/report-mark-pistons-transparent.png'
report.write_bytes((OUT / 'mark-256.png').read_bytes())
files.append(report)
inventory = {'source': 'logo/pistons-v1/source.png', 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'operation': 'Owner-supplied artwork, unchanged geometry and alpha; Lanczos resizing. Opaque black composites are separate Home icons.',
    'files': [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
(ROOT / 'logo/pistons-v1/inventory.json').write_text(json.dumps(inventory, indent=2)+'\n')
print('Packaged', len(files), 'icon derivatives from', source.size)
