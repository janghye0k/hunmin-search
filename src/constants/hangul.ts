/**
 * Hangul composition tables aligned with es-hangul / Unicode syllable decomposition.
 * @see https://github.com/toss/es-hangul (MIT)
 */

export const COMPLETE_HANGUL_START_CHARCODE = '가'.charCodeAt(0);
export const COMPLETE_HANGUL_END_CHARCODE = '힣'.charCodeAt(0);

export const NUMBER_OF_JONGSEONG = 28;
export const NUMBER_OF_JUNGSEONG = 21;

/** NFD code units of "각힣" — used for choseong extraction ranges (es-hangul). */
export const JASO_HANGUL_NFD = {
  START_CHOSEONG: 0x1100,
  START_JUNGSEONG: 0x1161,
  START_JONGSEONG: 0x11a8,
  END_CHOSEONG: 0x1112,
  END_JUNGSEONG: 0x1175,
  END_JONGSEONG: 0x11c2,
} as const;

export const DISASSEMBLED_CONSONANTS_BY_CONSONANT = {
  '': '',
  ㄱ: 'ㄱ',
  ㄲ: 'ㄲ',
  ㄳ: 'ㄱㅅ',
  ㄴ: 'ㄴ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄷ: 'ㄷ',
  ㄸ: 'ㄸ',
  ㄹ: 'ㄹ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅁ: 'ㅁ',
  ㅂ: 'ㅂ',
  ㅃ: 'ㅃ',
  ㅄ: 'ㅂㅅ',
  ㅅ: 'ㅅ',
  ㅆ: 'ㅆ',
  ㅇ: 'ㅇ',
  ㅈ: 'ㅈ',
  ㅉ: 'ㅉ',
  ㅊ: 'ㅊ',
  ㅋ: 'ㅋ',
  ㅌ: 'ㅌ',
  ㅍ: 'ㅍ',
  ㅎ: 'ㅎ',
} as const;

export const DISASSEMBLED_VOWELS_BY_VOWEL = {
  ㅏ: 'ㅏ',
  ㅐ: 'ㅐ',
  ㅑ: 'ㅑ',
  ㅒ: 'ㅒ',
  ㅓ: 'ㅓ',
  ㅔ: 'ㅔ',
  ㅕ: 'ㅕ',
  ㅖ: 'ㅖ',
  ㅗ: 'ㅗ',
  ㅘ: 'ㅗㅏ',
  ㅙ: 'ㅗㅐ',
  ㅚ: 'ㅗㅣ',
  ㅛ: 'ㅛ',
  ㅜ: 'ㅜ',
  ㅝ: 'ㅜㅓ',
  ㅞ: 'ㅜㅔ',
  ㅟ: 'ㅜㅣ',
  ㅠ: 'ㅠ',
  ㅡ: 'ㅡ',
  ㅢ: 'ㅡㅣ',
  ㅣ: 'ㅣ',
} as const;

export const CHOSEONGS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export type Jungseong = (typeof DISASSEMBLED_VOWELS_BY_VOWEL)[keyof typeof DISASSEMBLED_VOWELS_BY_VOWEL];

export const JUNGSEONGS = Object.values(DISASSEMBLED_VOWELS_BY_VOWEL) as Jungseong[];

const JONGSEONG_CONSONANT_KEYS = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

export const JONGSEONGS = JONGSEONG_CONSONANT_KEYS.map((k) => DISASSEMBLED_CONSONANTS_BY_CONSONANT[k]);

export type Choseong = (typeof CHOSEONGS)[number];
export type Jongseong = (typeof JONGSEONGS)[number];
