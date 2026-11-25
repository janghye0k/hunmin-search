/**
 * Hangul tables aligned with es-hangul / Unicode syllable decomposition.
 * @see https://github.com/toss/es-hangul (MIT)
 */

export const CHOSEONGS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

const JUNGSEONGS = 'ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅗㅏ ㅗㅐ ㅗㅣ ㅛ ㅜ ㅜㅓ ㅜㅔ ㅜㅣ ㅠ ㅡ ㅡㅣ ㅣ'.split(' ');

// The leading empty entry is "no final consonant".
const JONGSEONGS =
  ' ㄱ ㄲ ㄱㅅ ㄴ ㄴㅈ ㄴㅎ ㄷ ㄹ ㄹㄱ ㄹㅁ ㄹㅂ ㄹㅅ ㄹㅌ ㄹㅍ ㄹㅎ ㅁ ㅂ ㅂㅅ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ'.split(' ');

const COMPOUND_JAMO: Record<string, string | undefined> = {
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
  ㅘ: 'ㅗㅏ',
  ㅙ: 'ㅗㅐ',
  ㅚ: 'ㅗㅣ',
  ㅝ: 'ㅜㅓ',
  ㅞ: 'ㅜㅔ',
  ㅟ: 'ㅜㅣ',
  ㅢ: 'ㅡㅣ',
};

/** Disassemble one code point into compatibility jamo; anything else is returned as is. */
export function jamo(char: string): string {
  const code = char.charCodeAt(0) - 0xac00;

  // 11172 = number of complete syllables (U+AC00–D7A3).
  if (char.length === 1 && code >= 0 && code < 11172) {
    return CHOSEONGS[Math.floor(code / 588)]! + JUNGSEONGS[Math.floor(code / 28) % 21]! + JONGSEONGS[code % 28]!;
  }

  return COMPOUND_JAMO[char] ?? char;
}

/**
 * Disassemble a string into a flat string of jamo; other characters pass through.
 *
 * 완성형 음절과 겹자모를 호환 자모로 풀어 한 줄 문자열로 반환합니다.
 *
 * @example
 * ```ts
 * disassemble('값'); // 'ㄱㅏㅂㅅ'
 * ```
 */
export function disassemble(text: string): string {
  return Array.from(text, jamo).join('');
}

/**
 * Extract leading consonants (“choseong”) from Hangul text using NFD + mapping.
 *
 * `normalize('NFD')`로 분해한 뒤 초성 자모·완성형에서 초성만 남깁니다. 검색 초성 필터 등에 쓸 수 있습니다.
 *
 * @example
 * ```ts
 * getChoseong('사과'); // 'ㅅㄱ'
 * ```
 */
export function getChoseong(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[^ᄀ-ᄒㄱ-ㅎ\s]+/gu, '')
    .replace(/[ᄀ-ᄒ]/g, (ch) => CHOSEONGS[ch.charCodeAt(0) - 0x1100]!);
}
