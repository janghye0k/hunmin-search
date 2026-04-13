import { describe, expect, it } from 'vitest';
import { matchSubsequenceKo } from '../src/score/subsequence';

describe('matchSubsequenceKo', () => {
  it('empty query matches with no indices', () => {
    const r = matchSubsequenceKo('', 'abc');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([]);
    expect(r.kinds).toEqual([]);
  });

  it('fails when query is longer than haystack', () => {
    expect(matchSubsequenceKo('abc', 'ab').ok).toBe(false);
  });

  it('finds consecutive exact Hangul', () => {
    const r = matchSubsequenceKo('길동', '홍길동');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([1, 2]);
    expect(r.kinds).toEqual(['exact', 'exact']);
  });

  it('finds jamo via similarity (kled-style)', () => {
    const r = matchSubsequenceKo('ㅎㄱ', '한글');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([0, 1]);
    expect(r.kinds.every((k) => k === 'exact' || k === 'similar')).toBe(true);
  });

  it('ASCII exact match with indexOf semantics', () => {
    const r = matchSubsequenceKo('ob', 'foobar');
    expect(r.ok).toBe(true);
    expect(r.targetIndices[0]).toBe(1);
    expect(r.targetIndices[1]).toBe(3);
  });

  it('is case-insensitive by default', () => {
    const r = matchSubsequenceKo('Fo', 'afoO');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([1, 2]);
  });

  it('respects caseSensitive', () => {
    expect(matchSubsequenceKo('Fo', 'afoO', { caseSensitive: true }).ok).toBe(false);
  });

  it('returns false when no subsequence', () => {
    expect(matchSubsequenceKo('foo', 'bar').ok).toBe(false);
  });
});
