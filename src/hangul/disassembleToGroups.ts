import { DISASSEMBLED_CONSONANTS_BY_CONSONANT, DISASSEMBLED_VOWELS_BY_VOWEL } from '../constants/hangul';
import { disassembleCompleteCharacter } from './disassembleCompleteCharacter';

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
