import { describe, expect, it } from 'vitest';
import * as entry from '../src/index';

/**
 * Frozen public runtime exports from `src/index.ts`.
 * When adding or removing a public function, update this list and `docs/api-surface.md`.
 */
const EXPECTED_RUNTIME_EXPORTS = [
  'disassemble',
  'disassembleCompleteCharacter',
  'disassembleToGroups',
  'getChoseong',
  'hasFinal',
  'isConsonant',
  'isKorean',
  'isSimilar',
  'isSyllable',
  'levenshteinKo',
  'levenshteinKoTrace',
  'matchSubsequenceKo',
  'rankByKoPipeline',
  'searchKoDetailed',
  'searchKoRanked',
] as const;

describe('public API surface (runtime)', () => {
  it('exports exactly the frozen runtime symbols from the package entry', () => {
    const keys = Object.keys(entry).sort();
    expect(keys).toEqual([...EXPECTED_RUNTIME_EXPORTS].sort());
  });
});
