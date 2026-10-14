# Search API

Sources: [`src/api/searchKoRanked.ts`](../../src/api/searchKoRanked.ts), [`src/api/searchKoDetailed.ts`](../../src/api/searchKoDetailed.ts)

## `searchKoRanked(query, candidates, options?)`

Filters by subsequence, computes a Korean-aware Levenshtein distance for the survivors, and sorts by `score` in descending order.
- Returns `{ value, score }[]`. Candidates that fail the subsequence check are dropped, unless `includeNonMatching` keeps them with score `0`.
- Options are those of [`KoPipelineOptions`](../../src/score/pipeline.ts) (`caseSensitive`, `similarSubstitutionCost`, `includeNonMatching`, …). The validation rules for `similarSubstitutionCost` are in [api-score.md](./api-score.md).
- Time grows linearly with the number of candidates; each candidate costs a subsequence scan plus an `O(|query|×|candidate|)` DP. Limit lengths and batch size in the calling code.

```ts
import { searchKoRanked } from 'hunmin-search';

searchKoRanked('홍길', ['홍길동', '서울']);
```

## `searchKoDetailed(query, candidates, options?)`

Orders results like `searchKoRanked`, and adds a per-candidate alignment, the edit distance, and optionally the edit trace.
- `editDistance` is `null` for candidates that fail the subsequence check (when `includeNonMatching` is on).
- `queryIndex` and `targetIndex` in `subsequenceAlignments` are positions in the original query and candidate. A character that gets longer when lowercased (such as `İ`) can repeat the same position. The `score` denominator is the length of the lowercased candidate.
- With `includeEditTrace: true`, `levenshteinKoTrace` also runs for the candidates that pass, which adds time.

```ts
import { searchKoDetailed } from 'hunmin-search';

searchKoDetailed('길', ['홍길동'], { includeEditTrace: true });
```

## Related types

| Type | Purpose |
|------|---------|
| `SearchRankedHit` | `value`, `score` |
| `SearchDetailedHit` | `value`, `score`, `editDistance`, `subsequenceAlignments`, optional `editTrace` |
| `SearchDetailedOptions` | pipeline options plus `includeEditTrace?` |
| `SubsequenceAlignment` | `queryIndex`, `targetIndex`, `kind` (`exact` / `similar`) |

For the lower-level pipeline, see [api-score.md](./api-score.md).
