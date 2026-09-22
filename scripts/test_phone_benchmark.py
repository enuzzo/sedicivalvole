import gzip
import importlib.util
import json
from pathlib import Path
import tempfile
import subprocess
import sys
import unittest

spec = importlib.util.spec_from_file_location('benchmark', Path(__file__).with_name('analyze_phone_benchmark.py'))
benchmark = importlib.util.module_from_spec(spec)
spec.loader.exec_module(benchmark)


class BenchmarkTests(unittest.TestCase):
    def test_missing_values_are_not_zero_or_a_disabled_mount(self):
        result = benchmark.analyze({'phoneMotion': {'history': [{'state': 'connected'}]}})
        self.assertIsNone(result['freshSnapshotPercent'])
        self.assertIsNone(result['freshObservedTimePercent'])
        self.assertEqual(result['mountKnownSnapshots'], 0)
        self.assertFalse(any('off in every' in finding for finding in result['findings']))

    def test_snapshot_ratio_is_separate_from_time(self):
        rows = [{'state': 'connected', 'dataFresh': fresh, 'mountSelected': False,
                 'transport': 'https', 'rttMs': rtt} for fresh, rtt in [(True, 260), (False, 280)]]
        result = benchmark.analyze({'phoneMotion': {'history': rows}})
        self.assertEqual(result['freshSnapshotPercent'], 50)
        self.assertIsNone(result['freshObservedTimePercent'])
        self.assertEqual(result['sampledMedianRoundTripMs'], 270)
        self.assertEqual(len(result['findings']), 4)

    def test_whole_session_coverage_does_not_use_history_denominator(self):
        result = benchmark.analyze({'phoneMotion': {'coverage': {
            'observedMs': 1000, 'freshMs': 250, 'connectedMs': 500, 'confirmedMs': 200,
            'consumerInputMs': {'engine-demand': 100, 'secret': 'private'}, 'slowingSamples': 3}}})
        self.assertEqual(result['freshObservedTimePercent'], 25)
        self.assertEqual(result['confirmedConnectedTimePercent'], 40)
        self.assertEqual(result['consumerRequestedInputMs'], {'engine-demand': 100})
        self.assertEqual(result['wholeSessionCoverage']['slowingSamples'], 3)

    def test_allowlist_never_exports_payload_metadata_or_private_values(self):
        result = benchmark.analyze({'report': {'pageUrl': 'private', 'phoneMotion': {
            'latest': {'token': 'private'}, 'coverage': {'observedMs': True, 'freshMs': float('nan')},
            'history': [{'state': 'private', 'transport': 'private', 'rttMs': float('inf')} ]}}})
        self.assertNotIn('private', json.dumps(result))
        self.assertIsNone(result['wholeSessionCoverage'])
        self.assertIsNone(result['sampledMedianRoundTripMs'])

    def test_invalid_ratios_are_unavailable(self):
        for a,b in [(2,1), (0,0), (-1,2), (True,2), (None,2)]:
            self.assertIsNone(benchmark.percent(a,b))

    def test_gzip_and_plain_are_equivalent_with_decoded_hash(self):
        with tempfile.TemporaryDirectory() as folder:
            raw = json.dumps({'phoneMotion': {}}).encode()
            plain = Path(folder)/'plain.json'; compressed = Path(folder)/'packet.gz'
            plain.write_bytes(raw); compressed.write_bytes(gzip.compress(raw))
            self.assertEqual(benchmark.read_report(plain), benchmark.read_report(compressed))

    def test_bounded_decompression(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'packet.gz'; path.write_bytes(gzip.compress(b' '*100))
            previous=benchmark.LIMIT
            try:
                benchmark.LIMIT=50
                with self.assertRaises(ValueError): benchmark.read_report(path)
            finally: benchmark.LIMIT=previous

    def test_malformed_history_and_missing_motion(self):
        self.assertEqual(benchmark.analyze({'phoneMotion': {'history': None}})['retainedSnapshots'],0)
        with self.assertRaises(ValueError): benchmark.analyze({})

    def test_extreme_numbers_do_not_overflow_json_or_ratios(self):
        self.assertFalse(benchmark.number(10**400))
        self.assertEqual(benchmark.percent(1e308, 1e308), 100)
        result = benchmark.analyze({'phoneMotion': {'history': [
            {'state': 'connected', 'rttMs': 1e308},
            {'state': 'connected', 'rttMs': 1e308}]}})
        self.assertEqual(result['sampledMedianRoundTripMs'], 1e308)
        json.dumps(result, allow_nan=False)

    def test_cli_rejects_deep_or_corrupt_input_without_private_traceback(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'private-report.json'
            for data in [b'['*2000+b'0'+b']'*2000, b'\x1f\x8b'+b'broken-private-payload']:
                path.write_bytes(data)
                result = subprocess.run([sys.executable, str(Path(benchmark.__file__)), str(path)], capture_output=True, text=True)
                self.assertEqual(result.returncode, 1)
                self.assertEqual(result.stdout, '')
                self.assertEqual(result.stderr, 'Cannot analyze input: invalid, missing or oversized diagnostic report.\n')


if __name__ == '__main__':
    unittest.main()
