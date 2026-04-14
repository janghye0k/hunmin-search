import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pkgPath = join(root, 'package.json');

type PackageJson = {
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe('release & publish manifest (plan-npm-manual-publish)', () => {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;

  it('uses public npm package name hunmin-search', () => {
    expect(pkg.name).toBe('hunmin-search');
    expect(pkg.private).toBe(false);
  });

  it('declares publish and release scripts', () => {
    const s = pkg.scripts ?? {};
    expect(s['publish:check']).toBeTruthy();
    expect(s['publish:dry-run']).toBeTruthy();
    expect(s['prepublishOnly']).toBeTruthy();
    expect(s['prepublish:safe']).toBeTruthy();
    expect(s['release']).toBeTruthy();
    expect(s['release:minor']).toBeTruthy();
    expect(s['release:major']).toBeTruthy();
  });

  it('wires prepublishOnly to prepublish:safe (avoids nested pack/attw recursion)', () => {
    const s = pkg.scripts ?? {};
    expect(s['prepublishOnly']).toMatch(/prepublish:safe/);
  });

  it('depends on commit-and-tag-version for Conventional Commits releases', () => {
    expect(pkg.devDependencies?.['commit-and-tag-version']).toBeTruthy();
  });
});
