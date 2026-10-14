import { isKorean, isSimilar } from '../korean/similarity';
import { caseFoldEnUs, originalIndex, prepareText, type FoldedText } from '../util/caseFoldEnUs';
import { resolveSimilarCost } from './options';

/**
 * Options for {@link levenshteinKo} / {@link levenshteinKoTrace}.
 *
 * `similarSubstitutionCost`는 한글 유닛이 {@link isSimilar}로 같지 않지만 유사할 때 대각 이동 비용입니다(기본 0.01).
 */
export interface LevenshteinKoOptions {
  caseSensitive?: boolean;
  /**
   * 두 한글 유닛이 `isSimilar`지만 같지 않을 때의 치환 비용(기본 0.01). 유한한 0 이상의 수여야 하며 아니면 `RangeError`.
   * 일반 치환 비용 1을 대체한다.
   */
  similarSubstitutionCost?: number;
}

function diagKind(a: string, b: string): 'equal' | 'similar' | 'replace' {
  if (a === b) return 'equal';
  return isKorean(a) && isKorean(b) && isSimilar(a, b) ? 'similar' : 'replace';
}

function substitutionCost(a: string, b: string, similarCost: number): number {
  const kind = diagKind(a, b);
  if (kind === 'equal') return 0;
  return kind === 'similar' ? similarCost : 1;
}

function fillLevenshteinKoTable(s1: string, s2: string, similarCost: number): number[][] {
  const table: number[][] = [];
  table[0] = Array.from({ length: s1.length + 1 }, (_, n) => n);
  for (let i = 1; i <= s2.length; i++) {
    table[i] = [i];
  }
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const sub = substitutionCost(s1[j - 1]!, s2[i - 1]!, similarCost);
      table[i]![j] = Math.min(table[i - 1]![j - 1]! + sub, table[i]![j - 1]! + 1, table[i - 1]![j]! + 1);
    }
  }
  return table;
}

function levenshteinKoDistance(a: string, b: string, similarCost: number): number {
  const [s1, s2] = a.length <= b.length ? [a, b] : [b, a];
  const cols = s1.length + 1;
  let prev = Array.from({ length: cols }, (_, n) => n);
  let curr = new Array<number>(cols);
  for (let i = 1; i <= s2.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= s1.length; j++) {
      const sub = substitutionCost(s1[j - 1]!, s2[i - 1]!, similarCost);
      curr[j] = Math.min(prev[j - 1]! + sub, curr[j - 1]! + 1, prev[j]! + 1);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[s1.length]!;
}

/**
 * Levenshtein distance between two strings with a small discount when two Korean
 * characters are considered “similar”.
 *
 * 각 셀은 치환·삽입·삭제의 최솟값(진짜 최소 거리). kled-js는 참고 구현이며 비최적 결과를 재현하지 않음.
 * 빈 문자열의 거리는 상대 문자열의 접힌 UTF-16 길이. 옵션이 유효하지 않으면 입력과 무관하게 `RangeError`.
 *
 * @example
 * 다음 예는 라틴 대소문자와 한글 혼합에서의 거리를 보여줍니다.
 *
 * ```ts
 * levenshteinKo('A학급', 'B학급'); // 1
 * ```
 */
export function levenshteinKo(a: string, b: string, options: LevenshteinKoOptions = {}): number {
  const similarCost = resolveSimilarCost(options.similarSubstitutionCost);
  const caseSensitive = options.caseSensitive ?? false;

  const s1 = caseSensitive ? a : caseFoldEnUs(a);
  const s2 = caseSensitive ? b : caseFoldEnUs(b);

  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;
  if (s1 === s2) return 0;

  return levenshteinKoDistance(s1, s2, similarCost);
}

/** One step in the reconstructed edit path for {@link levenshteinKoTrace}. */
export type LevenshteinKoTraceOp =
  | { kind: 'equal'; aIndex: number; bIndex: number }
  | { kind: 'similar'; aIndex: number; bIndex: number }
  | { kind: 'replace'; aIndex: number; bIndex: number }
  | { kind: 'delete'; aIndex: number }
  | { kind: 'insert'; bIndex: number };

/**
 * Aggregated trace for Korean-aware Levenshtein.
 *
 * `distance`는 {@link levenshteinKo}와 동일하고, `ops`는 역추적한 편집 연산 목록입니다.
 */
export interface LevenshteinKoTraceResult {
  distance: number;
  ops: LevenshteinKoTraceOp[];
}

function traceFolded(s1: string, s2: string, similarCost: number): LevenshteinKoTraceResult {
  if (s1.length === 0 && s2.length === 0) {
    return { distance: 0, ops: [] };
  }
  if (s1.length === 0) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let bi = 0; bi < s2.length; bi++) ops.push({ kind: 'insert', bIndex: bi });
    return { distance: s2.length, ops };
  }
  if (s2.length === 0) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let ai = 0; ai < s1.length; ai++) ops.push({ kind: 'delete', aIndex: ai });
    return { distance: s1.length, ops };
  }
  if (s1 === s2) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let k = 0; k < s1.length; k++) ops.push({ kind: 'equal', aIndex: k, bIndex: k });
    return { distance: 0, ops };
  }

  const table = fillLevenshteinKoTable(s1, s2, similarCost);
  const distance = table[s2.length]![s1.length]!;

  const rev: LevenshteinKoTraceOp[] = [];
  let i = s2.length;
  let j = s1.length;

  // Each table cell is exactly one of the three candidate values (Math.min returns an operand), so recomputing the
  // same expressions and comparing with === finds the candidate the DP chose. No epsilon: an epsilon could pick a
  // more expensive path when two costs differ by less than it.
  while (i > 0 || j > 0) {
    const cell = table[i]![j]!;
    if (i > 0 && j > 0) {
      const aChar = s1[j - 1]!;
      const bChar = s2[i - 1]!;
      if (cell === table[i - 1]![j - 1]! + substitutionCost(aChar, bChar, similarCost)) {
        rev.push({ kind: diagKind(aChar, bChar), aIndex: j - 1, bIndex: i - 1 });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && cell === table[i - 1]![j]! + 1) {
      rev.push({ kind: 'insert', bIndex: i - 1 });
      i--;
      continue;
    }
    if (j > 0 && cell === table[i]![j - 1]! + 1) {
      rev.push({ kind: 'delete', aIndex: j - 1 });
      j--;
      continue;
    }
    throw new Error('levenshteinKoTrace: backtrace invariant violated');
  }

  return { distance, ops: rev.reverse() };
}

