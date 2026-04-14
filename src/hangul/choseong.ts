import { CHOSEONGS, JASO_HANGUL_NFD } from '../constants/hangul';

const EXTRACT_CHOSEONG_REGEX = new RegExp(
  `[^\\u${JASO_HANGUL_NFD.START_CHOSEONG.toString(16)}-\\u${JASO_HANGUL_NFD.END_CHOSEONG.toString(16)}ㄱ-ㅎ\\s]+`,
  'ug'
);

const CHOOSE_NFD_CHOSEONG_REGEX = new RegExp(
  `[\\u${JASO_HANGUL_NFD.START_CHOSEONG.toString(16)}-\\u${JASO_HANGUL_NFD.END_CHOSEONG.toString(16)}]`,
  'g'
);

/**
 * Extract leading consonants (“choseong”) from Hangul text using NFD + mapping.
 *
 * `normalize('NFD')`로 분해한 뒤 초성 자모·완성형에서 초성만 남깁니다. 검색 초성 필터 등에 쓸 수 있습니다.
 *
 * @example
 * 다음 예는 완성형 단어에서 초성 문자열을 얻는 방법을 보여줍니다.
 *
 * ```ts
 * getChoseong('가'); // 'ㄱ'
 * ```
 */
export function getChoseong(word: string): string {
  return word
    .normalize('NFD')
    .replace(EXTRACT_CHOSEONG_REGEX, '')
    .replace(CHOOSE_NFD_CHOSEONG_REGEX, (ch) => {
      const idx = ch.codePointAt(0)! - 0x1100;
      return CHOSEONGS[idx] ?? ch;
    });
}
