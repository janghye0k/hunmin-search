# Contributing

## Setup

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
```

Some checks mirror CI: `publint`, `attw`, and `pnpm run test:browser` (Playwright; Chromium required).

## When you change the public API

1. Update `src/index.ts` (and implementation files).
2. Update **`docs/api-surface.md`** and **`test/api-surface.test.ts`** so the frozen export list stays accurate.
3. Update **`docs/ko`** / **`docs/en`** reference pages and JSDoc in source so examples stay in sync.

## Style

- Format: `pnpm run format` (Prettier).
- Lint: `pnpm run lint` / `pnpm run lint:fix`.

## Documentation packaging

`docs/**` and root `English-README.md` are **not** listed in `package.json` `files` (and `docs/` is also listed in `.npmignore` as a safety net). They are for the git repository only. See [docs/DOCUMENTATION_LINKS.md](docs/DOCUMENTATION_LINKS.md). `pnpm test` runs a pack-contents check (see `test/pack-contents.test.ts`).
