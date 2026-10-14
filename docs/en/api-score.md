# Scoring and pipeline

Sources: [`src/score/subsequence.ts`](../../src/score/subsequence.ts), [`src/score/levenshtein-ko.ts`](../../src/score/levenshtein-ko.ts), [`src/score/pipeline.ts`](../../src/score/pipeline.ts) · Latin folding: [`src/util/caseFoldEnUs.ts`](../../src/util/caseFoldEnUs.ts)

## `matchSubsequenceKo(query, haystack, options?)`

Matches the query greedily, front to back, as a subsequence of the haystack. Query characters are consumed in the same order as kled's `matches`.

- Returns `ok`, `targetIndices`, `queryIndices` and `kinds`.
- `targetIndices` and `queryIndices` have one entry per code unit of the lowercased query. The values are UTF-16 indices into the original haystack and the original query. A character that gets longer when lowercased (such as `İ`) repeats the same index.
- Hangul syllables without a final consonant can match through `isSimilar`.
- When `caseSensitive` is false, text is lowercased with the `en-US` locale.
- `queryIndices` is a required field of `SubsequenceMatchResult` and `RankedKoHit`. Code that builds objects of these types by hand (mocks, fixtures) has to fill it in to compile.

## `levenshteinKo(a, b, options?)` / `levenshteinKoTrace(a, b, options?)`

A plain Levenshtein distance, except that substituting a similar Hangul pair is cheaper.

| Operation | Cost |
|-----------|------|
| Equal characters | 0 |
| Similar Hangul pair (`isSimilar`) | `similarSubstitutionCost` (default `0.01`) |
| Any other substitution, insertion or deletion | 1 |

Each cell takes the cheapest of substitution, insertion and deletion, so the result is always the true minimum edit distance. If the similar-pair cost is above 2, a delete plus an insert is chosen instead of the substitution.

- `similarSubstitutionCost` must be a finite number >= 0. Zero and values above 1 are allowed. Negative numbers, `NaN`, `±Infinity` and non-numbers throw `RangeError`. The check runs at the start of the call, even for inputs that never reach the distance computation (empty candidate lists, candidates filtered out earlier).
- If one string is empty, the distance is the lowercased length of the other.
- kled (the npm package is named `kled`) was used as a reference, but its non-minimal results are not reproduced.
- `levenshteinKoTrace` returns the same distance plus a list of edit operations (`equal`, `similar`, `replace`, `delete`, `insert`). Indices are positions in the original strings. When several paths cost the same, it prefers match/similar/replace, then insert, then delete. The path is computed on the lowercased strings, so it is not a script that rewrites the original text.

## `rankByKoPipeline(query, candidates, options?)`

For each candidate it runs `matchSubsequenceKo`, computes `levenshteinKo` for the ones that pass, and sorts by score in descending order.

- `RankedKoHit` has `ok`, `score`, `editDistance`, `targetIndices`, `queryIndices` and `kinds`.
- `score` is normalized to `[0, 1]`. The denominator is the length of the lowercased candidate.
- With `includeNonMatching`, rejected candidates stay in the result as `ok: false`, `score: 0`, `editDistance: null`.

```ts
import { matchSubsequenceKo, levenshteinKo, rankByKoPipeline } from 'hunmin-search';

matchSubsequenceKo('길', '홍길동').ok;
levenshteinKo('A학급', 'B학급');
rankByKoPipeline('a', ['xa', 'a']);
```

For the higher-level search functions, see [api-search.md](./api-search.md).
