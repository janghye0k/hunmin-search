/**
 * Korean jamo/syllable checks and “similar” relation (kled-js parity).
 */

const CONSONANT_SYLLABLES = 'ㄱ가ㄲ까ㄴ나ㄷ다ㄸ따ㄹ라ㅁ마ㅂ바ㅃ빠ㅅ사ㅆ싸ㅇ아ㅈ자ㅉ짜ㅊ차ㅋ카ㅌ타ㅍ파ㅎ하';

const HANGUL_BASE = 0xac00;

export function isConsonant(c: string): boolean {
  return c >= 'ㄱ' && c <= 'ㅎ';
}

export function isSyllable(c: string): boolean {
  return c >= '가' && c <= '힣';
}

export function isKorean(c: string): boolean {
  return isConsonant(c) || isSyllable(c);
}

export function hasFinal(c: string): boolean {
  if (!isSyllable(c)) return false;
  return (c.charCodeAt(0) - HANGUL_BASE) % 28 !== 0;
}

function omitFinal(c: string): string {
  if (!hasFinal(c)) return c;
  const code = c.charCodeAt(0) - HANGUL_BASE;
  return String.fromCharCode(Math.trunc(code / 28) * 28 + HANGUL_BASE);
}

function getConsonant(c: string): string {
  if (!isSyllable(c)) return c;

  const code = c.charCodeAt(0) - HANGUL_BASE;
  const withoutFinal = Math.trunc(code / 588) * 588 + HANGUL_BASE;
  const firstLetterOfTheConsonant = String.fromCharCode(withoutFinal);
  const index = CONSONANT_SYLLABLES.indexOf(firstLetterOfTheConsonant);

  return index === -1 ? '' : CONSONANT_SYLLABLES[index - 1]!;
}

export function isSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (isConsonant(a) || isConsonant(b)) {
    return getConsonant(a) === getConsonant(b);
  }

  return omitFinal(a) === omitFinal(b);
}
