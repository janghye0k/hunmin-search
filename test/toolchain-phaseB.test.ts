import { createRequire } from 'node:module';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
const tsconfigPath = join(root, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
  compilerOptions: {
    module?: string;
    moduleResolution?: string;
    noEmit?: boolean;
  };
};

/** Relative import paths must not use a `.js` extension (Bundler + tsup). */
const relativeJsImport = /from\s+['"](\.\.?\/[^'"]+)\.js['"]/g;

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...listSourceFiles(p));
    else if (extname(name.name) === '.ts') out.push(p);
  }
  return out;
}

describe('Phase B — Bundler tsconfig + extensionless src + dist Node smoke', () => {
  it('tsup targets Node 18 for ESM/CJS and browser for IIFE', () => {
    const raw = readFileSync(join(root, 'tsup.config.ts'), 'utf8');
    expect(raw).toContain('node18');
    expect(raw).toContain("'browser'");
    expect(raw).toContain("'node'");
  });

  it('declares typecheck script', () => {
    expect(pkg.scripts?.typecheck).toBe('tsc --noEmit');
  });

  it('uses Bundler resolution and noEmit for editor / tsc --noEmit', () => {
    expect(tsconfig.compilerOptions.moduleResolution).toBe('Bundler');
    expect(['ESNext', 'Preserve']).toContain(tsconfig.compilerOptions.module);
    expect(tsconfig.compilerOptions.noEmit).toBe(true);
  });

  it('uses no .js extension on relative imports under src', () => {
    const srcRoot = join(root, 'src');
    const hits: { file: string; match: string }[] = [];
    for (const file of listSourceFiles(srcRoot)) {
      const body = readFileSync(file, 'utf8');
      for (const m of body.matchAll(relativeJsImport)) hits.push({ file, match: m[0] });
    }
    expect(hits, `Found .js relative imports:\n${hits.map((h) => `${h.file}: ${h.match}`).join('\n')}`).toEqual(
      []
    );
  });

  it('loads built ESM entry from dist (run pnpm run build first)', async () => {
    const entry = join(root, 'dist', 'index.js');
    expect(existsSync(entry)).toBe(true);
    const mod = await import(pathToFileURL(entry).href);
    expect(typeof mod.searchRanked).toBe('function');
    expect(typeof mod.matchSubsequenceKo).toBe('function');
  });

  it('loads built CJS entry from dist via createRequire', () => {
    const entry = join(root, 'dist', 'index.cjs');
    expect(existsSync(entry)).toBe(true);
    const require = createRequire(import.meta.url);
    const mod = require(entry) as { searchRanked?: unknown };
    expect(typeof mod.searchRanked).toBe('function');
  });
});
