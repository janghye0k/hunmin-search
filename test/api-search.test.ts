import { describe, expect, it } from 'vitest';
import { searchKoDetailed, searchKoRanked } from '../src/api/index';

describe('searchKoRanked', () => {
  it('returns only subsequence-passing candidates sorted by normalized score', () => {
    const out = searchKoRanked('홍길', ['김철수', '홍길동', '서울']);
    expect(out).toEqual([{ value: '홍길동', score: expect.any(Number) }]);
    expect(out[0]!.score).toBeGreaterThan(0);
  });

  it('shape is { value, score } only', () => {
    const out = searchKoRanked('강', ['강남구', '강']);
    expect(out[0]).toEqual({ value: '강', score: 1 });
    expect(Object.keys(out[0]!)).toEqual(['value', 'score']);
  });

  it('includeNonMatching appends failures with score 0', () => {
    const out = searchKoRanked('xyz', ['abc', 'xayz'], { includeNonMatching: true });
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ value: 'xayz', score: expect.any(Number) });
    expect(out[1]).toEqual({ value: 'abc', score: 0 });
  });
});

describe('searchKoDetailed', () => {
  it('includes subsequenceAlignments with queryIndex, targetIndex, kind', () => {
    const out = searchKoDetailed('길', ['홍길동']);
    expect(out).toHaveLength(1);
    expect(out[0]!.value).toBe('홍길동');
    expect(out[0]!.subsequenceAlignments).toEqual([
      { queryIndex: 0, targetIndex: 1, kind: 'exact' },
    ]);
    expect(out[0]!.editDistance).not.toBeNull();
    expect(out[0]!.editDistance!).toBeGreaterThanOrEqual(0);
    expect(out[0]!.score).toBeGreaterThan(0);
  });

  it('omits editTrace by default', () => {
    const out = searchKoDetailed('a', ['a']);
    expect(out[0]!.editTrace).toBeUndefined();
  });

  it('includes editTrace when includeEditTrace is true', () => {
    const out = searchKoDetailed('a', ['a'], { includeEditTrace: true });
    expect(out[0]!.editTrace).toBeDefined();
    expect(out[0]!.editTrace!.distance).toBe(0);
    expect(out[0]!.editTrace!.ops.some((o) => o.kind === 'equal')).toBe(true);
  });

  it('does not compute editTrace for subsequence failures', () => {
    const out = searchKoDetailed('zzz', ['abc'], { includeNonMatching: true, includeEditTrace: true });
    expect(out).toHaveLength(1);
    expect(out[0]!.value).toBe('abc');
    expect(out[0]!.score).toBe(0);
    expect(out[0]!.editDistance).toBeNull();
    expect(out[0]!.subsequenceAlignments).toEqual([]);
    expect(out[0]!.editTrace).toBeUndefined();
  });
});
