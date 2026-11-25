import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
};

describe('package.json exports["./browser"]', () => {
  it('maps import to the browser ESM bundle and require to the CJS build, with types resolved from sibling declarations', () => {
    expect(pkg.exports['./browser']).toEqual({ import: './dist/browser.mjs', require: './dist/index.cjs' });
  });

  it('does not expose the IIFE through exports (it is for <script src> only)', () => {
    expect(JSON.stringify(pkg.exports)).not.toContain('index.iife.js');
  });
});

describe('dist outputs (requires `pnpm run build`)', () => {
  it.each(['index.mjs', 'index.cjs', 'browser.mjs', 'index.iife.js', 'index.d.mts', 'index.d.cts', 'browser.d.mts'])(
    'contains %s',
    (file) => {
      expect(existsSync(join(root, 'dist', file)), `dist/${file} missing — run pnpm run build`).toBe(true);
    }
  );

  it('browser ESM bundle exports createSearcher', () => {
    const body = readFileSync(join(root, 'dist', 'browser.mjs'), 'utf8');
    expect(body).toMatch(/export\s*\{[^}]*createSearcher/);
  });
});
