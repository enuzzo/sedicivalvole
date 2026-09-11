"""Derive compact FPDF fonts from the already admitted Space Grotesk (FontTools 4.60.1)."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import zlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'prototype/drive-lab/public/fonts/space-grotesk-variable.ttf'
OUT = ROOT / 'prototype/drive-lab/public/report-support/fonts'
OUT.mkdir(exist_ok=True)
encoding = {i: ord(bytes([i]).decode('cp1252')) for i in range(256) if i not in [129, 141, 143, 144, 157]}
inventory = {'source': '../../fonts/space-grotesk-variable.ttf', 'sourceSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
             'generator': 'scripts/build_report_fonts.py; FontTools 4.60.1', 'license': 'SIL Open Font License 1.1', 'files': []}
license_data = (SOURCE.parent / 'OFL-Space-Grotesk.txt').read_bytes()
(OUT / 'OFL-Space-Grotesk.txt').write_bytes(license_data)
inventory['files'].append({'path': 'OFL-Space-Grotesk.txt', 'bytes': len(license_data), 'sha256': hashlib.sha256(license_data).hexdigest()})
for weight, style in [(400, 'regular'), (600, 'semibold')]:
    font = TTFont(SOURCE, recalcTimestamp=False)
    instantiateVariableFont(font, {'wght': weight}, inplace=True)
    font.recalcTimestamp = False
    options = subset.Options()
    options.recalc_timestamp = False
    worker = subset.Subsetter(options=options)
    worker.populate(unicodes=set(encoding.values()))
    worker.subset(font)
    units = font['head'].unitsPerEm
    metric = lambda value: round(value * 1000 / units)
    cmap = font.getBestCmap()
    widths = [metric(font['hmtx'].metrics.get(cmap.get(encoding.get(i)), font['hmtx'].metrics['.notdef'])[0]) for i in range(256)]
    name = f'SpaceGroteskReport-{style.title()}'
    for record in font['name'].names:
        if record.nameID in [1, 3, 4, 6]: record.string = name.encode(record.getEncoding())
    output = BytesIO(); font.save(output); raw = output.getvalue()
    filename = f'space-grotesk-{style}'
    payload = {'type': 'TrueType', 'name': name, 'up': metric(font['post'].underlinePosition), 'ut': metric(font['post'].underlineThickness),
        'cw': widths, 'enc': 'cp1252', 'uv': encoding, 'file': filename + '.z', 'originalsize': len(raw), 'subsetted': True,
        'desc': {'Ascent': metric(font['hhea'].ascent), 'Descent': metric(font['hhea'].descent),
            'CapHeight': metric(font['OS/2'].sCapHeight), 'Flags': 32, 'FontBBox': '[%s]' % ' '.join(str(metric(getattr(font['head'], key))) for key in ['xMin', 'yMin', 'xMax', 'yMax']),
            'ItalicAngle': 0, 'StemV': 80 if weight == 400 else 120, 'MissingWidth': widths[0]}}
    for suffix, data in [('.json', (json.dumps(payload, separators=(',', ':')) + '\n').encode()), ('.z', zlib.compress(raw, 9))]:
        path = OUT / (filename + suffix); path.write_bytes(data)
        inventory['files'].append({'path': path.name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
(OUT / 'source-inventory.json').write_text(json.dumps(inventory, indent=2) + '\n')
print('Prepared two embedded Space Grotesk weights from existing admitted font.')
