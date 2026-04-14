import { hasFinal, isKorean, isSimilar } from '../korean/similarity';
import { caseFoldEnUs } from '../util/caseFoldEnUs';

/** Whether a consumed haystack unit matched exactly or under Korean similarity rules. */
export type SubsequenceMatchKind = 'exact' | 'similar';

/**
 * Options for {@link matchSubsequenceKo}.
 *
 * `caseSensitive`가 거짓이면 라틴은 `en-US` 기준으로 접습니다(내부 `caseFoldEnUs`).
 */
export interface MatchSubsequenceKoOptions {
  caseSensitive?: boolean;
}

/**
 * Result of a greedy subsequence scan.
 *
 * `targetIndices`는 질의의 각 UTF-16 코드 유닛이 후보에서 매칭된 위치입니다(BMP 가정, kled 스타일).
 */
export interface SubsequenceMatchResult {
  ok: boolean;
  /** UTF-16 code unit index in haystack per query code unit (BMP-safe, kled-style). */
  targetIndices: number[];
  kinds: SubsequenceMatchKind[];
}

/**
 * Greedy subsequence match (kled `matches` consumption order) with per-hit indices.
 *
 * 질의 문자를 순서대로 후보 안에서 “앞에서부터” 탐욕적으로 매칭합니다. 한글 받침 없는 글자는
 * {@link isSimilar}로 완화 매칭될 수 있습니다.
 *
 * @example
 * 다음 예는 질의가 후보의 부분열로 존재할 때 `ok`가 참이 되는지 보여줍니다.
 *
 * ```ts
 * matchSubsequenceKo('길', '홍길동').ok; // true
 * ```
 */
export function matchSubsequenceKo(
  query: string,
  haystack: string,
  options: MatchSubsequenceKoOptions = {}
): SubsequenceMatchResult {
  const caseSensitive = options.caseSensitive ?? false;
  const q = caseSensitive ? query : caseFoldEnUs(query);
  const h = caseSensitive ? haystack : caseFoldEnUs(haystack);

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
