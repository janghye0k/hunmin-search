# Hunmin Search (`hunmin-search`)

**English** · [한국어 README](./README.md)

This file is named **`English-README.md`** (not `README.en.md`) so npm’s pack rules do not auto-include an extra root `README*.md` file in the publish tarball. Phase 5 keeps the tarball to `dist/`, `README.md`, and `LICENSE` only.

A small library for **subsequence filtering** and **Korean-relaxed Levenshtein** scoring over mixed Hangul and Latin strings. **Zero runtime npm dependencies.**

## Documentation

- **English hub**: [docs/en/README.md](./docs/en/README.md) · **Korean hub**: [docs/ko/README.md](./docs/ko/README.md)
- **Frozen public API list**: [docs/api-surface.md](./docs/api-surface.md)
- On the npmjs.com package page, relative `./docs/...` links may not resolve. Open the same paths in your git host, or use the absolute URL pattern in [docs/DOCUMENTATION_LINKS.md](./docs/DOCUMENTATION_LINKS.md) (after filling `package.json` `repository`).

## Requirements

- Node.js **18+** recommended (see `engines`).

## Install

Use as a local path, Git dependency, or install from npm with `pnpm add hunmin-search`. Versioning, changelog, and manual publish steps follow [docs/plan-npm-manual-publish.md](./docs/plan-npm-manual-publish.md).

```bash
pnpm add ./path/to/hunmin-search
# or after build: pnpm pack → install .tgz
```

The publish tarball includes only `dist/`, `README.md`, and `LICENSE` (`files`). `prepack` runs `pnpm run build` before `pnpm pack` / `npm publish`.

## Node usage

### ESM (`import`)

```js
import { searchKoRanked, searchKoDetailed } from 'hunmin-search';

searchKoRanked('홍길', ['홍길동', '서울']);
// [{ value: '홍길동', score: number }]

searchKoDetailed('길', ['홍길동'], { includeEditTrace: true });
```

### CommonJS (`require`)

```js
const { searchKoRanked, searchKoDetailed } = require('hunmin-search');

searchKoRanked('홍길', ['홍길동', '서울']);
```

Loading this package with **both ESM `import` and CJS `require` in one app** can trigger the [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). Prefer **one module system**.

## Browser (no bundler)

Loading `dist/index.global.cjs` exposes the global **`HunminSearch`** (tsup `globalName`).

```html
<script src="./node_modules/hunmin-search/dist/index.global.cjs"></script>
<script>
  const hits = HunminSearch.searchKoRanked('홍길', ['홍길동', '서울']);
</script>
```

Paths vary by installer / monorepo layout. With Vite or Webpack, prefer the `package.json` **`hunmin-search/browser`** export subpath.

## API summary

- **`searchKoRanked(query, candidates, options?)`** — only subsequence-passing candidates, sorted by descending score (`value`, `score` only).
- **`searchKoDetailed(...)`** — same ordering plus `subsequenceAlignments`, `editDistance` (`null` on subsequence failure), optional `editTrace`.
- Lower level: `matchSubsequenceKo`, `levenshteinKo`, `rankByKoPipeline`, Hangul disassembly / choseong helpers are re-exported from the package entry.

## Constraints

- Subsequence indices are **UTF-16 code units**.
- Case-insensitive Latin uses the **`en-US` locale** (`toLocaleLowerCase('en-US')`).
- Long strings and many candidates are expensive. Prefer **caller-side** batching, caps, and truncation (see JSDoc).

## Development

- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md) · Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Typecheck uses **`moduleResolution`: `Bundler`**; relative imports omit extensions.
- **tsup** emits ESM (`.js`), CJS (`.cjs`), browser IIFE (`.global.cjs`), and declarations into `dist/`.

Some Vitest suites expect **`dist` to exist**. Typical local / CI order:

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
pnpm run publint
pnpm run attw
pnpm run test:browser   # Playwright — Chromium required
```

## License

MIT — see `LICENSE`. If third-party logic is referenced in file headers, follow those notices.
