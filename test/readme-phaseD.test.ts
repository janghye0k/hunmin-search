import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'README.md');
const licensePath = join(root, 'LICENSE');

describe('Phase D — README and license contract', () => {
  it('ships LICENSE at repo root', () => {
    expect(existsSync(licensePath)).toBe(true);
  });

  it('documents Node ESM and CJS consumption with hangul-search entry', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/from\s+['"]hangul-search['"]/);
    expect(body).toMatch(/require\s*\(\s*['"]hangul-search['"]\s*\)/);
  });

  it('documents browser IIFE path, bundle file name, and globalName hangulSearch', () => {
    const body = readFileSync(readmePath, 'utf8');
    expect(body).toMatch(/index\.global\.cjs/);
    expect(body).toMatch(/hangulSearch/);
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
