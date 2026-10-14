import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const pkgPath = join(root, 'package.json');
const nodeBin = process.env.HUNMIN_CONSUMER_NODE ?? process.execPath;
const tsupBin = join(root, 'node_modules', 'tsup', 'dist', 'cli-default.js');
const tscBin = join(root, 'node_modules', 'typescript', 'lib', 'tsc.js');

function listTarEntries(tgzPath: string): string[] {
  const out = execFileSync('tar', ['-tzf', basename(tgzPath)], {
    cwd: dirname(tgzPath),
    encoding: 'utf8',
  });
  return out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function runNode(cwd: string, args: string[]): string {
  return execFileSync(nodeBin, args, { cwd, encoding: 'utf8' }).trim();
}

// One pack for every check in this file. `--ignore-scripts` skips `prepack` (which rebuilds and cleans `dist`),
// so packing never races with other tests that read `dist`. Run `pnpm run build` first.
let dest = '';
let tgzPath = '';

beforeAll(() => {
  dest = mkdtempSync(join(tmpdir(), 'hunmin-search-pack-'));
  execSync(`npm pack --ignore-scripts --pack-destination "${dest}"`, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  const tgz = readdirSync(dest).find((n) => n.endsWith('.tgz'));
  expect(tgz, 'expected a .tgz in pack destination').toBeTruthy();
  tgzPath = join(dest, tgz!);
}, 120_000);

afterAll(() => {
  if (dest) rmSync(dest, { recursive: true, force: true });
});

describe('npm pack contents (Phase 5)', () => {
  it('keeps package.json `files` whitelist unchanged', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { files?: string[] };
    expect(pkg.files).toEqual(['dist', 'README.md', 'LICENSE']);
  });

  it('packs dist, README.md, LICENSE, package.json only (no docs/ or extra English readme)', () => {
    const entries = listTarEntries(tgzPath).map((e) => e.replace(/^package\//, ''));

    expect(entries.some((e) => e.startsWith('dist/'))).toBe(true);
    expect(entries).toContain('README.md');
    expect(entries).toContain('LICENSE');
    expect(entries).toContain('package.json');

    expect(entries.some((e) => e === 'README.en.md' || e.startsWith('README.en.md'))).toBe(false);
    expect(entries.some((e) => e === 'English-README.md' || e.startsWith('English-README.md'))).toBe(false);
    expect(entries.some((e) => e.startsWith('docs/'))).toBe(false);
  });
});

describe('packed package consumed like a real dependency', { timeout: 180_000 }, () => {
  let consumer = '';

  beforeAll(() => {
    consumer = join(dest, 'consumer');
    const pkgDir = join(consumer, 'node_modules', 'hunmin-search');
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
    execFileSync('tar', ['-xzf', basename(tgzPath), '-C', 'consumer/node_modules/hunmin-search', '--strip-components=1'], { cwd: dest });
  });

  it('Node ESM resolves root and ./browser through exports', () => {
    const esm = `
      import { searchKoRanked as rootFn } from 'hunmin-search';
      import { searchKoRanked as browserFn } from 'hunmin-search/browser';
      console.log(JSON.stringify([typeof rootFn, typeof browserFn, rootFn('홍길', ['홍길동', '서울'])[0]?.value, browserFn('홍길', ['홍길동', '서울'])[0]?.value]));
    `;
    expect(JSON.parse(runNode(consumer, ['--input-type=module', '-e', esm]))).toEqual([
      'function',
      'function',
      '홍길동',
      '홍길동',
    ]);
  });

  it('Node CJS resolves root and ./browser through exports', () => {
    const cjs = `
      const root = require('hunmin-search');
      const browser = require('hunmin-search/browser');
      console.log(JSON.stringify([typeof root.searchKoRanked, typeof browser.searchKoRanked, browser.searchKoRanked('홍길', ['홍길동'])[0]?.value]));
    `;
    expect(JSON.parse(runNode(consumer, ['--input-type=commonjs', '-e', cjs]))).toEqual([
      'function',
      'function',
      '홍길동',
    ]);
  });

  it('a bundler (tsup/esbuild, browser platform) resolves ./browser to the ESM build', () => {
    writeFileSync(
      join(consumer, 'entry.mjs'),
      `import { searchKoRanked } from 'hunmin-search/browser';\nconsole.log(searchKoRanked('홍길', ['홍길동', '서울'])[0]?.value);\n`,
    );
    execFileSync(process.execPath, [tsupBin, 'entry.mjs', '--no-config', '--format', 'esm', '--platform', 'browser', '--out-dir', 'out'], {
      cwd: consumer,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const bundle = readFileSync(join(consumer, 'out', 'entry.js'), 'utf8');
    expect(bundle).not.toContain('__commonJS'); // resolved to ESM, not wrapped CJS
    expect(runNode(consumer, ['out/entry.js'])).toBe('홍길동');
  });

  it('TypeScript (moduleResolution: bundler) resolves ./browser types', () => {
    writeFileSync(
      join(consumer, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { module: 'esnext', moduleResolution: 'bundler', target: 'es2022', strict: true, noEmit: true, types: [] },
        include: ['types-check.ts'],
      }),
    );
    writeFileSync(
      join(consumer, 'types-check.ts'),
      `import { searchKoRanked } from 'hunmin-search/browser';\nconst hits: { value: string; score: number }[] = searchKoRanked('a', ['a']);\nexport default hits;\n`,
    );
    execFileSync(process.execPath, [tscBin, '-p', 'tsconfig.json'], { cwd: consumer, stdio: ['ignore', 'pipe', 'pipe'] });
  });
});
