# Hangul disassembly and choseong

Sources: [`src/hangul/`](../../src/hangul/)

## `disassemble(str: string): string`

Flattens each user-perceived character to jamo (and pass-through for non-Hangul) into **one concatenated string**. Built on [`disassembleToGroups`](../../src/hangul/disassembleToGroups.ts).

```ts
import { disassemble } from 'hangul-search';

disassemble('가'); // 'ㄱㅏ'
```

## `disassembleToGroups(str: string): string[][]`

Returns **one group per perceived character**: complete syllables become `[choseong…, jungseong…, jongseong…]`, compatibility jamo use lookup tables, everything else becomes a single-element group.

## `disassembleCompleteCharacter(letter: string)`

Returns choseong / jungseong / jongseong for **one** complete Hangul syllable (`가`–`힣`); otherwise `undefined`.

## `getChoseong(word: string): string`

Uses `normalize('NFD')` and regex mapping to extract **leading consonants** for search UIs.

## `DisassembledSyllable`

Fields `choseong`, `jungseong`, `jongseong` (jongseong follows internal constant tables).

Constants: [`src/constants/hangul.ts`](../../src/constants/hangul.ts)
