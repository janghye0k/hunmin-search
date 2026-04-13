import { disassembleToGroups } from './disassembleToGroups';

export function disassemble(str: string): string {
  return disassembleToGroups(str).reduce((acc, group) => acc + group.join(''), '');
}
