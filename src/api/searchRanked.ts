import { rankByKoPipeline, type KoPipelineOptions } from '../score/pipeline';

export interface SearchRankedHit {
  value: string;
  /** Normalized: `(candidate.length - editDistance) / candidate.length` (kled-style). */
  score: number;
}

/**
 * Runs subsequence filter → Korean Levenshtein score → descending sort.
 * Default: candidates that fail subsequence are omitted; use `includeNonMatching` to keep them with score `0`.
 */
export function searchRanked(
  query: string,
  candidates: string[],
  options?: KoPipelineOptions
): SearchRankedHit[] {
  return rankByKoPipeline(query, candidates, options).map((h) => ({
    value: h.value,
    score: h.score,
  }));
}
