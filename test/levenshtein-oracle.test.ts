import { describe, expect, it } from 'vitest';
import { isKorean, isSimilar } from '../src/korean/similarity';
import { levenshteinKo, levenshteinKoTrace, type LevenshteinKoTraceOp } from '../src/score/levenshtein-ko';

/** Minimum-cost reference (suffix recursion, memoized). Shares only `isKorean`/`isSimilar` with the product code. Case-sensitive. */
function oracleDistance(a: string, b: string, c: number): number {
  const memo = new Map<string, number>();
  const f = (i: number, j: number): number => {
    if (i === a.length) return b.length - j;
    if (j === b.length) return a.length - i;
    const key = `${i},${j}`;
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    const x = a[i]!;
    const y = b[j]!;
    const sub = x === y ? 0 : isKorean(x) && isKorean(y) && isSimilar(x, y) ? c : 1;
    const r = Math.min(sub + f(i + 1, j + 1), 1 + f(i + 1, j), 1 + f(i, j + 1));
    memo.set(key, r);
    return r;
  };
  return f(0, 0);
}

function opsCost(ops: LevenshteinKoTraceOp[], c: number): number {
  return ops.reduce((sum, op) => (op.kind === 'equal' ? sum : sum + (op.kind === 'similar' ? c : 1)), 0);
}

/** Every op must consume the next unconsumed unit(s) in order, and its kind must match the real character relation. */
function expectOpsConsumeInputs(ops: LevenshteinKoTraceOp[], a: string, b: string): void {
  let ai = 0;
  let bi = 0;
  for (const op of ops) {
    if (op.kind === 'delete') {
      expect(op.aIndex).toBe(ai);
      ai++;
    } else if (op.kind === 'insert') {
      expect(op.bIndex).toBe(bi);
      bi++;
    } else {
      expect(op.aIndex).toBe(ai);
      expect(op.bIndex).toBe(bi);
      const x = a[ai]!;
      const y = b[bi]!;
      if (op.kind === 'equal') {
        expect(x).toBe(y);
      } else {
        expect(x).not.toBe(y);
        expect(isKorean(x) && isKorean(y) && isSimilar(x, y)).toBe(op.kind === 'similar');
      }
      ai++;
      bi++;
    }
  }
  expect(ai).toBe(a.length);
  expect(bi).toBe(b.length);
}

const cs = { caseSensitive: true } as const;
const samples = ['', 'ㄱ', '가', '각', '강', 'ㄱ각', '각가', '가나', 'ㄱ각가가나', 'a', 'ab', 'ba', '간a가ㄱ', 'a나나ㄱ가', '한글', 'ㅎㄱ'];
const costs = [0, 0.01, 0.5, 1, 1.9999999995, 2, 2.0000000005, 5];

describe('levenshteinKo minimality (reported counterexamples)', () => {
  it.each([
    ['ㄱ', 'ㄱ각', 0.01, 1],
    ['ㄱ각가가나', '각', 0.01, 4],
    ['간a가ㄱ', 'a나나ㄱ가', 0.9, 4],
    ['가', '강', 5, 2],
    ['가', '강', 0, 0],
    ['가', '강', 0.5, 0.5],
  ] as const)('levenshteinKo(%s, %s, c=%s) = %s', (a, b, c, expected) => {
    expect(oracleDistance(a, b, c)).toBeCloseTo(expected, 12);
    expect(levenshteinKo(a, b, { ...cs, similarSubstitutionCost: c })).toBeCloseTo(expected, 12);
  });
});

describe('levenshteinKo vs oracle', () => {
  it('matches the oracle for all sample pairs and costs', () => {
    for (const a of samples) {
      for (const b of samples) {
        for (const c of costs) {
          expect(levenshteinKo(a, b, { ...cs, similarSubstitutionCost: c }), `${a}|${b}|${c}`).toBeCloseTo(
            oracleDistance(a, b, c),
            12,
          );
        }
      }
    }
  });
});

