# Hunmin Search (`hunmin-search`)

**English** · [한국어 README](./README.md)

This file is named **`English-README.md`** (not `README.en.md`) so npm’s pack rules do not auto-include an extra root `README*.md` file in the publish tarball. Phase 5 keeps the tarball to `dist/`, `README.md`, and `LICENSE` only.

A Korean search-as-you-type library. It matches input that is still being composed by the IME, as well as initial consonants (choseong), and returns ranked results with highlight positions. **Zero runtime npm dependencies.**

```ts
import { createSearcher, highlight } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('ㅎㄱ');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
highlight('홍길동', [[0, 2]]);
// [{ text: '홍길', match: true }, { text: '동', match: false }]
```

## Documentation

- **English hub**: [docs/en/README.md](./docs/en/README.md) · **Korean hub**: [docs/ko/README.md](./docs/ko/README.md)
- **Frozen public API list**: [docs/api-surface.md](./docs/api-surface.md)
- On the npmjs.com package page, relative `./docs/...` links may not resolve. Open the same paths in your git host, or use the absolute URL pattern in [docs/DOCUMENTATION_LINKS.md](./docs/DOCUMENTATION_LINKS.md) (after filling `package.json` `repository`).

## Requirements

- Node.js `^22.0.0 || ^24.0.0 || >=26.0.0` (`engines`). Other releases are end-of-life and excluded.

## Install

Use as a local path, Git dependency, or install from npm with `pnpm add hunmin-search`. Versioning and changelog: [CHANGELOG.md](https://github.com/janghye0k/hunmin-search/blob/main/CHANGELOG.md). Publish steps: [docs/ko/npm-publish.md](https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/npm-publish.md) (Korean only).

```bash
pnpm add ./path/to/hunmin-search
# or after build: pnpm pack → install .tgz
```

The publish tarball includes only `dist/`, `README.md`, and `LICENSE` (`files`). `prepack` runs `pnpm run build` before `pnpm pack` / `npm publish`.

## Node usage

### ESM (`import`)

```js
import { createSearcher } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('홍길');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
```

### CommonJS (`require`)

```js
const { createSearcher } = require('hunmin-search');

createSearcher(['홍길동', '서울'])('홍길');
```

Loading this package with **both ESM `import` and CJS `require` in one app** can trigger the [dual package hazard](https://nodejs.org/api/packages.html#dual-package-hazard). Prefer **one module system**.

## Browser (no bundler)

Loading `dist/index.iife.js` exposes the global **`HunminSearch`** (tsdown `globalName`).

```html
<script src="./node_modules/hunmin-search/dist/index.iife.js"></script>
<script>
  const hits = HunminSearch.createSearcher(['홍길동', '서울'])('홍길');
</script>
```

With bundlers (Vite, Webpack, …), use the `hunmin-search/browser` export subpath:

```js
import { createSearcher } from 'hunmin-search/browser';
```

Its `import` condition maps to a browser ESM bundle (`dist/browser.mjs`) and `require` to the CJS build. The IIFE (`dist/index.iife.js`) is only for `<script src>` with a direct file path and is not part of `exports`. Paths vary by installer / monorepo layout.

## Wiring it to a UI

In these examples `users` is an array of `{ id, name }` objects, and `input` and `list` are existing DOM elements.

### Vanilla

```ts
const search = createSearcher(users, { key: (u) => u.name });
input.addEventListener('input', () => {
  list.replaceChildren(
    ...search(input.value, { limit: 20 }).map(({ item, ranges }) => {
      const li = document.createElement('li');
      for (const part of highlight(item.name, ranges)) {
        const node = document.createElement(part.match ? 'mark' : 'span');
        node.textContent = part.text; // never use innerHTML
        li.append(node);
      }
      return li;
    })
  );
});
```

### React

```tsx
function UserSearch({ users }: { users: readonly User[] }) {
  const [query, setQuery] = useState('');
  const search = useMemo(() => createSearcher(users, { key: (u) => u.name }), [users]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {search(query, { limit: 20 }).map(({ item, ranges }) => (
          <li key={item.id}>
            {highlight(item.name, ranges).map((p, i) => (p.match ? <mark key={i}>{p.text}</mark> : p.text))}
          </li>
        ))}
      </ul>
    </>
  );
}
```

### Notes

- Keep the `users` reference stable. A new array on every render rebuilds the searcher every time.
- With `limit` and a list of about ten thousand short items or fewer, debounce is usually unnecessary. Call it on every input. For larger lists or other conditions, measure with your own data.
- A searcher preprocesses the list it was created with. Create a new one when the list changes.
- In Vue, `v-model` is not updated during composition, so use `@input`.

## API summary

- **`createSearcher(items, { key }?)`** — builds a search function. Omit `key` for an array of strings. The search function `(query, { limit }?)` returns only the matching items, best first, as `{ item, index, ranges }[]`. There is no score; the order is the ranking.
- **`highlight(text, ranges)`** — splits a string into `{ text, match }[]` parts.
- **`getChoseong(text)`**, **`disassemble(text)`** — initial consonant extraction and jamo disassembly.

Types, contracts and matching examples per input state are in [docs/en/api-search.md](./docs/en/api-search.md).

## How matching works

- **Whitespace is ignored** in both the query and the items (`홍길` → `홍 길동`).
- **Input being composed**: the last character of the query is treated as unfinished (`간` → `가나`, `달` → `닭`, `고` → `과`).
- **Choseong**: `ㅎㄱㄷ` → `홍길동`. Tense consonants are distinct, so `ㄱ` does not match `까`.
- **Everything before the last character is final**: earlier complete syllables must be identical (`하ㄱ` does not match `한글`).
- **Case** is ignored.
- **Skipped input**: a match with gaps, such as `홍동` → `홍길동`, ranks lowest.
- **Ranking**: these are compared in order, and an earlier one wins.
  1. Grade: exact → prefix → run starting at a word → run inside a word → match with gaps
  2. Fewer partially matched characters
  3. Shorter span from the first match to the last
  4. Earlier match start
  5. Shorter item (not counting whitespace)
  6. Original order
- **Empty query** (including whitespace only): every item in original order, with `ranges: []`.
- **`ranges`**: UTF-16 indices `[start, end)` into the original string. A partially matched syllable is included whole.

## Limitations

- No typo tolerance and no multi-field search.
- Input is assumed to be Dubeolsik (2-set) typing. Intermediate states of Cheonjiin input are not supported.
- Decomposed (NFD) text is recombined for modern Hangul only. Other combining characters are not normalized.
- No context-dependent case folding, such as the Greek final sigma (`ΟΣ` does not match `ος`).
- Highlighting a whole ZWJ emoji sequence is not guaranteed.
- Long lists can be slow. Data with many repeated characters, or omitting `limit`, can be much slower. Measure with your own data.

## Development

- Contributing: [CONTRIBUTING.md](./CONTRIBUTING.md) · Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Typecheck uses **`moduleResolution`: `Bundler`**; relative imports omit extensions.
- **tsdown** emits ESM (`index.mjs`), CJS (`index.cjs`), browser ESM (`browser.mjs`), browser IIFE (`index.iife.js`), and declarations (`.d.mts`, `.d.cts`) into `dist/`. The build also runs `publint` and `attw`. Building requires Node `^22.18.0 || ^24.11.0 || >=26.0.0`.

Some Vitest suites expect **`dist` to exist**. Typical local / CI order:

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
pnpm run test:browser   # Playwright — Chromium required
pnpm run bench           # vitest bench — performance benchmarks (build first)
```

## License

MIT — see `LICENSE`. If third-party logic is referenced in file headers, follow those notices.