function mapOp(op: LevenshteinKoTraceOp, fa: FoldedText, fb: FoldedText): LevenshteinKoTraceOp {
  switch (op.kind) {
    case 'delete':
      return { kind: 'delete', aIndex: originalIndex(fa, op.aIndex) };
    case 'insert':
      return { kind: 'insert', bIndex: originalIndex(fb, op.bIndex) };
    default:
      return { kind: op.kind, aIndex: originalIndex(fa, op.aIndex), bIndex: originalIndex(fb, op.bIndex) };
  }
}

/**
 * Same cost model as `levenshteinKo`, plus a backtrace of one minimum-cost edit path.
 * `ops`의 인덱스는 접힌 문자열의 편집 경로를 원문 UTF-16 위치에 연결한 것이며, 원문을 그대로 재구성하는 명령 목록이 아닙니다. 길이가 늘어난 문자는 같은 원문 위치를 여러 번 가리킬 수 있습니다.
 * 동률이면 대각선(일치/유사/치환) → 삽입 → 삭제 순으로 고른다. 옵션 검증과 빈 문자열 처리는 `levenshteinKo`와 같다.
 *
 * @example
 * 다음 예는 두 문자열에 대한 역추적 결과를 요청하는 형태를 보여줍니다.
 *
 * ```ts
 * levenshteinKoTrace('가', '각').ops.length >= 0;
 * ```
 */
export function levenshteinKoTrace(a: string, b: string, options: LevenshteinKoOptions = {}): LevenshteinKoTraceResult {
  const similarCost = resolveSimilarCost(options.similarSubstitutionCost);
  const caseSensitive = options.caseSensitive ?? false;

  const fa = prepareText(a, caseSensitive);
  const fb = prepareText(b, caseSensitive);
  const result = traceFolded(fa.text, fb.text, similarCost);

  if (!fa.origIndex && !fb.origIndex) return result;
  return { distance: result.distance, ops: result.ops.map((op) => mapOp(op, fa, fb)) };
}
