import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    treeshake: true,
    splitting: false,
    platform: 'node',
    target: 'node18',
    outExtension({ format }) {
      if (format === 'cjs') return { js: '.cjs' };
      return { js: '.js' };
    },
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    clean: false,
    sourcemap: true,
    minify: false,
    treeshake: true,
    splitting: false,
    platform: 'browser',
    target: 'es2022',
    globalName: 'HunminSearch',
    outExtension() {
      return { js: '.global.cjs' };
    },
  },
]);
