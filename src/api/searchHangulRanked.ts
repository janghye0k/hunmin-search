import { rankByKoPipeline, type KoPipelineOptions } from '../score/pipeline';

export interface SearchRankedHit {
  value: string;
  /**
   * Normalized match quality in `[0, 1]` (kled-style ratio, clamped).
   * See {@link rankByKoPipeline} / `RankedKoHit.score`.
   *
   * `[0, 1]`로 클램프한 정규화 점수입니다. 계산 방식은 {@link rankByKoPipeline}의 `score`와 같습니다.
   */
  score: number;
}

/**
 * Runs subsequence filter → Korean Levenshtein score → descending sort.
 *
 * Default: candidates that fail subsequence are omitted; use `includeNonMatching` to keep them with score `0`.
 * For `editDistance` (including `null` on subsequence failures), use {@link searchHangulDetailed} or {@link rankByKoPipeline}.
 *
 * **Performance:** Work is linear in `candidates.length` and, per candidate, includes subsequence scan plus
 * O(|query|×|candidate|) dynamic programming for Levenshtein. There is no internal maximum on counts or lengths;
 * truncate, pre-filter, or chunk `candidates` in the caller when inputs can be large.
 *
 * 먼저 부분열(subsequence)로 필터한 뒤, 통과한 후보에 한글 완화 Levenshtein을 적용하고 점수 내림차순으로 정렬합니다.
 * 부분열에 실패한 후보는 기본적으로 제외되며, `includeNonMatching`으로 남기면 점수 `0`입니다.
 * 편집 거리·정렬 세부는 {@link searchHangulDetailed} 또는 {@link rankByKoPipeline}을 사용하세요.
 *
 * @example
 * 다음 예는 질의가 후보 문자열의 부분열로 들어갈 때 상위 히트를 얻는 방법을 보여줍니다.
 *
 * ```ts
 * searchHangulRanked('홍길', ['홍길동', '서울']);
 * // [{ value: '홍길동', score: number }, …]
 * ```
 */
export function searchHangulRanked(
  query: string,
  candidates: string[],
  options?: KoPipelineOptions
): SearchRankedHit[] {
  return rankByKoPipeline(query, candidates, options).map((h) => ({
    value: h.value,
    score: h.score,
  }));
}
