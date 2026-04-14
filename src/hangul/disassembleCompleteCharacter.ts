import {
  type Choseong,
  CHOSEONGS,
  COMPLETE_HANGUL_END_CHARCODE,
  COMPLETE_HANGUL_START_CHARCODE,
  type Jongseong,
  JONGSEONGS,
  type Jungseong,
  JUNGSEONGS,
  NUMBER_OF_JONGSEONG,
  NUMBER_OF_JUNGSEONG,
} from '../constants/hangul';

/**
 * Jamo triple for one complete Hangul syllable.
 *
 * 완성형 한글 한 글자를 초·중·종으로 나눈 결과입니다. 받침이 없으면 종성은 테이블에 정의된 “빈” 표현을 따릅니다.
 */
export interface DisassembledSyllable {
  choseong: Choseong;
  jungseong: Jungseong;
  jongseong: Jongseong;
}

/**
 * Disassemble a single complete Hangul syllable (`가`–`힣`).
 *
 * 한 글자가 아니거나 완성형 범위가 아니면 `undefined`입니다.
 *
 * @example
 * 다음 예는 받침이 있는 음절의 종성을 얻는 방법을 보여줍니다.
 *
 * ```ts
 * disassembleCompleteCharacter('값')?.jongseong; // 'ㅂㅅ'
 * ```
 */
export function disassembleCompleteCharacter(letter: string): DisassembledSyllable | undefined {
  const charCode = letter.charCodeAt(0);
  const isCompleteHangul = charCode >= COMPLETE_HANGUL_START_CHARCODE && charCode <= COMPLETE_HANGUL_END_CHARCODE;

  if (!isCompleteHangul || letter.length !== 1) {
    return undefined;
  }

  const hangulCode = charCode - COMPLETE_HANGUL_START_CHARCODE;
  const jongseongIndex = hangulCode % NUMBER_OF_JONGSEONG;
  const jungseongIndex = ((hangulCode - jongseongIndex) / NUMBER_OF_JONGSEONG) % NUMBER_OF_JUNGSEONG;
  const choseongIndex = Math.floor((hangulCode - jongseongIndex) / NUMBER_OF_JONGSEONG / NUMBER_OF_JUNGSEONG);

  return {
    choseong: CHOSEONGS[choseongIndex] as Choseong,
    jungseong: JUNGSEONGS[jungseongIndex] as Jungseong,
    jongseong: JONGSEONGS[jongseongIndex] as Jongseong,
  };
}
