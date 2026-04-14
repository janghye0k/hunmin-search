# Korean predicates and similarity

Source: [`src/korean/similarity.ts`](../../src/korean/similarity.ts)

Jamo / syllable checks and the **`isSimilar`** relation used by subsequence matching and Korean-aware Levenshtein (kled-js parity).

## Functions

| Function | Meaning |
|----------|---------|
| `isConsonant(c)` | single compatibility jamo consonant `ㄱ`–`ㅎ` |
| `isSyllable(c)` | one complete syllable `가`–`힣` |
| `isKorean(c)` | consonant jamo or complete syllable |
| `hasFinal(c)` | complete syllable with a final (batchim) |
| `isSimilar(a, b)` | equal, or same consonant row for jamo, or same syllable body ignoring finals |

```ts
import { isSimilar, hasFinal } from 'hangul-search';

isSimilar('가', '강'); // true
hasFinal('강'); // true
```

For how this feeds matching, see `matchSubsequenceKo` in [api-score.md](./api-score.md).