describe('levenshteinKo option validation and empty strings', () => {
  it('rejects invalid cost even on early-return paths', () => {
    expect(() => levenshteinKo('', '', { similarSubstitutionCost: -1 })).toThrow(RangeError);
    expect(() => levenshteinKo('a', 'a', { similarSubstitutionCost: Number.NaN })).toThrow(RangeError);
    expect(() => levenshteinKo('', 'abc', { similarSubstitutionCost: Infinity })).toThrow(RangeError);
  });

  it('uses the folded length of the other string when one side is empty', () => {
    expect(levenshteinKo('', 'İ')).toBe(2); // İ folds to i + U+0307 (2 UTF-16 units)
    expect(levenshteinKo('İ', '')).toBe(2);
    expect(levenshteinKo('', 'İ', { caseSensitive: true })).toBe(1);
  });
});

describe('levenshteinKoTrace', () => {
  it('distance equals levenshteinKo and the cost of its ops; ops consume both inputs correctly', () => {
    for (const a of samples) {
      for (const b of samples) {
        for (const c of costs) {
          const opts = { ...cs, similarSubstitutionCost: c };
          const t = levenshteinKoTrace(a, b, opts);
          const label = `${a}|${b}|${c}`;
          expect(t.distance, label).toBeCloseTo(levenshteinKo(a, b, opts), 12);
          expect(opsCost(t.ops, c), label).toBeCloseTo(t.distance, 12);
          expectOpsConsumeInputs(t.ops, a, b);
        }
      }
    }
  });

  it('hand-derived path: ㄱ → ㄱ각 keeps ㄱ and inserts 각 (cost 1, not 1.01)', () => {
    const t = levenshteinKoTrace('ㄱ', 'ㄱ각', { ...cs, similarSubstitutionCost: 0.01 });
    expect(t.distance).toBe(1);
    expect(t.ops).toEqual([
      { kind: 'equal', aIndex: 0, bIndex: 0 },
      { kind: 'insert', bIndex: 1 },
    ]);
  });

  it('hand-derived path: ㄱ각가가나 → 각 deletes four units and keeps 각 exactly', () => {
    const t = levenshteinKoTrace('ㄱ각가가나', '각', { ...cs, similarSubstitutionCost: 0.01 });
    expect(t.distance).toBe(4);
    expect(t.ops.filter((o) => o.kind === 'delete')).toHaveLength(4);
    expect(t.ops.find((o) => o.kind === 'equal')).toEqual({ kind: 'equal', aIndex: 1, bIndex: 0 });
  });

  it('cost 5 prefers delete+insert over a similar substitution', () => {
    const t = levenshteinKoTrace('가', '강', { ...cs, similarSubstitutionCost: 5 });
    expect(t.distance).toBe(2);
    expect(t.ops).toEqual([
      { kind: 'delete', aIndex: 0 },
      { kind: 'insert', bIndex: 0 },
    ]);
  });

  it('cost 0 reports a free similar step', () => {
    const t = levenshteinKoTrace('가', '강', { ...cs, similarSubstitutionCost: 0 });
    expect(t.distance).toBe(0);
    expect(t.ops).toEqual([{ kind: 'similar', aIndex: 0, bIndex: 0 }]);
  });

  it.each([
    [1.9999999995, ['similar'], 1.9999999995],
    [2, ['similar'], 2], // tie: diagonal is preferred
    [2.0000000005, ['delete', 'insert'], 2], // delete+insert is strictly cheaper; an epsilon compare would pick 'similar'
  ] as const)('boundary cost %s around 2 picks the truly cheapest path', (c, kinds, distance) => {
    const t = levenshteinKoTrace('가', '강', { ...cs, similarSubstitutionCost: c });
    expect(t.ops.map((o) => o.kind)).toEqual(kinds);
    expect(t.distance).toBeCloseTo(distance, 12);
    expect(opsCost(t.ops, c)).toBeCloseTo(t.distance, 12);
  });

  it('rejects invalid cost even when both strings are empty or equal', () => {
    expect(() => levenshteinKoTrace('', '', { similarSubstitutionCost: -1 })).toThrow(RangeError);
    expect(() => levenshteinKoTrace('a', 'a', { similarSubstitutionCost: Number.NaN })).toThrow(RangeError);
  });
});
