# Public API surface (frozen)

Canonical list for documentation and regression tests. **`src/index.ts`** is the single source of re-exports; runtime exports are additionally enforced by `test/api-surface.test.ts`.

## Runtime values (functions)

| Symbol | Area |
|--------|------|
| `searchKoRanked` | Search |
| `searchKoDetailed` | Search |
| `disassemble` | Hangul |
| `disassembleCompleteCharacter` | Hangul |
| `disassembleToGroups` | Hangul |
| `getChoseong` | Hangul |
| `hasFinal` | Korean |
| `isConsonant` | Korean |
| `isKorean` | Korean |
| `isSimilar` | Korean |
| `isSyllable` | Korean |
| `matchSubsequenceKo` | Score |
| `levenshteinKo` | Score |
| `levenshteinKoTrace` | Score |
| `rankByKoPipeline` | Score |

## Type-only exports (TypeScript)

These do not exist at runtime; they are listed here for docs and API reviewers.

| Type | Area |
|------|------|
| `SearchRankedHit` | Search |
| `SearchDetailedHit` | Search |
| `SearchDetailedOptions` | Search |
| `SubsequenceAlignment` | Search |
| `DisassembledSyllable` | Hangul |
| `KoPipelineOptions` | Score |
| `LevenshteinKoOptions` | Score |
| `LevenshteinKoTraceOp` | Score |
| `LevenshteinKoTraceResult` | Score |
| `MatchSubsequenceKoOptions` | Score |
| `RankedKoHit` | Score |
| `SubsequenceMatchKind` | Score |
| `SubsequenceMatchResult` | Score |

## Change process

1. Update `src/index.ts`.
2. Update this file and `test/api-surface.test.ts`.
3. Update user-facing docs under `docs/ko` and `docs/en` (see plan in `plan-user-documentation.md`).
