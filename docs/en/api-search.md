# Search API

Sources: [`src/api/searchKoRanked.ts`](../../src/api/searchKoRanked.ts), [`src/api/searchKoDetailed.ts`](../../src/api/searchKoDetailed.ts)

## `searchKoRanked(query, candidates, options?)`

- **Role**: subsequence filter → Korean-aware Levenshtein → descending `score` sort.
- **Returns**: `{ value, score }[]`. Non-passing candidates are dropped unless `includeNonMatching` keeps them at score `0`.
- **Options**: same as [`KoPipelineOptions`](../../src/score/pipeline.ts) (`caseSensitive`, `similarSubstitutionCost`, `includeNonMatching`, …).
- **Cost**: linear in candidate count; per candidate subsequence scan plus `O(|query|×|candidate|)` DP. Bound lengths and batch size at the call site.

```ts
import { searchKoRanked } from 'hunmin-search';

searchKoRanked('홍길', ['홍길동', '서울']);
```

## `searchKoDetailed(query, candidates, options?)`

- **Role**: same ordering as ranked search, plus per-candidate alignment, edit distance, and optional Levenshtein trace.
- **`editDistance`**: `null` when subsequence fails (`includeNonMatching`).
- **`includeEditTrace`**: when `true`, runs `levenshteinKoTrace` for passing candidates (extra cost).

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
