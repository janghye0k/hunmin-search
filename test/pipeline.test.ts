import { describe, expect, it } from 'vitest';
import { rankByKoPipeline } from '../src/score/pipeline';

describe('rankByKoPipeline', () => {
  it('excludes candidates that fail subsequence by default', () => {
    const out = rankByKoPipeline('홍길', ['김철수', '홍길동', '서울']);
    expect(out.map((x) => x.value)).toEqual(['홍길동']);
  });

  it('sorts by score descending (kled-style ratio)', () => {
    const out = rankByKoPipeline('강', ['강남구', '서울시 강남', '강']);
    expect(out[0]?.value).toBe('강');
    expect(out[0]?.score).toBe(1);
    expect(out.length).toBe(3);
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1]!.score).toBeGreaterThanOrEqual(out[i]!.score);
    }
  });

  it('includeNonMatching keeps failures with score 0 at end', () => {
    const out = rankByKoPipeline('xyz', ['abc', 'xayz'], {
      includeNonMatching: true,
    });
    expect(out).toHaveLength(2);
    expect(out[0]?.value).toBe('xayz');
    expect(out[1]?.value).toBe('abc');
    expect(out[1]?.score).toBe(0);
    expect(out[1]?.ok).toBe(false);
    expect(out[1]?.editDistance).toBeNull();
  });

  it('attaches subsequence indices for matches', () => {
    const out = rankByKoPipeline('길', ['홍길동']);
    expect(out[0]?.targetIndices).toEqual([1]);
  });
});
