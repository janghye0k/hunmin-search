import { exec, execSync, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { packEnvironment } from './fixtures/pack-environment';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = 'package.json';
const config = 'tsdown.config.ts';
let scratch: string;

function run(command: string) {
  return execSync(command, { cwd: scratch, encoding: 'utf8', timeout: 120_000, env: packEnvironment() });
}

function brokenBuild(original: string, changed: string) {
  expect(changed).not.toBe(original);
  const path = join(scratch, config);
  writeFileSync(path, changed);
  try {
    const result = spawnSync('pnpm run build', {
      shell: true,
      cwd: scratch,
      encoding: 'utf8',
      timeout: 60_000,
      env: { ...process.env, CI: 'true' },
    });
    if (result.error) throw result.error;
    expect(result.status).not.toBeNull();
    expect(result.status, result.stdout + result.stderr).not.toBe(0);
    return result.stdout + result.stderr;
  } finally {
    writeFileSync(path, original);
  }
}

describe.skipIf(process.env.HUNMIN_RUN_LIFECYCLE_GATES !== '1')('isolated package lifecycle', () => {
  beforeAll(() => {
    scratch = mkdtempSync(join(tmpdir(), 'hunmin lifecycle gates '));
    for (const path of [
      'src',
      'test',
      'e2e',
      '.github',
      'LICENSE',
      'README.md',
      'English-README.md',
      manifest,
      config,
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'tsconfig.json',
      'vitest.config.ts',
      'playwright.config.ts',
    ]) {
      cpSync(join(root, path), join(scratch, path), { recursive: true });
    }
    run('pnpm install --frozen-lockfile');
  }, 150_000);

  afterAll(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  });

  it('cleans stale output and preserves all eleven outputs and the generated manifest', () => {
    const path = join(scratch, manifest);
    const original = JSON.parse(readFileSync(path, 'utf8'));
    run('pnpm run build');
    const first = readFileSync(path);
    expect(JSON.parse(first.toString('utf8'))).toEqual(original);
    const stale = join(scratch, 'dist', 'retired.js');
    writeFileSync(stale, '');
    run('pnpm run build');
    expect(existsSync(stale)).toBe(false);
    expect(readdirSync(join(scratch, 'dist')).sort()).toEqual(
      [
        'browser.d.mts',
        'browser.mjs',
        'browser.mjs.map',
        'index.cjs',
        'index.cjs.map',
        'index.d.cts',
        'index.d.mts',
        'index.iife.js',
        'index.iife.js.map',
        'index.mjs',
        'index.mjs.map',
      ].sort()
    );
    expect(readFileSync(path)).toEqual(first);
  }, 120_000);

  it('publint rejects a missing browser export', () => {
    const original = readFileSync(join(scratch, config), 'utf8');
    const changed = original.replace("'./dist/browser.mjs'", "'./dist/missing.mjs'").replace(/^\s+attw: .*$/m, '');
    expect(brokenBuild(original, changed)).toMatch(/publint[^\n]*missing\.mjs/i);
  }, 65_000);

  it('ATTW rejects missing CJS declarations independently of publint', () => {
    const original = readFileSync(join(scratch, config), 'utf8');
    const changed = original
      .replace("format: ['esm', 'cjs'],", "format: 'esm',")
      .replace(/^\s+publint: true,$/m, '')
      .replace(
        'export default defineConfig([',
        "export default defineConfig([\n  { entry: ['src/index.ts'], format: 'cjs', dts: false, exports },"
      );
    const diagnostic = brokenBuild(original, changed);
    expect(diagnostic).toMatch(/\[attw\] problems found:/);
    expect(diagnostic).toMatch(/Untyped resolution \(node16-cjs\) at hunmin-search\r?\n/);
    expect(diagnostic).toContain('Untyped resolution (node16-cjs) at hunmin-search/browser');
    expect(existsSync(join(scratch, 'dist', 'index.d.cts'))).toBe(false);
  }, 65_000);

  it('only runs outer lifecycle hooks once', async () => {
    const log = join(scratch, 'lifecycle.log');
    const path = join(scratch, manifest);
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    writeFileSync(
      join(scratch, 'record-lifecycle.cjs'),
      "require('node:fs').appendFileSync('lifecycle.log', process.argv[2] + '\\n');\n"
    );
    for (const hook of ['prepublishOnly', 'prepack']) {
      pkg.scripts[hook] = 'node record-lifecycle.cjs ' + hook + ' && ' + pkg.scripts[hook];
    }
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');

    run('pnpm pack --config.ignore-scripts=true');
    expect(existsSync(log)).toBe(false);
    run('pnpm pack');
    expect(readFileSync(log, 'utf8').trim().split('\n')).toEqual(['prepack']);
    writeFileSync(log, '');

    // pnpm 10 delegates to npm, which checks registry versions even on a dry run.
    const registry = createServer((request, response) => {
      response.writeHead(request.method === 'GET' ? 404 : 405).end();
    });
    registry.listen(0, '127.0.0.1');
    await once(registry, 'listening');
    try {
      const address = registry.address();
      if (!address || typeof address === 'string') throw new Error('Expected a loopback registry port');
      pkg.publishConfig = { ...pkg.publishConfig, registry: 'http://127.0.0.1:' + address.port };
      writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
      const env = packEnvironment();
      delete env.HUNMIN_RUN_LIFECYCLE_GATES;
      await promisify(exec)('pnpm run publish:dry-run', { cwd: scratch, encoding: 'utf8', timeout: 120_000, env });
    } finally {
      await new Promise<void>((resolve) => registry.close(() => resolve()));
    }
    expect(readFileSync(log, 'utf8').trim().split('\n')).toEqual(['prepublishOnly', 'prepack']);
  }, 150_000);
});
