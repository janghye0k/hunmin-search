import { levenshteinKoTrace, type LevenshteinKoOptions, type LevenshteinKoTraceResult } from '../score/levenshtein-ko';
import { rankByKoPipeline, type KoPipelineOptions } from '../score/pipeline';
import type { SubsequenceMatchKind } from '../score/subsequence';

/**
 * One aligned query code unit to a haystack index (greedy subsequence).
 *
 * 질의의 UTF-16 인덱스, 후보의 UTF-16 인덱스, 매칭 종류(`exact` / `similar`)를 담아 하이라이트에 쓸 수 있습니다.
 */
export interface SubsequenceAlignment {
  /** UTF-16 code unit index in `query`. */
  queryIndex: number;
  /** UTF-16 code unit index in the candidate string. */
  targetIndex: number;
  kind: SubsequenceMatchKind;
}

/**
 * Options for {@link searchKoDetailed} (extends {@link KoPipelineOptions}).
 *
 * `includeEditTrace`가 `true`이면 부분열을 통과한 후보만 Levenshtein 역추적(`editTrace`)을 추가 계산합니다.
 */
export interface SearchDetailedOptions extends KoPipelineOptions {
  /** When true, `editTrace` is filled for subsequence-passing candidates (extra cost). */
  includeEditTrace?: boolean;
}

/**
 * One ranked candidate with alignment and optional edit trace.
 *
 * `editDistance`는 부분열 실패 시 `null`입니다. `subsequenceAlignments`는 표시용 그리디 매핑이며,
 * 정렬 기준은 파이프라인 점수·편집 거리와 동일합니다.
 */
export interface SearchDetailedHit {
  value: string;
  score: number;
  /** Levenshtein distance; `null` when subsequence did not match (`includeNonMatching`). */
  editDistance: number | null;
  /** Greedy subsequence mapping (display/highlight); sort order still follows edit distance. */
  subsequenceAlignments: SubsequenceAlignment[];
  editTrace?: LevenshteinKoTraceResult;
}

/**
 * Same ranking as {@link searchKoRanked}, plus per-candidate alignment and optional Levenshtein backtrace.
 *
 * **Performance:** Same cost model as {@link rankByKoPipeline} (see there). Bound `candidates` count and
 * string lengths at the call site for large inputs.
 *
 * {@link searchKoRanked}와 동일한 정렬을 유지하면서, 후보마다 부분열 정렬 정보와 선택적으로 편집 역추적을 돌려줍니다.
 *
 * @example
 * 다음 예는 부분열 정렬과 선택적 `editTrace`를 켜는 방법을 보여줍니다.
 *
 * ```ts
 * searchKoDetailed('길', ['홍길동'], { includeEditTrace: true });
 * ```
 */
export function searchKoDetailed(
  query: string,
  candidates: string[],
  options?: SearchDetailedOptions
): SearchDetailedHit[] {
  const { includeEditTrace, ...pipeOpts } = options ?? {};
  const levOpts: LevenshteinKoOptions = pipeOpts;

  return rankByKoPipeline(query, candidates, pipeOpts).map((h) => {
    const subsequenceAlignments: SubsequenceAlignment[] = h.ok
      ? h.targetIndices.map((targetIndex, qi) => ({
          queryIndex: qi,
          targetIndex,
          kind: h.kinds[qi]!,
        }))
      : [];

    let editTrace: LevenshteinKoTraceResult | undefined;
    if (includeEditTrace && h.ok) {
      editTrace = levenshteinKoTrace(query, h.value, levOpts);
    }

    const hit: SearchDetailedHit = {
      value: h.value,
      score: h.score,
      editDistance: h.editDistance,
      subsequenceAlignments,
    };
    if (editTrace !== undefined) {
      hit.editTrace = editTrace;
    }
    return hit;
  });
}
