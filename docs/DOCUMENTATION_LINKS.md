# Documentation link pattern

Detailed docs and the English overview live under the repository (`docs/**`, root `English-README.md`) and are **not** shipped in the npm tarball (`package.json` `files`).

npm auto-includes extra root files whose names start with `readme` (case-insensitive), so the English overview intentionally avoids the `README*.md` naming pattern.

## GitHub (and local clone)

Use **repository-relative** links from the repo root, for example:

- Korean hub: `docs/ko/README.md`
- English hub: `docs/en/README.md`
- API surface: `docs/api-surface.md`

In Markdown from the root `README.md`:

```markdown
[한국어 문서 허브](./docs/ko/README.md)
```

## npmjs.com package page

Relative links on the registry page resolve against `https://www.npmjs.com/`, so deep links to `./docs/...` **do not work** for tarball-only paths.

**Recommended pattern** using `package.json` `repository`:

1. Parse `repository.url` (e.g. `git+https://github.com/janghye0k/hunmin-search.git` or `https://github.com/janghye0k/hunmin-search`).
2. Normalize to `https://github.com/janghye0k/hunmin-search`.
3. Append blob path for the default branch (usually `main`):

`https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/README.md`

