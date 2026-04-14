# 한글 분해·초성

소스: [`src/hangul/`](../../src/hangul/)

## `disassemble(str: string): string`

완성형·호환 자모 등을 자모 단위로 풀어 **한 줄 문자열**로 이어 붙입니다. 내부적으로 [`disassembleToGroups`](../../src/hangul/disassembleToGroups.ts)를 사용합니다.

```ts
import { disassemble } from 'hangul-search';

disassemble('가'); // 'ㄱㅏ'
```

## `disassembleToGroups(str: string): string[][]`

사용자가 인지하는 **문자 하나당** 문자열 배열을 만듭니다. 완성형은 `[초, 중, 종]`에 대응하는 배열, 호환 자모는 테이블 매핑, 그 외는 `[문자]` 한 칸입니다.

## `disassembleCompleteCharacter(letter: string)`

**한 글자**가 완성형 한글(`가`–`힣`)일 때만 초·중·종을 돌려주고, 그렇지 않으면 `undefined`입니다.

## `getChoseong(word: string): string`

`normalize('NFD')`와 정규식으로 **초성 문자열**을 뽑습니다. 초성 검색·필터 UI에 활용할 수 있습니다.

## `DisassembledSyllable`

`choseong`, `jungseong`, `jongseong` 필드. 종성은 내부 상수 테이블 표현을 따릅니다.

관련 상수: [`src/constants/hangul.ts`](../../src/constants/hangul.ts)
