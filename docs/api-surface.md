# Public API surface 

Canonical list for documentation and regression tests. **`src/index.ts`** is the single source of re-exports; runtime exports are additionally enforced by `test/api-surface.test.ts`.

## Runtime values (functions)

| Symbol | Area |
|--------|------|
| `createSearcher` | Search |
| `highlight` | Search |
| `disassemble` | Hangul |
| `getChoseong` | Hangul |

## Type-only exports (TypeScript)

These do not exist at runtime; they are listed here for docs and API reviewers.

| Type | Area |
|------|------|
| `Range` | Search |
| `SearchResult` | Search |
| `SearcherOptions` | Search |
| `SearchOptions` | Search |
| `Searcher` | Search |
| `HighlightPart` | Search |

## Change process

1. Update `src/index.ts`.
2. Update this file and `test/api-surface.test.ts`.
3. Update user-facing docs under `docs/ko` and `docs/en`.
