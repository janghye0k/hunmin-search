import { describe, expect, it } from 'vitest';
import { hasFinal, isConsonant, isKorean, isSimilar, isSyllable } from '../src/korean/similarity';

describe('isConsonant / isSyllable / isKorean', () => {
  it('classifies jamo and syllables', () => {
    expect(isConsonant('ㄱ')).toBe(true);
    expect(isConsonant('가')).toBe(false);
    expect(isSyllable('가')).toBe(true);
    expect(isSyllable('ㄱ')).toBe(false);
    expect(isKorean('ㄱ')).toBe(true);
    expect(isKorean('가')).toBe(true);
    expect(isKorean('a')).toBe(false);
  });
});

describe('hasFinal', () => {
  it('is true only for complete syllables with batchim', () => {
    expect(hasFinal('각')).toBe(true);
    expect(hasFinal('가')).toBe(false);
    expect(hasFinal('ㄱ')).toBe(false);
  });
});

describe('isSimilar', () => {
  it('returns true when both are the same', () => {
    expect(isSimilar('강', '강')).toBe(true);
    expect(isSimilar('나', '나')).toBe(true);
    expect(isSimilar('ㄷ', 'ㄷ')).toBe(true);
  });

  it('returns true when one is a partial letter of the other', () => {
    expect(isSimilar('ㄱ', '강')).toBe(true);
    expect(isSimilar('ㄲ', '강')).toBe(false);
    expect(isSimilar('가', '강')).toBe(true);
    expect(isSimilar('거', '강')).toBe(false);

    expect(isSimilar('ㄴ', '날')).toBe(true);
    expect(isSimilar('ㄷ', '날')).toBe(false);
    expect(isSimilar('나', '날')).toBe(true);
    expect(isSimilar('눌', '날')).toBe(false);

    expect(isSimilar('ㅊ', '춘')).toBe(true);
  });
});
