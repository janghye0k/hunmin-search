import { levenshteinKoTrace, type LevenshteinKoOptions, type LevenshteinKoTraceResult } from '../score/levenshtein-ko';
import { rankByKoPipeline, type KoPipelineOptions } from '../score/pipeline';
import type { SubsequenceMatchKind } from '../score/subsequence';
export interface SubsequenceAlignment {
  /** UTF-16 code unit index in `query`. */
  queryIndex: number;
  /** UTF-16 code unit index in the candidate string. */
  targetIndex: number;
  kind: SubsequenceMatchKind;
}

export interface SearchDetailedOptions extends KoPipelineOptions {
  /** When true, `editTrace` is filled for subsequence-passing candidates (extra cost). */
  includeEditTrace?: boolean;
}

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
 * Same ranking as {@link searchRanked}, plus per-candidate alignment and optional Levenshtein backtrace.
 *
 * **Performance:** Same cost model as {@link rankByKoPipeline} (see there). Bound `candidates` count and
 * string lengths at the call site for large inputs.
 */
export function searchDetailed(
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
