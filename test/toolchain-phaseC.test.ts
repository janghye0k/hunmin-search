import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
const ciPath = join(root, '.github', 'workflows', 'ci.yml');

describe('Phase C — CI, publint, attw, browser smoke entrypoints', () => {
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
