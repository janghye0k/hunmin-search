import { levenshteinKo, type LevenshteinKoOptions } from './levenshtein-ko';
import { matchSubsequenceKo, type SubsequenceMatchKind } from './subsequence';

export interface KoPipelineOptions extends LevenshteinKoOptions {
  caseSensitive?: boolean;
  /** When true, non-matching candidates are kept with `ok: false` and `score: 0`. */
  includeNonMatching?: boolean;
}

export interface RankedKoHit {
  value: string;
  ok: boolean;
  /** kled-style: (haystack.length - editDistance) / haystack.length */
  score: number;
  editDistance: number;
  targetIndices: number[];
  kinds: SubsequenceMatchKind[];
}

/**
 * Subsequence filter → `levenshteinKo` score → sort by score descending.
 */
export function rankByKoPipeline(query: string, candidates: string[], options: KoPipelineOptions = {}): RankedKoHit[] {
  const { includeNonMatching = false, ...levOpts } = options;

  const hits: RankedKoHit[] = [];

  for (const value of candidates) {
    const sub = matchSubsequenceKo(query, value, {
      caseSensitive: options.caseSensitive,
    });

    if (!sub.ok) {
      if (includeNonMatching) {
        hits.push({
          value,
          ok: false,
          score: 0,
          editDistance: Number.POSITIVE_INFINITY,
          targetIndices: [],
          kinds: [],
        });
      }
      continue;
    }

    const editDistance = levenshteinKo(query, value, levOpts);
    const score = (value.length - editDistance) / value.length;

    hits.push({
      value,
      ok: true,
      score,
      editDistance,
      targetIndices: sub.targetIndices,
      kinds: sub.kinds,
    });
  }

  hits.sort((x, y) => {
    if (x.ok !== y.ok) return x.ok ? -1 : 1;
    if (approxSort(x.score, y.score) !== 0) {
      return y.score - x.score;
    }
    return x.editDistance - y.editDistance;
  });

  return hits;
}

function approxSort(a: number, b: number): number {
  if (Math.abs(a - b) < 1e-9) return 0;
  return a - b;
}
