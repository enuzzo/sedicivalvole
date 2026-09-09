import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { validManifest } from '../src/session/cache-policy.js';
const root = new URL('../dist/client/', import.meta.url);
const files = readdirSync(new URL('assets/', root)).filter(name => /^release-.*\.json$/.test(name));
assert.equal(files.length, 1, 'exactly one release manifest');
const value = JSON.parse(readFileSync(new URL('assets/' + files[0], root)));
assert(validManifest(value), 'bounded public static inventory');
assert.equal(value.version, readFileSync(new URL('../../../VERSION', import.meta.url), 'utf8').trim());
assert(readFileSync(new URL('index.html', root), 'utf8').includes(`name="sedicivalvole-release" content="${value.key}"`));
for (const asset of value.assets) {
  const bytes = readFileSync(new URL(asset.path.slice(1), root));
  assert.equal(bytes.length, asset.bytes, asset.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path);
}
assert(readFileSync(new URL('session-cache.js', root), 'utf8').includes('BIND_ASSET_CACHE'));
console.log(`PASS release ${value.key}: ${value.assets.length} exact static hashes; VERSION and HTML identity match`);
