import { describe, expect, it } from 'vitest';
import { levenshteinKoTrace } from '../src/score/levenshtein-ko';

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
