import { readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const tsconfigPath = join(root, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
  compilerOptions: {
    module?: string;
    moduleResolution?: string;
    noEmit?: boolean;
  };
};
const readmePath = join(root, 'README.md');

/** Relative import paths must not use a `.js` extension (Bundler + tsdown). */
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

describe('Bundler and src layout', () => {
  it('tsdown config declares the IIFE and ES2022 browser builds', () => {
    const raw = readFileSync(join(root, 'tsdown.config.ts'), 'utf8');
    for (const s of ["'iife'", "'es2022'", "'HunminSearch'"]) expect(raw).toContain(s);
  });

  it('pins TypeScript 6 (7 is excluded; typescript-eslint supports <6.1.0)', () => {
    expect(pkg.devDependencies?.typescript).toBe('~6.0.3');
  });

  it('declares typecheck script', () => {
    expect(pkg.scripts?.typecheck).toBe(
      'tsc --noEmit && tsc --ignoreConfig --noEmit --strict --skipLibCheck --module esnext --moduleResolution bundler --target es2022 --types node test/search.test.ts'
    );
  });

  it('excludes the integrated pack gate from prepublish:safe', () => {
    expect(pkg.scripts?.['prepublish:safe']).toContain('--exclude test/package-gates.test.ts');
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
});

describe('package scripts and Playwright', () => {
  it('runs publint and attw inside the build instead of separate scripts', () => {
    expect(pkg.scripts?.build).toBe('tsdown');
    expect(pkg.scripts?.publint).toBeUndefined();
    expect(pkg.scripts?.attw).toBeUndefined();
    const raw = readFileSync(join(root, 'tsdown.config.ts'), 'utf8');
    expect(raw).toContain('publint: true');
    expect(raw).toContain("profile: 'node16'");
    expect(pkg.scripts?.['test:browser']).toMatch(/playwright/);
  });

  it('declares Playwright config at repo root', () => {
    const cfg = join(root, 'playwright.config.ts');
    expect(() => readFileSync(cfg, 'utf8')).not.toThrow();
  });
});

describe('README contract', () => {
  it('documents Node ESM and CJS consumption with hunmin-search entry', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/from\s+['"]hunmin-search['"]/);
    expect(body).toMatch(/require\s*\(\s*['"]hunmin-search['"]\s*\)/);
  });

  it('documents browser IIFE path, bundle file name, and globalName HunminSearch', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/index\.iife\.js/);
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
