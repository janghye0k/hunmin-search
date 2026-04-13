import { hasFinal, isKorean, isSimilar } from '../korean/similarity';

export type SubsequenceMatchKind = 'exact' | 'similar';

export interface MatchSubsequenceKoOptions {
  caseSensitive?: boolean;
}

export interface SubsequenceMatchResult {
  ok: boolean;
  /** UTF-16 code unit index in haystack per query code unit (BMP-safe, kled-style). */
  targetIndices: number[];
  kinds: SubsequenceMatchKind[];
}

/**
 * Greedy subsequence match (kled `matches` consumption order) with per-hit indices.
 */
export function matchSubsequenceKo(
  query: string,
  haystack: string,
  options: MatchSubsequenceKoOptions = {}
): SubsequenceMatchResult {
  const caseSensitive = options.caseSensitive ?? false;
  const q = caseSensitive ? query : query.toLowerCase();
  const h = caseSensitive ? haystack : haystack.toLowerCase();

  if (q.length === 0) {
    return { ok: true, targetIndices: [], kinds: [] };
  }
  if (q.length > h.length) {
    return { ok: false, targetIndices: [], kinds: [] };
  }

  const targetIndices: number[] = [];
  const kinds: SubsequenceMatchKind[] = [];
  let from = 0;

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]!;
    let idx = -1;
    let kind: SubsequenceMatchKind = 'exact';

    if (!isKorean(ch) || hasFinal(ch)) {
      idx = h.indexOf(ch, from);
      kind = 'exact';
    } else {
      for (let i = from; i < h.length; i++) {
        const c = h[i]!;
        if (isSimilar(c, ch) && c >= ch) {
          idx = i;
          kind = c === ch ? 'exact' : 'similar';
          break;
        }
      }
    }

    if (idx === -1) {
      return { ok: false, targetIndices: [], kinds: [] };
    }

    targetIndices.push(idx);
    kinds.push(kind);
    from = idx + 1;
  }

  return { ok: true, targetIndices, kinds };
}
