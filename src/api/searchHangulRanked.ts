import { rankByKoPipeline, type KoPipelineOptions } from '../score/pipeline';

export interface SearchRankedHit {
  value: string;
  /**
   * Normalized match quality in `[0, 1]` (kled-style ratio, clamped).
   * See {@link rankByKoPipeline} / `RankedKoHit.score`.
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
