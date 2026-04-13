import { isKorean, isSimilar } from '../korean/similarity';
import { caseFoldEnUs } from '../util/caseFoldEnUs';

export interface LevenshteinKoOptions {
  caseSensitive?: boolean;
  /** Replacement cost when two Korean units are `isSimilar` but not equal (default 0.01). */
  similarSubstitutionCost?: number;
}

const DEFAULT_SIMILAR_COST = 0.01;

const EPS = 1e-9;

function approxEq(x: number, y: number): boolean {
  return Math.abs(x - y) < EPS;
}

function fillLevenshteinKoTable(s1: string, s2: string, similarCost: number): number[][] {
  const table: number[][] = [];
  table[0] = Array.from({ length: s1.length + 1 }, (_, n) => n);

  for (let i = 1; i <= s2.length; i++) {
    table[i] = [i];
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      const bChar = s2[i - 1]!;
      const aChar = s1[j - 1]!;
      let korSimilarity = 0;

      if (bChar !== aChar && isKorean(aChar) && isKorean(bChar) && isSimilar(aChar, bChar)) {
        korSimilarity = similarCost;
      }

      if (korSimilarity > 0 || bChar === aChar) {
        table[i]![j] = table[i - 1]![j - 1]! + korSimilarity;
      } else {
        table[i]![j] = Math.min(table[i - 1]![j - 1]! + 1, table[i]![j - 1]! + 1, table[i - 1]![j]! + 1);
      }
    }
  }

  return table;
}

/**
 * Levenshtein distance between two strings with a small discount when two Korean
 * characters are considered “similar” (kled-js behavior).
 */
export function levenshteinKo(a: string, b: string, options: LevenshteinKoOptions = {}): number {
  const caseSensitive = options.caseSensitive ?? false;
  const similarCost = options.similarSubstitutionCost ?? DEFAULT_SIMILAR_COST;

  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let s1 = a;
  let s2 = b;
  if (!caseSensitive) {
    s1 = caseFoldEnUs(s1);
    s2 = caseFoldEnUs(s2);
  }

  if (s1 === s2) return 0;

  const table = fillLevenshteinKoTable(s1, s2, similarCost);
  return table[s2.length]![s1.length]!;
}

export type LevenshteinKoTraceOp =
  | { kind: 'equal'; aIndex: number; bIndex: number }
  | { kind: 'similar'; aIndex: number; bIndex: number }
  | { kind: 'replace'; aIndex: number; bIndex: number }
  | { kind: 'delete'; aIndex: number }
  | { kind: 'insert'; bIndex: number };

export interface LevenshteinKoTraceResult {
  distance: number;
  ops: LevenshteinKoTraceOp[];
}

/**
 * Same cost model as `levenshteinKo`, plus a greedy backtrace for alignment.
 */
export function levenshteinKoTrace(a: string, b: string, options: LevenshteinKoOptions = {}): LevenshteinKoTraceResult {
  const caseSensitive = options.caseSensitive ?? false;
  const similarCost = options.similarSubstitutionCost ?? DEFAULT_SIMILAR_COST;

  if (a.length === 0 && b.length === 0) {
    return { distance: 0, ops: [] };
  }
  if (a.length === 0) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let bi = 0; bi < b.length; bi++) {
      ops.push({ kind: 'insert', bIndex: bi });
    }
    return { distance: b.length, ops };
  }
  if (b.length === 0) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let ai = 0; ai < a.length; ai++) {
      ops.push({ kind: 'delete', aIndex: ai });
    }
    return { distance: a.length, ops };
  }

  let s1 = a;
  let s2 = b;
  if (!caseSensitive) {
    s1 = caseFoldEnUs(s1);
    s2 = caseFoldEnUs(s2);
  }

  if (s1 === s2) {
    const ops: LevenshteinKoTraceOp[] = [];
    for (let k = 0; k < s1.length; k++) {
      ops.push({ kind: 'equal', aIndex: k, bIndex: k });
    }
    return { distance: 0, ops };
  }

  const table = fillLevenshteinKoTable(s1, s2, similarCost);
  const distance = table[s2.length]![s1.length]!;

  const rev: LevenshteinKoTraceOp[] = [];
  let i = s2.length;
  let j = s1.length;

  while (i > 0 || j > 0) {
    const bChar = i > 0 ? s2[i - 1]! : '';
    const aChar = j > 0 ? s1[j - 1]! : '';

    if (i > 0 && j > 0) {
      const diag = table[i - 1]![j - 1]!;
      if (bChar === aChar && approxEq(table[i]![j]!, diag)) {
        rev.push({ kind: 'equal', aIndex: j - 1, bIndex: i - 1 });
        i--;
        j--;
        continue;
      }
      if (
        bChar !== aChar &&
        isKorean(aChar) &&
        isKorean(bChar) &&
        isSimilar(aChar, bChar) &&
        similarCost > 0 &&
        approxEq(table[i]![j]!, diag + similarCost)
      ) {
        rev.push({ kind: 'similar', aIndex: j - 1, bIndex: i - 1 });
        i--;
        j--;
        continue;
      }
      if (approxEq(table[i]![j]!, diag + 1)) {
        rev.push({ kind: 'replace', aIndex: j - 1, bIndex: i - 1 });
        i--;
        j--;
        continue;
      }
    }

    if (i > 0 && approxEq(table[i]![j]!, table[i - 1]![j]! + 1)) {
      rev.push({ kind: 'insert', bIndex: i - 1 });
      i--;
      continue;
    }

    if (j > 0 && approxEq(table[i]![j]!, table[i]![j - 1]! + 1)) {
      rev.push({ kind: 'delete', aIndex: j - 1 });
      j--;
      continue;
    }

    // Fallback: prefer diagonal substitute if possible
    if (i > 0 && j > 0) {
      rev.push({ kind: 'replace', aIndex: j - 1, bIndex: i - 1 });
      i--;
      j--;
      continue;
    }
    if (i > 0) {
      rev.push({ kind: 'insert', bIndex: i - 1 });
      i--;
    } else if (j > 0) {
      rev.push({ kind: 'delete', aIndex: j - 1 });
      j--;
    }
  }

  return { distance, ops: rev.reverse() };
}
