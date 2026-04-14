import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pkgPath = join(root, 'package.json');

function listTarEntries(tgzPath: string): string[] {
  const out = execSync(`tar -tzf "${tgzPath}"`, { encoding: 'utf8' });
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

describe('npm pack contents (Phase 5)', () => {
  it('keeps package.json `files` whitelist unchanged', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { files?: string[] };
    expect(pkg.files).toEqual(['dist', 'README.md', 'LICENSE']);
  });

  it('packs dist, README.md, LICENSE, package.json only (no docs/ or extra English readme)', () => {
    const dest = mkdtempSync(join(tmpdir(), 'hangul-search-pack-'));
    try {
      execSync(`pnpm pack --pack-destination "${dest}"`, {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
      });

      const tgz = readdirSync(dest).find((n) => n.endsWith('.tgz'));
      expect(tgz, 'expected a .tgz in pack destination').toBeTruthy();

      const entries = listTarEntries(join(dest, tgz!)).map((e) => e.replace(/^package\//, ''));

      expect(entries.some((e) => e.startsWith('dist/'))).toBe(true);
      expect(entries).toContain('README.md');
      expect(entries).toContain('LICENSE');
      expect(entries).toContain('package.json');

      expect(entries.some((e) => e === 'README.en.md' || e.startsWith('README.en.md'))).toBe(false);
      expect(entries.some((e) => e === 'English-README.md' || e.startsWith('English-README.md'))).toBe(false);
      expect(entries.some((e) => e.startsWith('docs/'))).toBe(false);
    } finally {
      rmSync(dest, { recursive: true, force: true });
    }
  }, 120_000);
});
