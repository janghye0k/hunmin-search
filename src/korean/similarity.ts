/**
 * Korean jamo/syllable checks and “similar” relation (kled-js parity).
 *
 * 자모·완성형 범위 판별과, 부분열·Levenshtein에서 쓰는 “유사 글자” 관계를 정의합니다.
 */

const CONSONANT_SYLLABLES = 'ㄱ가ㄲ까ㄴ나ㄷ다ㄸ따ㄹ라ㅁ마ㅂ바ㅃ빠ㅅ사ㅆ싸ㅇ아ㅈ자ㅉ짜ㅊ차ㅋ카ㅌ타ㅍ파ㅎ하';

const HANGUL_BASE = 0xac00;

/** True if `c` is a Hangul leading jamo in `ㄱ`–`ㅎ` (single UTF-16 unit). 호환 자모 자음 한 글자인지 검사합니다. */
export function isConsonant(c: string): boolean {
  return c >= 'ㄱ' && c <= 'ㅎ';
}

/** True if `c` is a complete Hangul syllable (`가`–`힣`). 완성형 음절 한 글자인지 검사합니다. */
export function isSyllable(c: string): boolean {
  return c >= '가' && c <= '힣';
}

/** True for Hangul jamo or complete syllable. 자음 자모이거나 완성형 음절이면 참입니다. */
export function isKorean(c: string): boolean {
  return isConsonant(c) || isSyllable(c);
}

/**
 * True when a complete syllable has a final consonant (batchim).
 *
 * 완성형이 아니면 거짓입니다. 유니코드 합성 규칙으로 종성 존재 여부를 판별합니다.
 */
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

/**
 * kled-style similarity: same consonant choice, or same syllable body ignoring finals.
 *
 * 둘 다 자모면 같은 줄의 초성으로 묶이는지 보고, 음절끼리면 받침을 뗀 몸통이 같은지 봅니다.
 *
 * @example
 * 다음 예는 받침 유무가 달라도 몸통이 같으면 유사로 인정되는 경우를 보여줍니다.
 *
 * ```ts
 * isSimilar('가', '강'); // true
 * ```
 */
export function isSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (isConsonant(a) || isConsonant(b)) {
    return getConsonant(a) === getConsonant(b);
  }

  return omitFinal(a) === omitFinal(b);
}
