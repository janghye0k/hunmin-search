import { describe, expect, it } from 'vitest';
import { disassembleCompleteCharacter } from '../src/hangul/disassembleCompleteCharacter';

describe('disassembleCompleteCharacter', () => {
  it('값', () => {
    expect(disassembleCompleteCharacter('값')).toEqual({
      choseong: 'ㄱ',
      jungseong: 'ㅏ',
      jongseong: 'ㅂㅅ',
    });
  });

  it('리', () => {
    expect(disassembleCompleteCharacter('리')).toEqual({
      choseong: 'ㄹ',
      jungseong: 'ㅣ',
      jongseong: '',
    });
  });

  it('빚', () => {
    expect(disassembleCompleteCharacter('빚')).toEqual({
      choseong: 'ㅂ',
      jungseong: 'ㅣ',
      jongseong: 'ㅈ',
    });
  });

  it('박', () => {
    expect(disassembleCompleteCharacter('박')).toEqual({
      choseong: 'ㅂ',
      jungseong: 'ㅏ',
      jongseong: 'ㄱ',
    });
  });

  it('완성형 한 글자가 아니면 undefined', () => {
    expect(disassembleCompleteCharacter('ㄱ')).toBeUndefined();
    expect(disassembleCompleteCharacter('ㅏ')).toBeUndefined();
    expect(disassembleCompleteCharacter('가나')).toBeUndefined();
  });
});
