# Documentation link pattern

Detailed docs and the English overview live under the repository (`docs/**`, root `English-README.md`) and are **not** shipped in the npm tarball (`package.json` `files`).

npm auto-includes extra root files whose names start with `readme` (case-insensitive), so the English overview intentionally avoids the `README*.md` naming pattern.

Keep the maintainer publishing guide as a standalone document. Omit it from documentation links and indexes.

## GitHub (and local clone)

Use **repository-relative** links from the repo root, for example:

- Korean hub: `docs/ko/README.md`
- English hub: `docs/en/README.md`
- API surface: `docs/api-surface.md`

For repository-only documents, use a relative link from the source Markdown file. For example, from the English documentation hub:

```markdown
[한국어 문서 허브](../ko/README.md)
```

## npmjs.com package page

Use absolute GitHub URLs for repository documents linked from the root `README.md`, which is also displayed on the npm package page.

**Recommended pattern** using `package.json` `repository`:

1. Parse `repository.url` (e.g. `git+https://github.com/janghye0k/hunmin-search.git` or `https://github.com/janghye0k/hunmin-search`).
2. Normalize to `https://github.com/janghye0k/hunmin-search`.
3. Append blob path for the default branch (usually `main`):

`https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/README.md`

