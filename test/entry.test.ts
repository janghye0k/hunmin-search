import { describe, expect, it } from 'vitest';
import {
  disassemble,
  disassembleCompleteCharacter,
  disassembleToGroups,
  getChoseong,
  isSimilar,
  levenshteinKo,
} from '../src/index';

describe('package entry exports', () => {
  it('re-exports Phase A hangul API', () => {
    expect(getChoseong('가')).toBe('ㄱ');
    expect(disassembleCompleteCharacter('값')?.jongseong).toBe('ㅂㅅ');
    expect(disassembleToGroups('ㄱ')[0]).toEqual(['ㄱ']);
    expect(disassemble('가')).toBe('ㄱㅏ');
  });

  it('re-exports Phase B similarity + levenshteinKo', () => {
    expect(isSimilar('가', '강')).toBe(true);
    expect(levenshteinKo('A학급', 'B학급')).toBe(1);
  });
});
