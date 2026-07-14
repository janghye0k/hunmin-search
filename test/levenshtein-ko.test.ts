import { describe, expect, it } from 'vitest';
import { levenshteinKo, levenshteinKoTrace } from '../src/score/levenshtein-ko';

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

  it('matches levenshteinKoTrace distance across diverse inputs and options', () => {
    const pairs: [string, string][] = [
      ['홍길동', '홍길동'],
      ['가', '강'],
      ['가나다', '가나라'],
      ['abc', 'ABC'],
      ['', ''],
      ['검색', '검색엔진최적화'],
      ['검색엔진최적화', '검색'],
      ['가나다라마', '가다라'],
      ['가다라', '가나다라마'],
      ['a', '가나다라마바사아자차'],
      ['가나다라마바사아자차', 'a'],
      ['ㅎㄱ', '학교'],
    ];
    const optionSets: import('../src/score/levenshtein-ko').LevenshteinKoOptions[] = [
      {},
      { caseSensitive: true },
      { similarSubstitutionCost: 0.5 },
      { caseSensitive: true, similarSubstitutionCost: 0.25 },
    ];
    for (const [a, b] of pairs) {
      for (const opts of optionSets) {
        expect(levenshteinKo(a, b, opts)).toBeCloseTo(
          levenshteinKoTrace(a, b, opts).distance,
          8,
        );
      }
    }
  });
});

describe('levenshteinKoTrace', () => {
  it('matches levenshteinKo distance for simple cases', () => {
    const { distance, ops } = levenshteinKoTrace('a', 'b');
    expect(distance).toBe(1);
    expect(ops.length).toBeGreaterThan(0);
  });

  it('traces identity as all equal', () => {
    const { distance, ops } = levenshteinKoTrace('가', '가');
    expect(distance).toBe(0);
    expect(ops).toEqual([{ kind: 'equal', aIndex: 0, bIndex: 0 }]);
  });

  it('includes similar op for Korean soft match', () => {
    const { distance, ops } = levenshteinKoTrace('가', '강');
    expect(distance).toBeCloseTo(0.01, 5);
    expect(ops.some((o) => o.kind === 'similar')).toBe(true);
  });
});
