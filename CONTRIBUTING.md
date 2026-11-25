# Contributing

## Setup

Building requires Node `^22.18.0 || ^24.11.0 || >=26.0.0`.

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
```

`pnpm run build` includes the `publint` and `attw` checks and rewrites the generated fields of `package.json`; commit that result (CI fails on a diff). CI also runs `pnpm run test:browser` (Playwright; Chromium required).

## When you change the public API

1. Update `src/index.ts` (and implementation files).
2. Update **`docs/api-surface.md`** and **`test/api-surface.test.ts`** so the frozen export list stays accurate.
3. Update **`docs/ko`** / **`docs/en`** reference pages and JSDoc in source so examples stay in sync.

## Style

- Format: `pnpm run format` (Prettier).
- Lint: `pnpm run lint` / `pnpm run lint:fix`.

## Releasing

Run `pnpm run publish:check` before publishing. `prepublishOnly` does not run the pack and dist gates in `test/package-gates.test.ts`. The full publish steps are in [docs/ko/npm-publish.md](docs/ko/npm-publish.md) (Korean only).

## Documentation packaging

`docs/**` and root `English-README.md` are **not** listed in `package.json` `files` (and `docs/` is also listed in `.npmignore` as a safety net). They are for the git repository only. See [docs/DOCUMENTATION_LINKS.md](docs/DOCUMENTATION_LINKS.md). `pnpm test` runs a pack-contents check (see `test/package-gates.test.ts`).
