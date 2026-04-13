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
  /**
   * Normalized match quality in `[0, 1]` (kled-style ratio, clamped).
   * `(len - editDistance) / len`, or `1` when both query and candidate are empty.
   */
  score: number;
  /** Levenshtein distance for passing candidates; `null` when subsequence failed (`includeNonMatching`). */
  editDistance: number | null;
  targetIndices: number[];
  kinds: SubsequenceMatchKind[];
}

function normalizedKoScore(candidateLen: number, queryLen: number, editDistance: number): number {
  if (candidateLen === 0) {
    return queryLen === 0 ? 1 : 0;
  }
  const raw = (candidateLen - editDistance) / candidateLen;
  return Math.min(1, Math.max(0, raw));
}

/**
 * Subsequence filter → `levenshteinKo` score → sort by score descending.
 *
 * **Performance:** Each candidate runs subsequence match plus O(|query|×|candidate|) DP. There is no
 * internal cap on `candidates.length` or string lengths — callers should bound batch size and length
 * (e.g. truncate or pre-filter) for large inputs.
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
          editDistance: null,
          targetIndices: [],
          kinds: [],
        });
      }
      continue;
    }

    const editDistance = levenshteinKo(query, value, levOpts);
    const score = normalizedKoScore(value.length, query.length, editDistance);

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
    if (x.ok && y.ok) {
      return x.editDistance! - y.editDistance!;
    }
    return x.value.localeCompare(y.value);
  });

  return hits;
}

function approxSort(a: number, b: number): number {
  if (Math.abs(a - b) < 1e-9) return 0;
  return a - b;
}
