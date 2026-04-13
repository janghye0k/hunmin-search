import { describe, expect, it } from 'vitest';
import { levenshteinKo } from '../src/score/levenshtein-ko';

describe('levenshteinKo', () => {
  it('returns the other string length when one string is empty', () => {
    expect(levenshteinKo('', 'foo')).toBe(3);
    expect(levenshteinKo('hello', '')).toBe(5);
    expect(levenshteinKo('', '한글')).toBe(2);
  });

  it('returns 0 for equal strings', () => {
    expect(levenshteinKo('abc', 'abc')).toBe(0);
    expect(levenshteinKo('한글', '한글')).toBe(0);
  });

  it('uses default similar substitution cost for partial Korean matches (kled parity)', () => {
    expect(levenshteinKo('A학급', 'B학급')).toBe(1);
    expect(levenshteinKo('Aㅎㄱ', 'B학급')).toBe(1.02);
  });

  it('respects caseSensitive option', () => {
    expect(levenshteinKo('a', 'A')).toBe(0);
    expect(levenshteinKo('a', 'A', { caseSensitive: true })).toBe(1);
  });

  it('respects similarSubstitutionCost option', () => {
    expect(levenshteinKo('가', '강', { similarSubstitutionCost: 0.5 })).toBe(0.5);
    expect(levenshteinKo('가', '거', { similarSubstitutionCost: 0.5 })).toBe(1);
  });
});
