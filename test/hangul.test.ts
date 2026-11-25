import { describe, expect, it } from 'vitest';
import { disassemble, getChoseong, jamo } from '../src/hangul';

describe('jamo', () => {
  it.each([
    ['닭', 'ㄷㅏㄹㄱ'],
    ['과', 'ㄱㅗㅏ'],
    ['값', 'ㄱㅏㅂㅅ'],
    ['까', 'ㄲㅏ'],
    ['있', 'ㅇㅣㅆ'],
    ['가', 'ㄱㅏ'],
    ['힣', 'ㅎㅣㅎ'],
    ['ㅘ', 'ㅗㅏ'],
    ['ㅢ', 'ㅡㅣ'],
    ['ㄳ', 'ㄱㅅ'],
    ['ㄲ', 'ㄲ'],
    ['ㄱ', 'ㄱ'],
    ['ㅏ', 'ㅏ'],
    ['a', 'a'],
    ['A', 'A'],
    ['😀', '😀'],
    ['ᄀ', 'ᄀ'],
    ['', ''],
  ])('%s → %s', (char, expected) => {
    expect(jamo(char)).toBe(expected);
  });
});

describe('disassemble', () => {
  it.each([
    ['값', 'ㄱㅏㅂㅅ'],
    ['값이 비싸다', 'ㄱㅏㅂㅅㅇㅣ ㅂㅣㅆㅏㄷㅏ'],
    ['사과 짱', 'ㅅㅏㄱㅗㅏ ㅉㅏㅇ'],
    ['ㄵ', 'ㄴㅈ'],
    ['ㅘ', 'ㅗㅏ'],
    ['A가😀', 'Aㄱㅏ😀'],
    ['', ''],
  ])('%s → %s', (text, expected) => {
    expect(disassemble(text)).toBe(expected);
  });
});

describe('getChoseong', () => {
  it.each([
    ['사과', 'ㅅㄱ'],
    ['프론트엔드', 'ㅍㄹㅌㅇㄷ'],
    ['ㄴㅈ', 'ㄴㅈ'],
    ['리액트', 'ㄹㅇㅌ'],
    ['띄어 쓰기', 'ㄸㅇ ㅆㄱ'],
    ['값 abc 123!', 'ㄱ  '],
    ['홍길동'.normalize('NFD'), 'ㅎㄱㄷ'],
    ['ㅏ가', 'ㄱ'],
    ['', ''],
  ])('%s → %s', (text, expected) => {
    expect(getChoseong(text)).toBe(expected);
  });
});
