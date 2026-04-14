# 검색 API

소스: [`src/api/searchHangulRanked.ts`](../../src/api/searchHangulRanked.ts), [`src/api/searchHangulDetailed.ts`](../../src/api/searchHangulDetailed.ts)

## `searchHangulRanked(query, candidates, options?)`

- **역할**: 부분열 통과 후보에 한글 완화 Levenshtein을 적용하고, `score` 내림차순으로 정렬합니다.
- **반환**: `{ value, score }[]`. 부분열 실패 후보는 기본적으로 제외됩니다. `includeNonMatching`으로 남기면 점수 `0`입니다.
- **옵션**: [`KoPipelineOptions`](../../src/score/pipeline.ts)와 동일(`caseSensitive`, `similarSubstitutionCost`, `includeNonMatching` 등).
- **비용**: 후보 수에 선형, 후보마다 부분열 스캔 + `O(|query|×|candidate|)` DP. 큰 입력은 호출 측에서 길이·개수를 제한하세요.

```ts
import { searchHangulRanked } from 'hangul-search';

searchHangulRanked('홍길', ['홍길동', '서울']);
```

## `searchHangulDetailed(query, candidates, options?)`

- **역할**: 위와 같은 정렬을 유지하면서, 후보마다 부분열 정렬(`subsequenceAlignments`), 편집 거리(`editDistance`), 선택적 편집 역추적(`editTrace`)을 돌려줍니다.
- **`editDistance`**: 부분열 실패 시 `null`(`includeNonMatching` 사용 시).
- **`includeEditTrace`**: `true`이면 통과 후보만 `levenshteinKoTrace`를 추가 실행합니다(비용 증가).

```ts
import { searchHangulDetailed } from 'hangul-search';

searchHangulDetailed('길', ['홍길동'], { includeEditTrace: true });
```

## 관련 타입

| 타입 | 설명 |
|------|------|
| `SearchRankedHit` | `value`, `score` |
| `SearchDetailedHit` | `value`, `score`, `editDistance`, `subsequenceAlignments`, `editTrace?` |
| `SearchDetailedOptions` | 파이프라인 옵션 + `includeEditTrace?` |
| `SubsequenceAlignment` | `queryIndex`, `targetIndex`, `kind` (`exact` / `similar`) |

더 낮은 단계의 파이프라인은 [api-score.md](./api-score.md)를 참고하세요.
