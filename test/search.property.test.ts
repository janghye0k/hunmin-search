import fc from 'fast-check';
import { expect, it } from 'vitest';
import { getChoseong } from '../src/hangul';
import { createSearcher, highlight, matchUnits, toKey, toUnits } from '../src/search';

const keys = 'rRseEfaqQtTdwWczxvgkoiOjpuPhynbml';
const letters = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ';
const leading = [...'rRseEfaqQtTdwWczxvg'];
const vowels = 'k o i O j p u P h hk ho hl y n nj np nl b m ml l'.split(' ');
const finals = ['', ...'r R rt s sw sg e f fr fa fq ft fx fv fg a q qt t T d w c z x v g'.split(' ')];
const compatibility = (key: string) => letters[keys.indexOf(key)];
const syllable = (l: number, v: number, t: number) => String.fromCharCode(0xac00 + (l * 21 + v) * 28 + t);

const syllableIndices = fc.tuple(
  fc.integer({ min: 0, max: 18 }),
  fc.integer({ min: 0, max: 20 }),
  fc.integer({ min: 0, max: 27 })
);
type SyllableIndices = [leading: number, vowel: number, final: number];
const words = fc.array(syllableIndices, { minLength: 1, maxLength: 5 });
const renderWord = (word: SyllableIndices[]) => word.map(([l, v, t]) => syllable(l, v, t)).join('');

function composingPrefixes(word: SyllableIndices[]): string[] {
  const keystrokes = word.map(([l, v, t]) => leading[l] + vowels[v] + finals[t]).join('');
  let committed = '';
  let onset = '';
  let vowel = '';
  let final = '';
  const render = () =>
    vowel ? syllable(leading.indexOf(onset), vowels.indexOf(vowel), finals.indexOf(final)) : compatibility(onset);

  return [...keystrokes].map((key) => {
    if (leading.includes(key)) {
      if (vowel && finals.includes(final + key)) {
        final += key;
      } else {
        if (onset) committed += render();
        [onset, vowel, final] = [key, '', ''];
      }
    } else if (final) {
      const moved = final.slice(-1);
      final = final.slice(0, -1);
      committed += render();
      [onset, vowel, final] = [moved, key, ''];
    } else {
      vowel += key;
    }
    return committed + render();
  });
}

it('finds every two-set composing prefix', () => {
  fc.assert(
    fc.property(words, (indices) => {
      const word = renderWord(indices);
      const prefixes = composingPrefixes(indices);
      expect(prefixes.at(-1)).toBe(word);
      const search = createSearcher([word]);
      for (const state of prefixes) expect(search(state)[0]?.item).toBe(word);
    }),
    { numRuns: 500 }
  );

  for (const [query, word] of [
    ['앉', '안자'],
    ['닭', '달가'],
    ['고', '과'],
    ['ㄳ', '검색'],
  ]) {
    expect(createSearcher([word])(query)[0]?.item).toBe(word);
  }
  expect(createSearcher(['까'])('ㄱ')).toEqual([]);
});

it('finds the full choseong query', () => {
  fc.assert(
    fc.property(words, (indices) => {
      const word = renderWord(indices);
      expect(createSearcher([word])(getChoseong(word))[0]?.item).toBe(word);
    }),
    { numRuns: 500 }
  );
});

const oracleTokens = fc.constantFrom(
  '가',
  '각',
  '간',
  '나',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㅘ',
  'x',
  'İ',
  '😀',
  '😁',
  '\uD83D',
  '\uDE00',
  ' '
);
const oracleCandidates = fc.array(oracleTokens, { maxLength: 8 });

const perturbedOracleCases = fc
  .tuple(
    fc.array(fc.constantFrom('x', 'İ', '😀', '😁', ' '), { maxLength: 3 }),
    fc.constantFrom('가', '각', '간'),
    fc.constantFrom('ㄱ', '가', '각', '간'),
    fc.constantFrom('가', '나', 'ㄱ', 'x', ''),
    fc.boolean()
  )
  .chain(([before, anchor, replacement, next, keepNext]) =>
    fc.subarray(before).map(
      (picked) =>
        [
          [...picked, replacement, ...(keepNext && next ? [next] : [])],
          [...before, anchor, ...(next ? [next] : [])],
        ] as const
    )
  );

const oracleCases = fc.oneof(
  fc.tuple(fc.array(oracleTokens, { maxLength: 5 }), oracleCandidates),
  oracleCandidates.chain((candidate) =>
    fc.tuple(fc.subarray(candidate, { maxLength: Math.min(5, candidate.length) }), fc.constant(candidate))
  ),
  perturbedOracleCases
);

type OracleUnit = { ch: string; jamo: string; kind: 'syllable' | 'compatibility' | 'other' };
const oracleSyllables = new Map([
  ['가', 'ㄱㅏ'],
  ['각', 'ㄱㅏㄱ'],
  ['간', 'ㄱㅏㄴ'],
  ['나', 'ㄴㅏ'],
  ['낙', 'ㄴㅏㄱ'],
]);

