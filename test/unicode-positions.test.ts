import { describe, expect, it } from 'vitest';
import { searchKoRanked } from '../src/api/searchKoRanked';
import { searchKoDetailed } from '../src/api/searchKoDetailed';
import { matchSubsequenceKo } from '../src/score/subsequence';
import { levenshteinKo, levenshteinKoTrace } from '../src/score/levenshtein-ko';
import { caseFoldEnUs, foldWithMap, originalIndex, prepareText } from '../src/util/caseFoldEnUs';

const DOT = String.fromCharCode(0x307); // combining dot above

describe('foldWithMap', () => {
  it('returns identity (no map) when folding keeps the length', () => {
    const f = foldWithMap('ABC가');
    expect(f.text).toBe('abc가');
    expect(f.origIndex).toBeUndefined();
    expect(originalIndex(f, 2)).toBe(2);
  });

  it('maps both expanded units of İ to the original index', () => {
    const f = foldWithMap('İx');
    expect(f.text).toBe(`i${DOT}x`);
    expect(f.origIndex).toEqual([0, 0, 1]);
    expect(originalIndex(f, 2)).toBe(1);
  });

  it('keeps surrogate pairs one-to-one when their length is unchanged', () => {
    const f = foldWithMap('İ😀');
    expect(f.origIndex).toEqual([0, 0, 1, 2]);
  });

  it('preserves context-dependent folding of the whole string (final sigma)', () => {
    const s = 'ΑΣ';
    expect(foldWithMap(s).text).toBe(s.toLocaleLowerCase('en-US'));
    expect(foldWithMap(s).text).toBe(caseFoldEnUs(s));
  });

  it('handles the empty string', () => {
    expect(foldWithMap('')).toEqual({ text: '' });
  });
});

describe('foldWithMap mapping path (length-changing inputs only)', () => {
  // ΑΣ alone keeps its length and never reaches the map-building branch, so these inputs force it.
  const inputs = ['İΑΣ', 'İİ', 'İ😀x', 'aİ😀İb', 'ΑΣİ', 'İ'];

  it.each(inputs)('builds a consistent map for %s', (s) => {
    const f = foldWithMap(s);
    expect(f.text).toBe(s.toLocaleLowerCase('en-US')); // whole-string folding is preserved
    expect(f.origIndex, 'mapping path must be taken').toBeDefined();
    const map = f.origIndex!;
    expect(map).toHaveLength(f.text.length);
    for (let k = 0; k < map.length; k++) {
      expect(map[k]!).toBeGreaterThanOrEqual(0);
      expect(map[k]!).toBeLessThan(s.length);
      if (k > 0) expect(map[k]!).toBeGreaterThanOrEqual(map[k - 1]!); // monotonic non-decreasing
    }
  });

  it('keeps final-sigma context while still expanding İ in the same string', () => {
    const s = 'İΑΣ';
    const folded = foldWithMap(s).text;
    const perChar = [...s].map((ch) => ch.toLocaleLowerCase('en-US')).join('');
    expect(folded).toBe(s.toLocaleLowerCase('en-US'));
    expect(folded).not.toBe(perChar); // per-character folding would produce a non-final sigma; whole-string folding must not
    expect(foldWithMap(s).origIndex).toEqual([0, 0, 1, 2]);
  });

  it('maps repeated İ and an emoji after an expanded character', () => {
    expect(foldWithMap('İİ').origIndex).toEqual([0, 0, 1, 1]);
    expect(foldWithMap('İ😀x').origIndex).toEqual([0, 0, 1, 2, 3]);
  });
});

describe('prepareText', () => {
  it('does not fold when caseSensitive', () => {
    expect(prepareText('İx', true)).toEqual({ text: 'İx' });
  });
  it('folds when case-insensitive', () => {
    expect(prepareText('İx', false).text).toBe(`i${DOT}x`);
  });
});

describe('matchSubsequenceKo original positions', () => {
  it('maps a haystack match after İ back to the original index', () => {
    const r = matchSubsequenceKo('x', 'İx');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([1]);
    expect(r.queryIndices).toEqual([0]);
  });

  it('maps both expanded units of an İ query to the same original positions', () => {
    const r = matchSubsequenceKo('İ', 'İx');
    expect(r.ok).toBe(true);
    expect(r.queryIndices).toEqual([0, 0]);
    expect(r.targetIndices).toEqual([0, 0]);
  });

  it('keeps all indices inside the original strings', () => {
    const q = 'İx';
    const h = 'aİbx';
    const r = matchSubsequenceKo(q, h);
    expect(r.ok).toBe(true);
    for (const i of r.queryIndices) expect(i).toBeLessThan(q.length);
    for (const i of r.targetIndices) expect(i).toBeLessThan(h.length);
    expect(r.targetIndices).toEqual([1, 1, 3]);
    expect(r.queryIndices).toEqual([0, 0, 1]);
  });

  it('keeps the UTF-16 contract for emoji (two units, two indices)', () => {
    const r = matchSubsequenceKo('😀', 'a😀b');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([1, 2]);
    expect(r.queryIndices).toEqual([0, 1]);
  });

  it('does no folding or mapping when caseSensitive', () => {
    const r = matchSubsequenceKo('x', 'İx', { caseSensitive: true });
    expect(r.targetIndices).toEqual([1]);
    expect(r.queryIndices).toEqual([0]);
  });

  it('returns empty queryIndices on empty query and on failure', () => {
    expect(matchSubsequenceKo('', 'abc').queryIndices).toEqual([]);
    expect(matchSubsequenceKo('zz', 'abc').queryIndices).toEqual([]);
  });

  it.each([
    ['İΑΣ', 'xİΑΣ', true],
    ['İİ', 'aİbİc', true],
    ['x😀', 'İ😀İx😀', true],
    ['İ', 'İ', true],
  ])('keeps queryIndices, targetIndices and kinds aligned and in range for %s in %s (ok=%s)', (q, h, ok) => {
    const r = matchSubsequenceKo(q, h);
    expect(r.ok).toBe(ok);
    expect(r.queryIndices).toHaveLength(r.targetIndices.length);
    expect(r.kinds).toHaveLength(r.targetIndices.length);
    for (const i of r.queryIndices) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(q.length);
    }
    for (const i of r.targetIndices) {
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(h.length);
    }
    expect([...r.targetIndices].sort((a, b) => a - b)).toEqual(r.targetIndices); // non-decreasing
  });

  it('matches İΑΣ inside a longer string and reports original positions', () => {
    const r = matchSubsequenceKo('İΑΣ', 'xİΑΣ');
    expect(r.ok).toBe(true);
    expect(r.targetIndices).toEqual([1, 1, 2, 3]);
    expect(r.queryIndices).toEqual([0, 0, 1, 2]);
  });
});

