#!/usr/bin/env python3
"""Summarize local diagnostic JSON/gzip without exporting private payload fields.

Reports are independent snapshots. Never add their cumulative counters or infer
session identity from a matching build; automatic/manual reports may overlap.
"""
import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path
import statistics
import sys
import zlib

LIMIT = 32 * 1024 * 1024
DURATIONS = ('observedMs', 'unobservedMs', 'connectedMs', 'freshMs',
             'confirmedMs', 'roadEligibleMs', 'httpsMs', 'directMs')
COUNTS = ('forwardSamples', 'slowingSamples', 'turnSamples')
CONSUMERS = ('engine-demand', 'flux-braking', 'aperture-curve')


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0


def percent(value, total):
    return round(100 * value / total, 2) if number(value) and number(total) and total > 0 and value <= total else None


def analyze(payload):
    report = payload.get('report', payload)
    if not isinstance(report, dict) or not isinstance(report.get('phoneMotion'), dict):
        raise ValueError('Missing phoneMotion object')
    motion = report['phoneMotion']
    rows = motion.get('history', [])
    rows = [row for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []
    connected = [row for row in rows if row.get('state') == 'connected']
    measured = [row for row in connected if isinstance(row.get('dataFresh'), bool)]
    mount = [row for row in connected if isinstance(row.get('mountSelected'), bool)]
    rtts = [row['rttMs'] for row in connected if number(row.get('rttMs'))]
    transports = {name: sum(row.get('transport') == name for row in rows) for name in ('https', 'direct')}
    coverage = motion.get('coverage')
    coverage = coverage if isinstance(coverage, dict) else {}
    totals = {key: coverage[key] for key in DURATIONS + COUNTS if number(coverage.get(key))}
    usage = coverage.get('consumerInputMs', {})
    usage = usage if isinstance(usage, dict) else {}
    consumers = {key: usage[key] for key in CONSUMERS if number(usage.get(key))}
    reasons = []
    if mount and not any(row['mountSelected'] for row in mount):
        reasons.append('Aligned car motion was off in every observed mounting state; calibrate after enabling it while parked.')
    if rtts and statistics.median(rtts) > 250:
        reasons.append('Median sampled round trip exceeds the 250 ms sample lifetime; pairing alone does not establish usable input.')
    if transports['https'] and not transports['direct']:
        reasons.append('Only HTTPS appears in retained transport observations; no direct path was observed.')
    if not totals:
        reasons.append('Whole-session coverage is unavailable; snapshot frequency is not a time percentage.')
    return {
        'retainedSnapshots': len(rows), 'connectedSnapshots': len(connected),
        'freshnessKnownSnapshots': len(measured),
        'freshSnapshots': sum(row['dataFresh'] for row in measured),
        'freshSnapshotPercent': percent(sum(row['dataFresh'] for row in measured), len(measured)),
        'mountKnownSnapshots': len(mount),
        'mountEnabledSnapshots': sum(row['mountSelected'] for row in mount),
        'sampledMedianRoundTripMs': statistics.median(rtts) if rtts else None,
        'transportSnapshots': transports,
        'wholeSessionCoverage': totals or None,
        'freshObservedTimePercent': percent(totals.get('freshMs'), totals.get('observedMs')),
        'confirmedConnectedTimePercent': percent(totals.get('confirmedMs'), totals.get('connectedMs')),
        'consumerRequestedInputMs': consumers or None,
        'findings': reasons,
        'limits': ['Reports are independent and are never summed; cumulative snapshots may overlap.',
                   'Unknown fields remain unavailable, not zero. Retained snapshots do not represent the full drive.',
                   'Consumer requests do not prove audible output or physical response.'],
    }


def read_report(path):
    # Bound compressed input and decompression independently; no network or writes.
    with Path(path).open('rb') as stream:
        raw = stream.read(LIMIT + 1)
    if len(raw) > LIMIT:
        raise ValueError('Input exceeds size limit')
    if raw.startswith(b'\x1f\x8b'):
        import io
        with gzip.GzipFile(fileobj=io.BytesIO(raw)) as stream:
            decoded = stream.read(LIMIT + 1)
    else:
        decoded = raw
    if len(decoded) > LIMIT:
        raise ValueError('Decoded input exceeds size limit')
    result = analyze(json.loads(decoded))
    result['decodedSha256'] = hashlib.sha256(decoded).hexdigest()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('reports', nargs='+', help='Local JSON or gzip diagnostic files')
    args = parser.parse_args()
    try:
        results = [read_report(path) for path in args.reports]
    except (OSError, ValueError, TypeError, AttributeError, EOFError, zlib.error):
        # Do not echo paths, JSON content or platform exception text.
        print('Cannot analyze input: invalid, missing or oversized diagnostic report.', file=sys.stderr)
        return 1
    print(json.dumps({'schema': 'phone-benchmark.v1', 'reports': results}, indent=2, allow_nan=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
