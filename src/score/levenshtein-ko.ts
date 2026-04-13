import { isKorean, isSimilar } from '../korean/similarity';

export interface LevenshteinKoOptions {
  caseSensitive?: boolean;
  /** Replacement cost when two Korean units are `isSimilar` but not equal (default 0.01). */
  similarSubstitutionCost?: number;
}

const DEFAULT_SIMILAR_COST = 0.01;

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
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
  }

  if (s1 === s2) return 0;

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

  return table[s2.length]![s1.length]!;
}
