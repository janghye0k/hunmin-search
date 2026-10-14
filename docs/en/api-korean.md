# Korean predicates and similarity

Source: [`src/korean/similarity.ts`](../../src/korean/similarity.ts)

Jamo and syllable checks, plus the `isSimilar` relation used by subsequence matching and the Korean-aware Levenshtein distance. It is modeled on kled (the npm package is named `kled`).

## Functions

| Function | Meaning |
|----------|---------|
| `isConsonant(c)` | single compatibility jamo consonant `ㄱ`–`ㅎ` |
| `isSyllable(c)` | one complete syllable `가`–`힣` |
| `isKorean(c)` | consonant jamo or complete syllable |
| `hasFinal(c)` | complete syllable with a final (batchim) |
| `isSimilar(a, b)` | equal, or same consonant row for jamo, or same syllable body ignoring finals |

```ts
import { isSimilar, hasFinal } from 'hunmin-search';

isSimilar('가', '강'); // true
hasFinal('강'); // true
```

For how this feeds matching, see `matchSubsequenceKo` in [api-score.md](./api-score.md).

## Limitations

- `isKorean` returns `true` only for compatibility jamo **consonants** (ㄱ–ㅎ) and **complete syllables** (가–힣). Standalone **vowels** (ㅏ–ㅣ, U+314F–U+3163) return `false` and do not receive the Levenshtein similarity discount.
