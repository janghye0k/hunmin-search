import { describe, expect, it } from 'vitest';
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
