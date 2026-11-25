import { describe, expect, it } from 'vitest';
import { disassemble, getChoseong } from '../src/hangul';

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
