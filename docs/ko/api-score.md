# 점수·파이프라인

소스: [`src/score/subsequence.ts`](../../src/score/subsequence.ts), [`src/score/levenshtein-ko.ts`](../../src/score/levenshtein-ko.ts), [`src/score/pipeline.ts`](../../src/score/pipeline.ts) · 라틴 접기: [`src/util/caseFoldEnUs.ts`](../../src/util/caseFoldEnUs.ts)

## `matchSubsequenceKo(query, haystack, options?)`

- **역할**: 질의를 후보 문자열의 **부분열**로 탐욕적으로 매칭합니다(kled `matches` 소비 순서).
- **인덱스**: `targetIndices`는 질의의 각 UTF-16 코드 유닛이 후보에서 잡힌 위치입니다.
- **한글**: 받침 없는 글자는 `isSimilar`로 완화 매칭될 수 있습니다.
- **대소문자**: `caseSensitive`가 거짓이면 라틴은 `en-US` 접기입니다.

## `levenshteinKo(a, b, options?)` / `levenshteinKoTrace(a, b, options?)`

- **역할**: 일반 Levenshtein에 가깝지만, 한글 `isSimilar` 쌍은 `similarSubstitutionCost`(기본 `0.01`)로 **저렴한 치환**을 허용합니다.
- **Trace**: `levenshteinKoTrace`는 같은 비용 모델로 DP 후 **역추적 연산**(`equal`, `similar`, `replace`, `delete`, `insert`)을 돌려줍니다.

## `rankByKoPipeline(query, candidates, options?)`

- **역할**: 후보마다 `matchSubsequenceKo` → 통과 시 `levenshteinKo` → 점수 내림차순 정렬.
- **`RankedKoHit`**: `ok`, `score`(`[0,1]` 정규화), `editDistance`, 부분열 인덱스·종류.
- **`includeNonMatching`**: 실패 후보도 `ok: false`, `score: 0`, `editDistance: null`로 유지.

```ts
import { matchSubsequenceKo, levenshteinKo, rankByKoPipeline } from 'hunmin-search';

matchSubsequenceKo('길', '홍길동').ok;
levenshteinKo('A학급', 'B학급');
rankByKoPipeline('a', ['xa', 'a']);
```

고수준 검색 래퍼는 [api-search.md](./api-search.md)를 참고하세요.
