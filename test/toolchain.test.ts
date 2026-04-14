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
const ciPath = join(root, '.github', 'workflows', 'ci.yml');
const readmePath = join(root, 'README.md');
const licensePath = join(root, 'LICENSE');

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

describe('Bundler, src layout, and dist smoke', () => {
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
    expect(hits, `Found .js relative imports:\n${hits.map((h) => `${h.file}: ${h.match}`).join('\n')}`).toEqual([]);
  });

  it('loads built ESM entry from dist (run pnpm run build first)', async () => {
    const entry = join(root, 'dist', 'index.js');
    expect(existsSync(entry)).toBe(true);
    const mod = await import(pathToFileURL(entry).href);
    expect(typeof mod.searchKoRanked).toBe('function');
    expect(typeof mod.matchSubsequenceKo).toBe('function');
  });

  it('loads built CJS entry from dist via createRequire', () => {
    const entry = join(root, 'dist', 'index.cjs');
    expect(existsSync(entry)).toBe(true);
    const require = createRequire(import.meta.url);
    const mod = require(entry) as { searchKoRanked?: unknown };
    expect(typeof mod.searchKoRanked).toBe('function');
  });
});

describe('package scripts, CI workflow, and Playwright', () => {
  it('declares publint, attw, and Playwright browser smoke scripts', () => {
    expect(pkg.scripts?.publint).toBeDefined();
    expect(pkg.scripts?.publint).toMatch(/publint/);
    expect(pkg.scripts?.attw).toBeDefined();
    expect(pkg.scripts?.attw).toMatch(/attw/);
    expect(pkg.scripts?.attw).toMatch(/--profile node16/);
    expect(pkg.scripts?.['test:browser']).toBeDefined();
    expect(pkg.scripts?.['test:browser']).toMatch(/playwright/);
  });

  it('defines GitHub Actions CI with typecheck, build, test, publint, attw, and Playwright', () => {
    const yml = readFileSync(ciPath, 'utf8');
    expect(yml).toMatch(/pnpm run typecheck/);
    expect(yml).toContain('pnpm run build');
    expect(yml).toMatch(/^\s+run:\s+pnpm test\s*$/m);
    expect(yml).toMatch(/publint/);
    expect(yml).toMatch(/attw/);
    expect(yml).toMatch(/playwright/i);
  });

  it('orders typecheck before build and build before vitest in CI workflow', () => {
    const yml = readFileSync(ciPath, 'utf8');
    const iType = yml.indexOf('typecheck');
    const iBuild = yml.indexOf('pnpm run build');
    const iTest = yml.search(/^\s+run:\s+pnpm test\s*$/m);
    expect(iType).toBeGreaterThanOrEqual(0);
    expect(iBuild).toBeGreaterThanOrEqual(0);
    expect(iTest).toBeGreaterThanOrEqual(0);
    expect(iType).toBeLessThan(iBuild);
    expect(iBuild).toBeLessThan(iTest);
  });

  it('declares Playwright config at repo root', () => {
    const cfg = join(root, 'playwright.config.ts');
    expect(() => readFileSync(cfg, 'utf8')).not.toThrow();
  });
});

describe('README and LICENSE contract', () => {
  it('ships LICENSE at repo root', () => {
    expect(existsSync(licensePath)).toBe(true);
  });

  it('documents Node ESM and CJS consumption with hunmin-search entry', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/from\s+['"]hunmin-search['"]/);
    expect(body).toMatch(/require\s*\(\s*['"]hunmin-search['"]\s*\)/);
  });

  it('documents browser IIFE path, bundle file name, and globalName HunminSearch', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/index\.global\.cjs/);
    expect(body).toMatch(/HunminSearch/);
    expect(body).toMatch(/<script/i);
  });

  it('documents current TypeScript toolchain (Bundler), not obsolete NodeNext+.js import story', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/Bundler/i);
    expect(body).not.toMatch(/moduleResolution.*NodeNext/i);
    expect(body).not.toMatch(/상대 import.*\.js 확장자/i);
  });

  it('warns about dual-package hazard (single module system per app)', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/dual package|듀얼 패키지|한\s*가지\s*모듈/i);
  });

  it('mentions local test order: build before tests that need dist', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/build.*test|테스트.*빌드|dist/i);
  });
});
