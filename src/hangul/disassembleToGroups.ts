import { DISASSEMBLED_CONSONANTS_BY_CONSONANT, DISASSEMBLED_VOWELS_BY_VOWEL } from '../constants/hangul';
import { disassembleCompleteCharacter } from './disassembleCompleteCharacter';

/**
 * Disassemble each user-perceived character into a group of jamo or pass-through units.
 *
 * 완성형은 초·중·종 배열, 호환 자모는 매핑 테이블을 따르고, 나머지는 단일 원소 그룹입니다.
 *
 * @example
 * 다음 예는 자모 덩어리 배열을 만드는 방법을 보여줍니다.
 *
 * ```ts
 * disassembleToGroups('ㄱ')[0]; // ['ㄱ']
 * ```
 */
export function disassembleToGroups(str: string): string[][] {
  const result: string[][] = [];

  for (const letter of str) {
    const disassembledComplete = disassembleCompleteCharacter(letter);

    if (disassembledComplete != null) {
      result.push([
        ...disassembledComplete.choseong,
        ...disassembledComplete.jungseong,
        ...disassembledComplete.jongseong,
      ]);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(DISASSEMBLED_CONSONANTS_BY_CONSONANT, letter)) {
      const disassembledConsonant =
        DISASSEMBLED_CONSONANTS_BY_CONSONANT[letter as keyof typeof DISASSEMBLED_CONSONANTS_BY_CONSONANT];
      result.push([...disassembledConsonant]);
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(DISASSEMBLED_VOWELS_BY_VOWEL, letter)) {
      const disassembledVowel = DISASSEMBLED_VOWELS_BY_VOWEL[letter as keyof typeof DISASSEMBLED_VOWELS_BY_VOWEL];
      result.push([...disassembledVowel]);
      continue;
    }

    result.push([letter]);
  }

  return result;
}
