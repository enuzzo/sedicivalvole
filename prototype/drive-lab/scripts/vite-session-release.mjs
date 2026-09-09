import { createHash } from 'node:crypto';
import { buildSync } from 'esbuild';
import { staticPath } from '../src/session/cache-policy.js';

export function sessionRelease({ build, commit, version }) {
  const key = `${build}.${commit}`;
  return {
    name: 'sedicivalvole-session-release', apply: 'build',
    transformIndexHtml(html) {
      return html.replace('</head>', `<meta name="sedicivalvole-release" content="${key}" />\n<meta name="sedicivalvole-version" content="${version}" />\n</head>`);
    },
    generateBundle: { order: "post", handler(_options, bundle) {
      const assets = Object.values(bundle).filter(item => staticPath('/' + item.fileName)).map(item => {
        const bytes = Buffer.from(item.type === 'chunk' ? item.code : item.source);
        return { path: '/' + item.fileName, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
      });
      this.emitFile({ type: 'asset', fileName: `assets/release-${key}.json`, source: JSON.stringify({ schema: 1, key, version, assets }) });
      const worker = buildSync({ entryPoints: [new URL('../src/session/cache-worker.js', import.meta.url).pathname], bundle: true, write: false, format: 'iife', target: 'es2021' });
      this.emitFile({ type: 'asset', fileName: 'session-cache.js', source: worker.outputFiles[0].text });
    } },
  };
}
