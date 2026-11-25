import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

if (process.argv[2] === '--installed') {
  const { createRequire } = await import('node:module');

  const { runInNewContext } = await import('node:vm');
  const require = createRequire(import.meta.url);
  const baseline = JSON.parse(readFileSync(new URL('./package-runtime-baseline.json', import.meta.url), 'utf8'));
  const resolveDist = (name) => fileURLToPath(new URL('./node_modules/hunmin-search/dist/' + name, import.meta.url));

  const rootRequire = require('hunmin-search');
  const browserRequire = require('hunmin-search/browser');
  assert.equal(require.resolve('hunmin-search'), resolveDist('index.cjs'));
  assert.equal(require.resolve('hunmin-search/browser'), resolveDist('index.cjs'));
  assert.equal(fileURLToPath(import.meta.resolve('hunmin-search')), resolveDist('index.mjs'));
  assert.equal(fileURLToPath(import.meta.resolve('hunmin-search/browser')), resolveDist('browser.mjs'));

  const context = {};
  runInNewContext(readFileSync(resolveDist('index.iife.js'), 'utf8'), context);
  const browserIife = context.HunminSearch;

  const APIs = {
    rootImport: await import('hunmin-search'),
    rootRequire,
    browserImport: await import('hunmin-search/browser'),
    browserRequire,
    browserIife,
  };
  for (const [name, api] of Object.entries(APIs)) {
    assert.deepEqual(Object.keys(api).sort(), baseline[name].keys, name);
    assert.equal(Object.hasOwn(api, 'default'), baseline[name].hasDefault, name);
    assert.equal(Object.hasOwn(api, '__esModule'), baseline[name].hasEsModule, name);
    const ranked = JSON.parse(JSON.stringify(api.searchKoRanked('홍길', ['홍길동', '서울'])));
    assert.deepEqual(ranked, baseline[name].ranked, name);
    assert.equal(ranked[0]?.value, '홍길동', name);
  }
  assert.equal(rootRequire[Symbol.toStringTag], 'Module');
  assert.equal(browserIife[Symbol.toStringTag], 'Module');
  process.stdout.write('PACKAGE RUNTIME OK\n');
} else {
  assert.equal(process.argv.length, 3, 'Pass the path to the packed tarball');
  const archive = resolve(process.argv[2]);
  const consumer = mkdtempSync(join(tmpdir(), 'hunmin-gates-'));
  try {
    const installed = join(consumer, 'node_modules', 'hunmin-search');
    mkdirSync(installed, { recursive: true });
    execFileSync('tar', ['-xzf', '-', '--strip-components=1'], { cwd: installed, input: readFileSync(archive) });
    const script = join(consumer, 'consumer.mjs');
    copyFileSync(new URL(import.meta.url), script);
    copyFileSync(
      new URL('./package-runtime-baseline.json', import.meta.url),
      join(consumer, 'package-runtime-baseline.json')
    );
    execFileSync(process.execPath, [script, '--installed'], { stdio: 'inherit' });
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
}
