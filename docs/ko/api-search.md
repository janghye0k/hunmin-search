# 검색 API

소스: [`src/api/searchKoRanked.ts`](../../src/api/searchKoRanked.ts), [`src/api/searchKoDetailed.ts`](../../src/api/searchKoDetailed.ts)

## `searchKoRanked(query, candidates, options?)`

부분열을 통과한 후보에 한글 완화 Levenshtein을 적용하고 `score` 내림차순으로 정렬합니다.
- 반환값은 `{ value, score }[]`입니다. 부분열에 실패한 후보는 기본적으로 빠지고, `includeNonMatching`을 켜면 점수 `0`으로 남습니다.
- 옵션은 [`KoPipelineOptions`](../../src/score/pipeline.ts)와 같습니다(`caseSensitive`, `similarSubstitutionCost`, `includeNonMatching` 등). `similarSubstitutionCost` 검증 규칙은 [api-score.md](./api-score.md)에 있습니다.
- 시간은 후보 수에 비례하고, 후보마다 부분열 스캔과 `O(|query|×|candidate|)` DP가 듭니다. 입력이 크면 호출하는 쪽에서 길이와 개수를 제한하세요.

```ts
import { searchKoRanked } from 'hunmin-search';

searchKoRanked('홍길', ['홍길동', '서울']);
```

## `searchKoDetailed(query, candidates, options?)`

정렬은 `searchKoRanked`와 같고, 후보마다 부분열 정렬(`subsequenceAlignments`), 편집 거리(`editDistance`), 선택적으로 편집 역추적(`editTrace`)을 함께 돌려줍니다.
- `editDistance`는 부분열에 실패한 후보(`includeNonMatching` 사용 시)에서 `null`입니다.
- `subsequenceAlignments`의 `queryIndex`와 `targetIndex`는 원문 질의와 원문 후보의 위치입니다. `İ`처럼 소문자화로 길이가 늘어나는 문자는 같은 위치가 반복될 수 있습니다. `score`의 분모는 소문자화한 후보의 길이입니다.
- `includeEditTrace`가 `true`이면 통과한 후보에만 `levenshteinKoTrace`를 추가로 실행합니다. 그만큼 느려집니다.

```ts
import { searchKoDetailed } from 'hunmin-search';

searchKoDetailed('길', ['홍길동'], { includeEditTrace: true });
```

## 관련 타입

| 타입 | 설명 |
|------|------|
| `SearchRankedHit` | `value`, `score` |
| `SearchDetailedHit` | `value`, `score`, `editDistance`, `subsequenceAlignments`, `editTrace?` |
| `SearchDetailedOptions` | 파이프라인 옵션 + `includeEditTrace?` |
| `SubsequenceAlignment` | `queryIndex`, `targetIndex`, `kind` (`exact` / `similar`) |

더 낮은 단계의 파이프라인은 [api-score.md](./api-score.md)를 참고하세요.