describe('score and alignments use folded lengths and original positions', () => {
  it('uses the folded candidate length as the score denominator', () => {
    // query "i" vs candidate "İ" (folds to 2 units): distance 1, denominator 2
    const hits = searchKoRanked('i', ['İ']);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.score).toBeCloseTo(0.5, 9);
  });

  it('keeps score unchanged when folding does not change length', () => {
    const [hit] = searchKoRanked('a', ['ab']);
    expect(hit!.score).toBeCloseTo(0.5, 9);
  });

  it('uses the raw candidate length as the denominator when caseSensitive', () => {
    expect(searchKoRanked('i', ['İ'], { caseSensitive: true })).toEqual([]);
    expect(searchKoRanked('a', ['ab'], { caseSensitive: true })[0]!.score).toBeCloseTo(0.5, 9);
    // raw length 2, distance 1 -> 0.5; folded (3 units) would give 2/3
    expect(searchKoRanked('İ', ['İx'], { caseSensitive: true })[0]!.score).toBeCloseTo(0.5, 9);
    expect(searchKoRanked('İ', ['İx'])[0]!.score).toBeCloseTo(2 / 3, 9);
  });

  it('reports original positions in subsequenceAlignments (duplicates allowed)', () => {
    const [hit] = searchKoDetailed('İ', ['İx']);
    expect(hit!.subsequenceAlignments).toEqual([
      { queryIndex: 0, targetIndex: 0, kind: 'exact' },
      { queryIndex: 0, targetIndex: 0, kind: 'exact' },
    ]);
  });

  it('maps the query position when a later query unit follows an expanded one', () => {
    const [hit] = searchKoDetailed('İx', ['aİbx']);
    expect(hit!.subsequenceAlignments.map((a) => [a.queryIndex, a.targetIndex])).toEqual([
      [0, 1],
      [0, 1],
      [1, 3],
    ]);
  });

  it('keeps alignments inside the original strings for emoji (UTF-16 contract)', () => {
    const [hit] = searchKoDetailed('😀', ['a😀b']);
    expect(hit!.subsequenceAlignments.map((a) => [a.queryIndex, a.targetIndex])).toEqual([
      [0, 1],
      [1, 2],
    ]);
  });

  it('empty folded candidate and empty query still score 1', () => {
    expect(searchKoRanked('', [''])[0]!.score).toBe(1);
  });
});

describe('levenshteinKoTrace original positions', () => {
  it('points expanded units at the original index and keeps distance on the folded strings', () => {
    const t = levenshteinKoTrace('i', 'İ');
    expect(t.distance).toBe(1);
    expect(t.distance).toBe(levenshteinKo('i', 'İ'));
    expect(t.ops).toEqual([
      { kind: 'equal', aIndex: 0, bIndex: 0 },
      { kind: 'insert', bIndex: 0 },
    ]);
  });

  it('keeps every index inside the original strings', () => {
    const a = 'İx';
    const b = 'aİbx';
    const t = levenshteinKoTrace(a, b);
    for (const op of t.ops) {
      if ('aIndex' in op) expect(op.aIndex).toBeLessThan(a.length);
      if ('bIndex' in op) expect(op.bIndex).toBeLessThan(b.length);
    }
  });

  it('maps empty-side traces to original positions of the folded other side', () => {
    expect(levenshteinKoTrace('', 'İ').ops).toEqual([
      { kind: 'insert', bIndex: 0 },
      { kind: 'insert', bIndex: 0 },
    ]);
  });

  it('does not fold or map when caseSensitive; maps delete ops otherwise', () => {
    expect(levenshteinKoTrace('İ', 'i', { caseSensitive: true })).toEqual({
      distance: 1,
      ops: [{ kind: 'replace', aIndex: 0, bIndex: 0 }],
    });
    expect(levenshteinKoTrace('İ', 'i')).toEqual({
      distance: 1,
      ops: [
        { kind: 'equal', aIndex: 0, bIndex: 0 },
        { kind: 'delete', aIndex: 0 },
      ],
    });
  });

  it('is unchanged for caseSensitive and for length-preserving inputs', () => {
    expect(levenshteinKoTrace('가', '각', { caseSensitive: true }).ops).toEqual(
      levenshteinKoTrace('가', '각').ops,
    );
  });
});
