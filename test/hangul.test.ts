import { describe, expect, it } from 'vitest';
import { disassemble } from '../src/hangul/disassemble';
import { disassembleCompleteCharacter } from '../src/hangul/disassembleCompleteCharacter';
import { disassembleToGroups } from '../src/hangul/disassembleToGroups';
import { getChoseong } from '../src/hangul/choseong';

describe('getChoseong', () => {
  it('"사과" → ㅅㄱ', () => {
    expect(getChoseong('사과')).toBe('ㅅㄱ');
  });

  it('"프론트엔드" → ㅍㄹㅌㅇㄷ', () => {
    expect(getChoseong('프론트엔드')).toBe('ㅍㄹㅌㅇㄷ');
  });

  it('"ㄴㅈ" → ㄴㅈ', () => {
    expect(getChoseong('ㄴㅈ')).toBe('ㄴㅈ');
  });

  it('"리액트" → ㄹㅇㅌ', () => {
    expect(getChoseong('리액트')).toBe('ㄹㅇㅌ');
  });

  it('"띄어 쓰기" → ㄸㅇ ㅆㄱ', () => {
    expect(getChoseong('띄어 쓰기')).toBe('ㄸㅇ ㅆㄱ');
  });
});

describe('disassembleToGroups', () => {
  it('값', () => {
    expect(disassembleToGroups('값')).toEqual([['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ']]);
  });

  it('값이 비싸다', () => {
    expect(disassembleToGroups('값이 비싸다')).toEqual([
      ['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ'],
      ['ㅇ', 'ㅣ'],
      [' '],
      ['ㅂ', 'ㅣ'],
      ['ㅆ', 'ㅏ'],
      ['ㄷ', 'ㅏ'],
    ]);
  });

  it('사과 짱', () => {
    expect(disassembleToGroups('사과 짱')).toEqual([['ㅅ', 'ㅏ'], ['ㄱ', 'ㅗ', 'ㅏ'], [' '], ['ㅉ', 'ㅏ', 'ㅇ']]);
  });

  it('ㄵ', () => {
    expect(disassembleToGroups('ㄵ')).toEqual([['ㄴ', 'ㅈ']]);
  });

  it('ㅘ', () => {
    expect(disassembleToGroups('ㅘ')).toEqual([['ㅗ', 'ㅏ']]);
  });
});

describe('disassemble', () => {
  it('값', () => {
    expect(disassemble('값')).toEqual('ㄱㅏㅂㅅ');
  });

  it('값이 비싸다', () => {
    expect(disassemble('값이 비싸다')).toEqual('ㄱㅏㅂㅅㅇㅣ ㅂㅣㅆㅏㄷㅏ');
  });

  it('사과 짱', () => {
    expect(disassemble('사과 짱')).toEqual('ㅅㅏㄱㅗㅏ ㅉㅏㅇ');
  });

  it('ㄵ', () => {
    expect(disassemble('ㄵ')).toEqual('ㄴㅈ');
  });

  it('ㅘ', () => {
    expect(disassemble('ㅘ')).toEqual('ㅗㅏ');
  });
});

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
