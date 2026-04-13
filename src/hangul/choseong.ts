import { CHOSEONGS, JASO_HANGUL_NFD } from '../constants/hangul';

const EXTRACT_CHOSEONG_REGEX = new RegExp(
  `[^\\u${JASO_HANGUL_NFD.START_CHOSEONG.toString(16)}-\\u${JASO_HANGUL_NFD.END_CHOSEONG.toString(16)}ㄱ-ㅎ\\s]+`,
  'ug'
);

const CHOOSE_NFD_CHOSEONG_REGEX = new RegExp(
  `[\\u${JASO_HANGUL_NFD.START_CHOSEONG.toString(16)}-\\u${JASO_HANGUL_NFD.END_CHOSEONG.toString(16)}]`,
  'g'
);

export function getChoseong(word: string): string {
  return word
    .normalize('NFD')
    .replace(EXTRACT_CHOSEONG_REGEX, '')
    .replace(CHOOSE_NFD_CHOSEONG_REGEX, (ch) => {
      const idx = ch.codePointAt(0)! - 0x1100;
      return CHOSEONGS[idx] ?? ch;
    });
}
