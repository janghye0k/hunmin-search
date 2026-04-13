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

export interface DisassembledSyllable {
  choseong: Choseong;
  jungseong: Jungseong;
  jongseong: Jongseong;
}

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
