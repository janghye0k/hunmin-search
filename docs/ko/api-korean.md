# 한글 판별·유사

소스: [`src/korean/similarity.ts`](../../src/korean/similarity.ts)

kled-js와 맞춘 **자모·완성형 판별**과 부분열·Levenshtein에서 쓰는 **유사(`isSimilar`)** 관계입니다.

## 함수 요약

| 함수 | 설명 |
|------|------|
| `isConsonant(c)` | `ㄱ`–`ㅎ` 호환 자모 자음 한 글자 |
| `isSyllable(c)` | `가`–`힣` 완성형 한 글자 |
| `isKorean(c)` | 위 둘 중 하나 |
| `hasFinal(c)` | 완성형이고 받침(종성)이 있을 때 참 |
| `isSimilar(a, b)` | 같거나, 자모끼리 같은 초성 줄이거나, 음절끼리 받침을 뗀 몸통이 같을 때 참 |

```ts
import { isSimilar, hasFinal } from 'hunmin-search';

isSimilar('가', '강'); // true
hasFinal('강'); // true
```

부분열 매칭에서 받침 없는 글자는 `isSimilar`로 완화될 수 있습니다. 자세한 흐름은 [api-score.md](./api-score.md)의 `matchSubsequenceKo`를 참고하세요.
