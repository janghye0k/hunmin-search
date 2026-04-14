# Scoring and pipeline

Sources: [`src/score/subsequence.ts`](../../src/score/subsequence.ts), [`src/score/levenshtein-ko.ts`](../../src/score/levenshtein-ko.ts), [`src/score/pipeline.ts`](../../src/score/pipeline.ts) · Latin folding: [`src/util/caseFoldEnUs.ts`](../../src/util/caseFoldEnUs.ts)

## `matchSubsequenceKo(query, haystack, options?)`

- **Role**: greedy **subsequence** match in kled `matches` consumption order.
- **Indices**: `targetIndices` maps each query UTF-16 code unit to a haystack index.
- **Hangul**: syllables without finals can match under `isSimilar`.
- **Case**: when `caseSensitive` is false, Latin is folded with `en-US`.

## `levenshteinKo(a, b, options?)` / `levenshteinKoTrace(a, b, options?)`

- **Role**: Levenshtein-like DP where Korean `isSimilar` pairs pay `similarSubstitutionCost` (default `0.01`) on the diagonal instead of a full `1`.
- **Trace**: `levenshteinKoTrace` returns the same distance plus a reconstructed op list (`equal`, `similar`, `replace`, `delete`, `insert`).

## `rankByKoPipeline(query, candidates, options?)`

- **Role**: per candidate `matchSubsequenceKo` → on pass `levenshteinKo` → sort by descending score.
- **`RankedKoHit`**: `ok`, normalized `score` in `[0, 1]`, `editDistance`, subsequence indices and kinds.
- **`includeNonMatching`**: keep failing rows with `ok: false`, `score: 0`, `editDistance: null`.

```ts
import { matchSubsequenceKo, levenshteinKo, rankByKoPipeline } from 'hunmin-search';

matchSubsequenceKo('길', '홍길동').ok;
levenshteinKo('A학급', 'B학급');
rankByKoPipeline('a', ['xa', 'a']);
```

Higher-level search helpers: [api-search.md](./api-search.md).
