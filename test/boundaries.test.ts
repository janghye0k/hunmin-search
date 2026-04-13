import { describe, expect, it } from 'vitest';
import { disassemble, getChoseong } from '../src/hangul/index';
import { isSimilar } from '../src/korean/index';
import { searchDetailed, searchRanked } from '../src/api/index';

/**
 * 경계·혼합 문자열·한글 코어·유사도 회귀 (통합 관점).
 */
describe('boundaries — hangul core', () => {
  it('getChoseong empty string', () => {
    expect(getChoseong('')).toBe('');
  });

  it('disassemble empty string', () => {
    expect(disassemble('')).toBe('');
  });

  it('getChoseong keeps spaces (es-hangul-style)', () => {
    expect(getChoseong('띄어 쓰기')).toBe('ㄸㅇ ㅆㄱ');
  });
});

describe('boundaries — kled-style similarity (pipeline-relevant)', () => {
  it('isSimilar 가/강 for fuzzy subsequence + distance', () => {
    expect(isSimilar('가', '강')).toBe(true);
    expect(isSimilar('거', '강')).toBe(false);
  });
});

describe('boundaries — searchRanked / searchDetailed', () => {
  it('empty candidates → empty array', () => {
    expect(searchRanked('a', [])).toEqual([]);
    expect(searchDetailed('a', [])).toEqual([]);
  });

  it('empty query: all candidates pass subsequence; score 0; tie-break by ascending edit distance', () => {
    const out = searchRanked('', ['ccc', 'a', 'bb']);
    expect(out.map((h) => h.value)).toEqual(['a', 'bb', 'ccc']);
    expect(out.every((h) => h.score === 0)).toBe(true);
  });

  it('does not throw on surrogate / emoji (UTF-16 code units)', () => {
    const out = searchRanked('ab', ['a😀b', 'xab', '😀ab']);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((h) => typeof h.score === 'number')).toBe(true);
  });

  it('mixed Latin + Hangul subsequence + ranking', () => {
    const out = searchRanked('hello한', ['hello한글', 'hello', 'zzhello한']);
    expect(out.map((h) => h.value)).toContain('hello한글');
    expect(out[0]!.score).toBeGreaterThanOrEqual(out[out.length - 1]!.score);
  });

  it('searchDetailed reports UTF-16 indices through emoji prefix', () => {
    const out = searchDetailed('ab', ['a😀b']);
    expect(out).toHaveLength(1);
    const aln = out[0]!.subsequenceAlignments;
    expect(aln[0]).toMatchObject({ queryIndex: 0, targetIndex: 0, kind: 'exact' });
    expect(aln[1]!.queryIndex).toBe(1);
    expect(aln[1]!.targetIndex).toBeGreaterThan(1);
  });
});
