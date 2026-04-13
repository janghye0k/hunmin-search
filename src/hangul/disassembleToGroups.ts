import { DISASSEMBLED_CONSONANTS_BY_CONSONANT, DISASSEMBLED_VOWELS_BY_VOWEL } from '../constants/hangul';
import { disassembleCompleteCharacter } from './disassembleCompleteCharacter';

function hasConsonantEntry(letter: string): letter is keyof typeof DISASSEMBLED_CONSONANTS_BY_CONSONANT {
  return Object.prototype.hasOwnProperty.call(DISASSEMBLED_CONSONANTS_BY_CONSONANT, letter);
}

function hasVowelEntry(letter: string): letter is keyof typeof DISASSEMBLED_VOWELS_BY_VOWEL {
  return Object.prototype.hasOwnProperty.call(DISASSEMBLED_VOWELS_BY_VOWEL, letter);
}

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

    if (hasConsonantEntry(letter)) {
      const disassembledConsonant = DISASSEMBLED_CONSONANTS_BY_CONSONANT[letter];
      result.push([...disassembledConsonant]);
      continue;
    }

    if (hasVowelEntry(letter)) {
      const disassembledVowel = DISASSEMBLED_VOWELS_BY_VOWEL[letter];
      result.push([...disassembledVowel]);
      continue;
    }

    result.push([letter]);
  }

  return result;
}