// The oracle only needs normalization rules reachable from oracleTokens.
function oracleUnits(text: string): OracleUnit[] {
  return [...text].flatMap((ch): OracleUnit[] => {
    if (/\s/u.test(ch)) return [];
    const jamo = oracleSyllables.get(ch);
    if (jamo) return [{ ch, jamo, kind: 'syllable' }];
    if (ch === 'ㄳ') return [...'ㄱㅅ'].map((part) => ({ ch: part, jamo: part, kind: 'compatibility' }));
    if (ch === 'ㄱ' || ch === 'ㄲ' || ch === 'ㄴ' || ch === 'ㅘ') {
      return [{ ch, jamo: ch === 'ㅘ' ? 'ㅗㅏ' : ch, kind: 'compatibility' }];
    }
    return [...ch.toLowerCase()].map((part) => ({ ch: part, jamo: part, kind: 'other' }));
  });
}

function oraclePaths(query: string, text: string) {
  const queries = oracleUnits(query);
  const candidates = oracleUnits(text);

  function* choose(
    queryIndex: number,
    start: number,
    positions: number[],
    partial: number
  ): Generator<{ positions: number[]; partial: number }> {
    if (queryIndex === queries.length) {
      yield { positions, partial };
      return;
    }
    const q = queries[queryIndex];
    const last = queryIndex === queries.length - 1;
    for (let index = start; index < candidates.length; index++) {
      const c = candidates[index];
      const single =
        q.kind === 'compatibility' || (q.kind === 'syllable' && last) ? c.jamo.startsWith(q.jamo) : c.ch === q.ch;
      if (single) {
        yield* choose(queryIndex + 1, index + 1, [...positions, index], partial + Number(q.ch !== c.ch));
      }

      const d = candidates[index + 1];
      if (
        !single &&
        last &&
        q.kind === 'syllable' &&
        q.jamo.length === 3 &&
        c.kind === 'syllable' &&
        c.jamo === q.jamo.slice(0, -1) &&
        d &&
        d.kind !== 'other' &&
        d.jamo.startsWith(q.jamo.slice(-1))
      )
        yield { positions: [...positions, index, index + 1], partial: partial + 1 };
    }
  }

  return choose(0, 0, [], 0);
}

it('agrees with exhaustive subsequence existence', () => {
  fc.assert(
    fc.property(oracleCases, ([query, candidate]) => {
      const q = query.join('');
      const text = candidate.join('');
      expect(createSearcher([text])(q).length > 0).toBe(!oraclePaths(q, text).next().done);
    }),
    { numRuns: 500 }
  );
});

it('returns a valid subsequence path with the exhaustive optimum', () => {
  const token = fc.constantFrom('가', '나', '낙', '간', 'ㄴ', 'x');
  const candidates = fc.array(token, { minLength: 1, maxLength: 10 });
  const queries = fc.array(token, { minLength: 1, maxLength: 4 });
  let competingCases = 0;
  fc.assert(
    fc.property(
      fc.oneof(
        fc.tuple(queries, candidates),
        candidates.chain((candidate) =>
          fc.tuple(
            fc.subarray(candidate, { minLength: 1, maxLength: Math.min(4, candidate.length) }),
            fc.constant(candidate)
          )
        )
      ),
      ([query, candidate]) => {
        const paths = [...oraclePaths(query.join(''), candidate.join(''))];
        if (paths.some(({ positions }) => positions.every((p, i) => p === positions[0] + i))) return;
        const q = toUnits(query.join(''));
        const t = toUnits(candidate.join(''));
        const match = matchUnits(q, toKey(q), t, toKey(t));
        if (!paths.length) {
          expect(match).toBeNull();
          return;
        }
        if (paths.length > 1) competingCases++;
        expect(match?.grade).toBe(4);
        const score = ({ positions, partial }: (typeof paths)[number]) =>
          [partial, positions.at(-1)! - positions[0], positions[0]] as const;
        const [best] = paths.sort((a, b) => {
          const [ap, aw, as] = score(a);
          const [bp, bw, bs] = score(b);
          return ap - bp || aw - bw || as - bs;
        });
        const returned = paths.find(({ positions }) => positions.join(',') === match?.positions.join(','));
        expect(returned).toBeDefined();
        expect(returned?.partial).toBe(match?.partial);
        expect(score(returned!)).toEqual(score(best));
      }
    ),
    { seed: 42, numRuns: 2_000 }
  );
  expect(competingCases).toBeGreaterThan(0);
});

