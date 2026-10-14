# 점수·파이프라인

소스: [`src/score/subsequence.ts`](../../src/score/subsequence.ts), [`src/score/levenshtein-ko.ts`](../../src/score/levenshtein-ko.ts), [`src/score/pipeline.ts`](../../src/score/pipeline.ts) · 라틴 접기: [`src/util/caseFoldEnUs.ts`](../../src/util/caseFoldEnUs.ts)

## `matchSubsequenceKo(query, haystack, options?)`

질의를 후보 문자열의 부분열로 앞에서부터 탐욕적으로 매칭합니다. 질의 문자를 소비하는 순서는 kled의 `matches`를 따릅니다.

- 반환 필드는 `ok`, `targetIndices`, `queryIndices`, `kinds`입니다.
- `targetIndices`와 `queryIndices`는 소문자화한 질의의 코드 유닛마다 하나씩 있고, 값은 원문 후보와 원문 질의의 UTF-16 인덱스입니다. `İ`처럼 소문자화하면 길이가 늘어나는 문자는 같은 인덱스가 반복됩니다.
- 받침 없는 한글은 `isSimilar`로 완화 매칭될 수 있습니다.
- `caseSensitive`가 거짓이면 `en-US` 기준으로 소문자화합니다.
- `queryIndices`는 `SubsequenceMatchResult`와 `RankedKoHit`의 필수 필드입니다. 이 타입의 객체를 직접 만드는 코드(목, 픽스처)는 이 필드를 채워야 컴파일됩니다.

## `levenshteinKo(a, b, options?)` / `levenshteinKoTrace(a, b, options?)`

일반 Levenshtein 거리에서 한글 유사 쌍의 치환 비용만 낮춘 편집 거리입니다.

| 연산 | 비용 |
|------|------|
| 같은 문자 | 0 |
| 유사한 한글 쌍 (`isSimilar`) | `similarSubstitutionCost` (기본 `0.01`) |
| 그 밖의 치환, 삽입, 삭제 | 1 |

각 칸에서 치환, 삽입, 삭제 중 가장 싼 값을 고르므로 결과는 항상 최소 편집 거리입니다. 유사 쌍의 비용이 2를 넘으면 치환 대신 삭제와 삽입이 선택됩니다.

- `similarSubstitutionCost`는 유한한 0 이상의 수여야 합니다. 0과 1보다 큰 값도 쓸 수 있습니다. 음수, `NaN`, `±Infinity`, 숫자가 아닌 값은 `RangeError`입니다. 빈 후보나 필터에서 탈락한 후보처럼 거리 계산까지 가지 않는 입력에도 호출 시작 시점에 검사합니다.
- 한쪽이 빈 문자열이면 거리는 다른 쪽을 소문자화한 길이입니다.
- kled(npm 패키지명 `kled`)를 참고했지만, 최소가 아닌 kled의 결과를 그대로 따르지는 않습니다.
- `levenshteinKoTrace`는 같은 거리와 함께 편집 연산 목록(`equal`, `similar`, `replace`, `delete`, `insert`)을 돌려줍니다. 인덱스는 원문 위치입니다. 비용이 같은 경로가 여러 개면 일치·유사·치환, 삽입, 삭제 순으로 고릅니다. 소문자화한 문자열의 편집 경로이므로 원문을 그대로 고치는 명령 목록은 아닙니다.

## `rankByKoPipeline(query, candidates, options?)`

후보마다 `matchSubsequenceKo`를 실행하고, 통과하면 `levenshteinKo`로 거리를 구한 뒤 점수 내림차순으로 정렬합니다.

- `RankedKoHit`은 `ok`, `score`, `editDistance`, `targetIndices`, `queryIndices`, `kinds`를 가집니다.
- `score`는 `[0, 1]` 범위로 정규화한 값입니다. 분모는 소문자화한 후보의 길이입니다.
- `includeNonMatching`을 켜면 탈락한 후보도 `ok: false`, `score: 0`, `editDistance: null`로 남습니다.

```ts
import { matchSubsequenceKo, levenshteinKo, rankByKoPipeline } from 'hunmin-search';

matchSubsequenceKo('길', '홍길동').ok;
levenshteinKo('A학급', 'B학급');
rankByKoPipeline('a', ['xa', 'a']);
```

고수준 검색 함수는 [api-search.md](./api-search.md)를 참고하세요.
