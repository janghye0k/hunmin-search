import { defineConfig, type UserConfig } from 'tsdown';

// node 설정과 browser 설정이 같은 객체를 공유한다.
// (다른 객체면 "Conflicting exports" 오류가 난다는 것은 코드 읽기 결과이며 미확인)
const exports: UserConfig['exports'] = {
  customExports(exp) {
    // 자동 생성 결과는 ESM 단일 문자열이라 require가 ESM을 받는다.
    exp['./browser'] = { import: './dist/browser.mjs', require: './dist/index.cjs' };
    return exp;
  },
};

// Rolldown은 기본으로 JSDoc 주석을 JS에 남긴다. 제거하지 않으면 크기가 약 43% 늘어난다.
// d.ts의 JSDoc은 그대로 남는다.
const outputOptions = { comments: { jsdoc: false } };
const minify = { mangle: false };

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    sourcemap: true,
    outputOptions,
    minify,
    exports,
    publint: true,
    attw: { profile: 'node16', level: 'error' },
    failOnWarn: 'ci-only',
  },
  {
    entry: { browser: 'src/index.ts' },
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    fixedExtension: true,
    dts: true,
    sourcemap: true,
    outputOptions,
    minify,
    exports,
    failOnWarn: 'ci-only',
  },
  {
    entry: ['src/index.ts'],
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    globalName: 'HunminSearch',
    dts: false,
    sourcemap: true,
    outputOptions,
    minify,
    failOnWarn: 'ci-only',
  },
]);
