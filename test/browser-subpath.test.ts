import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
};

describe('package.json exports["./browser"]', () => {
  it('maps import to the browser ESM bundle and require to the CJS build, each with matching types', () => {
    expect(pkg.exports['./browser']).toEqual({
      import: { types: './dist/index.d.ts', default: './dist/index.browser.js' },
      require: { types: './dist/index.d.cts', default: './dist/index.cjs' },
    });
  });

  it('does not expose the IIFE through exports (it is for <script src> only)', () => {
    expect(JSON.stringify(pkg.exports)).not.toContain('index.global.cjs');
  });
});

describe('dist outputs (requires `pnpm run build`)', () => {
  it.each(['index.js', 'index.cjs', 'index.browser.js', 'index.global.cjs', 'index.d.ts', 'index.d.cts'])(
    'contains %s',
    (file) => {
      expect(existsSync(join(root, 'dist', file)), `dist/${file} missing — run pnpm run build`).toBe(true);
    },
  );

  it('browser ESM bundle exports the public search functions', () => {
    const body = readFileSync(join(root, 'dist', 'index.browser.js'), 'utf8');
    expect(body).toMatch(/export\s*\{[^}]*searchKoRanked/);
  });
});
