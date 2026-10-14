import { describe, expect, it } from 'vitest';
import { DEFAULT_SIMILAR_COST, resolveSimilarCost } from '../src/score/options';
import { rankByKoPipeline } from '../src/score/pipeline';
import { searchKoRanked } from '../src/api/searchKoRanked';
import { searchKoDetailed } from '../src/api/searchKoDetailed';

describe('resolveSimilarCost', () => {
  it('uses the default for undefined', () => {
    expect(resolveSimilarCost(undefined)).toBe(DEFAULT_SIMILAR_COST);
    expect(DEFAULT_SIMILAR_COST).toBe(0.01);
  });

  it('accepts finite numbers >= 0 including 0 and values above 1', () => {
    expect(resolveSimilarCost(0)).toBe(0);
    expect(resolveSimilarCost(0.5)).toBe(0.5);
    expect(resolveSimilarCost(1)).toBe(1);
    expect(resolveSimilarCost(5)).toBe(5);
  });

  it.each([-1, -0.0001, Number.NaN, Infinity, -Infinity, null, '0.5', {}, true])(
    'throws RangeError for invalid value %s',
    (bad) => {
      expect(() => resolveSimilarCost(bad)).toThrow(RangeError);
    },
  );
});

describe('search entry points validate options before any filtering or early return', () => {
  const bad = { similarSubstitutionCost: -1 };

  it.each([
    ['empty candidates', '가', [] as string[]],
    ['all candidates filtered out', '가', ['zzz', 'yyy']],
    ['empty query', '', ['a']],
    ['identical string', 'a', ['a']],
  ])('rankByKoPipeline throws RangeError: %s', (_label, query, candidates) => {
    expect(() => rankByKoPipeline(query, candidates, bad)).toThrow(RangeError);
  });

  it('searchKoRanked / searchKoDetailed throw RangeError', () => {
    expect(() => searchKoRanked('가', [], bad)).toThrow(RangeError);
    expect(() => searchKoDetailed('가', ['zzz'], { ...bad, includeEditTrace: true })).toThrow(RangeError);
  });

  it('accepts cost 0 and cost > 1 end to end', () => {
    expect(searchKoRanked('가', ['강'], { similarSubstitutionCost: 0 })[0]?.score).toBe(1);
    expect(searchKoDetailed('가', ['강'], { similarSubstitutionCost: 5 })[0]?.editDistance).toBe(2);
  });
});
