import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire, SourceMap } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runInNewContext } from 'node:vm';
import { parse } from 'acorn';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { packEnvironment } from './fixtures/pack-environment';
import * as source from '../src';

const root = fileURLToPath(new URL('..', import.meta.url));
const consumerScript = fileURLToPath(new URL('./fixtures/package-gates-consumer.mjs', import.meta.url));
const entries = [
  'LICENSE',
  'README.md',
  'package.json',
  'dist/browser.d.mts',
  'dist/browser.mjs',
  'dist/browser.mjs.map',
  'dist/index.cjs',
  'dist/index.cjs.map',
  'dist/index.d.cts',
  'dist/index.d.mts',
  'dist/index.iife.js',
  'dist/index.iife.js.map',
  'dist/index.mjs',
  'dist/index.mjs.map',
].sort();
let temporary: string;
let npmArchive: string;
let pnpmArchive: string;
let installed: string;

function pack(command: string, name: string): string {
  const destination = join(temporary, name);
  mkdirSync(destination);
  execSync(command + ' --pack-destination "' + destination + '"', { cwd: root, env: packEnvironment() });
  const archives = readdirSync(destination).filter((file) => file.endsWith('.tgz'));
  expect(archives).toHaveLength(1);
  return join(destination, archives[0]!);
}

function tarEntries(archive: string): string[] {
  return execFileSync('tar', ['-tzf', basename(archive)], { cwd: dirname(archive), encoding: 'utf8' })
    .split(/\r?\n/)
    .filter((path) => path && !path.endsWith('/'))
    .map((path) => path.replace(/^package\//, ''))
    .sort();
}

function extract(archive: string, target: string): void {
  mkdirSync(target, { recursive: true });
  execFileSync('tar', ['-xzf', '-', '--strip-components=1'], { cwd: target, input: readFileSync(archive) });
}

beforeAll(() => {
  temporary = mkdtempSync(join(tmpdir(), 'hunmin package gates '));
  npmArchive = pack('npm pack --ignore-scripts', 'npm');
  pnpmArchive = pack('pnpm pack --config.ignore-scripts=true', 'pnpm');
  installed = join(temporary, 'consumer', 'node_modules', 'hunmin-search');
  extract(npmArchive, installed);
}, 120_000);

afterAll(() => {
  if (temporary) rmSync(temporary, { recursive: true, force: true });
});

it('packs exactly the approved files and resolves the same exports via npm and pnpm', () => {
  expect(tarEntries(npmArchive)).toEqual(entries);
  expect(tarEntries(pnpmArchive)).toEqual(entries);
  const readManifest = (directory: string) => JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const pkg = readManifest(installed);
  const pnpmPackage = join(temporary, 'pnpmPackage');
  extract(pnpmArchive, pnpmPackage);
  expect(pkg.engines.node).toBe('^22.0.0 || ^24.0.0 || >=26.0.0');
  expect(pkg.dependencies ?? {}).toEqual({});
  expect(pkg.main).toBe('./dist/index.cjs');
  expect(pkg.module).toBe('./dist/index.mjs');
  expect(pkg.types).toBe('./dist/index.d.cts');
  expect(pkg.exports).toEqual({
    '.': { import: './dist/index.mjs', require: './dist/index.cjs' },
    './browser': { import: './dist/browser.mjs', require: './dist/index.cjs' },
    './package.json': './package.json',
  });
  expect(readManifest(pnpmPackage).exports).toEqual(pkg.exports);
});

it('preserves packed export names, interop and Korean results', () => {
  expect(execFileSync(process.execPath, [consumerScript, npmArchive], { encoding: 'utf8' }).trim()).toBe(
    'PACKAGE RUNTIME OK'
  );
});

it.each(['index.mjs', 'index.cjs', 'browser.mjs', 'index.iife.js'])(
  'preserves Unicode search behavior and maps %s to the source',
  async (fileName) => {
    const path = join(installed, 'dist', fileName);
    const bytes = readFileSync(path);
    const code = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    expect(Buffer.from(code)).toEqual(bytes);

    let api: typeof source;
    if (fileName === 'index.iife.js') {
      expect(() => parse(code, { ecmaVersion: 2022, sourceType: 'script' })).not.toThrow();
      const context = {} as { HunminSearch: typeof source };
      runInNewContext(code, context);
      api = context.HunminSearch;
    } else if (fileName === 'index.cjs') {
      api = createRequire(import.meta.url)(path);
    } else {
      if (fileName === 'browser.mjs') {
        expect(() => parse(code, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
      }
      api = await import(pathToFileURL(path).href);
    }

    expect(api.disassemble('값')).toBe('ㄱㅏㅂㅅ');
    const names = ['서울', '홍길동', '홍길'];
    expect(api.createSearcher(names)('홍길')).toEqual(source.createSearcher(names)('홍길'));
    expect(api.createSearcher(['aİbx'])('İx')[0]?.ranges).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(api.createSearcher(['a😀b'])('😀')[0]?.ranges).toEqual([[1, 3]]);

    const mapRef = code.match(/^\/\/# sourceMappingURL=(.+)$/m)?.[1];
    expect(mapRef).toBe(fileName + '.map');
    const map = JSON.parse(readFileSync(path + '.map', 'utf8'));
    expect(map.mappings).not.toBe('');
    expect(map.sourcesContent.some((content: string) => content.length > 0)).toBe(true);
    const lines = code.split('\n');
    const generatedLine = lines.findIndex((line) => line.includes('function createSearcher'));
    expect(generatedLine).toBeGreaterThanOrEqual(0);
    const mapped = new SourceMap(map).findEntry(generatedLine, lines[generatedLine]!.indexOf('createSearcher'));
    expect(mapped.originalSource).toMatch(/src[/\\]search\.ts$/);
    const sourceIndex = map.sources.indexOf(mapped.originalSource);
    expect(map.sourcesContent[sourceIndex].split('\n')[mapped.originalLine]).toMatch(/\bfunction\s+createSearcher\b/);
  }
);
