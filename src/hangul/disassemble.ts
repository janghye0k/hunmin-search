import { disassembleToGroups } from './disassembleToGroups';

/**
 * Disassemble a string into jamo/latin fragments and concatenate groups (flat string).
 *
 * {@link disassembleToGroups} 결과를 이어 붙인 한 줄 문자열입니다. 완성형 한글·자모·기타 문자를 처리합니다.
 *
 * @example
 * 다음 예는 완성형 음절이 자모로 풀리는 모습을 보여줍니다.
 *
 * ```ts
 * disassemble('가'); // 'ㄱㅏ'
 * ```
 */
export function disassemble(str: string): string {
  return disassembleToGroups(str).reduce((acc: string, group: string[]) => acc + group.join(''), '');
}
