import { describe, expect, it } from 'vitest';
import {
  disassemble,
  disassembleCompleteCharacter,
  disassembleToGroups,
  getChoseong,
  isSimilar,
  levenshteinKo,
  matchSubsequenceKo,
  rankByKoPipeline,
  searchHangulRanked,
} from '../src/index';

describe('package entry exports', () => {
  it('re-exports hangul API', () => {
    expect(getChoseong('가')).toBe('ㄱ');
    expect(disassembleCompleteCharacter('값')?.jongseong).toBe('ㅂㅅ');
    expect(disassembleToGroups('ㄱ')[0]).toEqual(['ㄱ']);
    expect(disassemble('가')).toBe('ㄱㅏ');
  });

  it('re-exports similarity and levenshteinKo', () => {
    expect(isSimilar('가', '강')).toBe(true);
    expect(levenshteinKo('A학급', 'B학급')).toBe(1);
  });

  it('re-exports subsequence and ranking pipeline', () => {
    expect(matchSubsequenceKo('길', '홍길동').ok).toBe(true);
    expect(rankByKoPipeline('a', ['xa', 'a'])[0]?.value).toBe('a');
  });

  it('re-exports public search API', () => {
    expect(searchHangulRanked('홍길', ['홍길동', '서울'])[0]?.value).toBe('홍길동');
  });
});