const mixedText = fc.array(
  fc.constantFrom('한', '글'.normalize('NFD'), '😀', '👩‍💻', 'e\u0301', 'ㄳ', 'İ', '\t', '\u00a0'),
  { maxLength: 6 }
);
const successfulCases = fc.tuple(
  mixedText,
  fc.constantFrom(
    ['한👩‍💻e\u0301', '한👩‍💻e\u0301'],
    ['한'.normalize('NFD') + '\t😀\u00a0İ', '한😀i\u0307'],
    ['ㄳ\u00a0👩‍💻', 'ㄱㅅ👩'],
    ['e\u0301\t가\u00a0나', 'e\u0301간'],
    ['👩‍💻\t과', '👩고'],
    ['\t😀\u00a0', '😀']
  ),
  mixedText
);

function splitsSurrogates(text: string, index: number): boolean {
  const left = text.charCodeAt(index - 1);
  const right = text.charCodeAt(index);
  return left >= 0xd800 && left <= 0xdbff && right >= 0xdc00 && right <= 0xdfff;
}

it('returns bounded, ordered UTF-16 ranges', () => {
  fc.assert(
    fc.property(successfulCases, ([before, [match, query], after]) => {
      const text = [...before, match, ...after].join('');
      const [hit] = createSearcher([text])(query);
      expect(hit.ranges.length).toBeGreaterThan(0);
      let previousEnd = -1;
      for (const [s, e] of hit.ranges) {
        expect(0 <= s && s < e && e <= text.length && previousEnd < s).toBe(true);
        expect(splitsSurrogates(text, s)).toBe(false);
        expect(splitsSurrogates(text, e)).toBe(false);
        previousEnd = e;
      }
    }),
    { numRuns: 500 }
  );
});

it('highlights only the returned original slices', () => {
  fc.assert(
    fc.property(successfulCases, ([before, [match, query], after]) => {
      const text = [...before, match, ...after].join('');
      const [{ ranges }] = createSearcher([text])(query);
      const parts = highlight(text, ranges);
      expect(parts.map((p) => p.text).join('')).toBe(text);
      expect(parts.every((p) => p.text.length > 0)).toBe(true);
      expect(parts.filter((p) => p.match).map((p) => p.text)).toEqual(ranges.map(([s, e]) => text.slice(s, e)));
    }),
    { numRuns: 500 }
  );
});

it('is invariant under adjacent Hangul decomposition', () => {
  fc.assert(
    fc.property(words, (indices) => {
      const word = renderWord(indices);
      const nfcSearch = createSearcher([word]);
      const nfdSearch = createSearcher([word.normalize('NFD')]);
      for (const q of [...composingPrefixes(indices), getChoseong(word), 'x']) {
        expect(nfcSearch(q).map((h) => h.index)).toEqual(nfdSearch(q).map((h) => h.index));
      }
    }),
    { numRuns: 500 }
  );
});

const mixedCodePoints = fc.oneof(
  syllableIndices.map(([l, v, t]) => syllable(l, v, t)),
  fc.constantFrom('x', 'X', 'i', 'İ', '😀', '😁')
);
const mixedWord = fc.array(mixedCodePoints, { maxLength: 8 });
const spacing = fc.constantFrom('', ' ', '\t', '\u00a0');
const whitespaceCases = fc.array(mixedWord, { minLength: 1, maxLength: 6 }).chain((candidates) =>
  fc.tuple(
    fc.constant(candidates),
    fc.oneof(
      mixedWord,
      fc.constantFrom(...candidates).chain((words) => fc.subarray(words))
    ),
    fc.array(spacing, { minLength: 9, maxLength: 9 })
  )
);

it('ignores whitespace without reordering query results', () => {
  fc.assert(
    fc.property(whitespaceCases, ([candidates, queryPoints, spaces]) => {
      const insertSpaces = (points: string[]) =>
        points.map((point, index) => spaces[index] + point).join('') + spaces[points.length];
      const query = queryPoints.join('');
      const search = createSearcher(candidates.map((points) => points.join('')));
      expect(search(insertSpaces(queryPoints))).toEqual(search(query));

      const spacedSearch = createSearcher(candidates.map(insertSpaces));
      expect(
        spacedSearch(query)
          .map((h) => h.index)
          .sort((a, b) => a - b)
      ).toEqual(
        search(query)
          .map((h) => h.index)
          .sort((a, b) => a - b)
      );
    }),
    { numRuns: 500 }
  );
});

it('preserves index for equal keys and slices by limit', () => {
  fc.assert(
    fc.property(
      words,
      fc.array(fc.boolean(), { maxLength: 12 }),
      fc.boolean(),
      fc.integer({ min: 0, max: 16 }),
      (indices, mix, useChoseong, k) => {
        const key = renderWord(indices);
        const items = [true, false, ...mix, true].map((duplicate) => ({ key: duplicate ? key : key + 'x' }));
        const search = createSearcher(items, { key: (item) => item.key });
        const q = useChoseong ? getChoseong(key) : key;
        const hits = search(q);
        expect(hits.filter((h) => h.item.key === key).map((h) => h.index)).toEqual(
          items.flatMap((item, index) => (item.key === key ? [index] : []))
        );
        expect(search(q, { limit: k })).toEqual(hits.slice(0, k));
      }
    ),
    { numRuns: 500 }
  );
});
