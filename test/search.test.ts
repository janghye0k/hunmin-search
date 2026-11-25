import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createSearcher, highlight, matchUnits, toKey, toUnits, type Searcher } from '../src/search';

const unit = (ch: string, j: string, start: number, end: number, word = false) => ({ ch, j, start, end, word });
const chars = (text: string) => toUnits(text).map((u) => u.ch);

describe('toUnits', () => {
  it('skips whitespace and marks the next unit as a word start', () => {
    expect(toUnits(' 홍 \t길동')).toEqual([
      unit('홍', 'ㅎㅗㅇ', 1, 2, true),
      unit('길', 'ㄱㅣㄹ', 4, 5, true),
      unit('동', 'ㄷㅗㅇ', 5, 6),
    ]);
    expect(toUnits('')).toEqual([]);
    expect(toUnits(' \n ')).toEqual([]);
  });

  it('composes adjacent NFD syllables and keeps original offsets', () => {
    expect(toUnits('값가'.normalize('NFD'))).toEqual([unit('값', 'ㄱㅏㅂㅅ', 0, 3, true), unit('가', 'ㄱㅏ', 3, 5)]);
  });

  it.each([
    ['lone leading consonant becomes compatibility jamo', 'ᄀ', ['ㄱ']],
    ['lone vowel stays', 'ᅡ', ['ᅡ']],
    ['lone final stays', 'ᆨ', ['ᆨ']],
    ['whitespace blocks composition', 'ᄀ ᅡ', ['ㄱ', 'ᅡ']],
    ['precomposed syllable does not absorb a final', '각', ['가', 'ᆨ']],
    ['no whole-string normalization', 'é', ['e', '́']],
  ])('%s', (_name, text, expected) => {
    expect(chars(text)).toEqual(expected);
  });

  it('splits compatibility consonant clusters but not tense consonants', () => {
    expect(toUnits('ㄳ')).toEqual([unit('ㄱ', 'ㄱ', 0, 1, true), unit('ㅅ', 'ㅅ', 0, 1)]);
    expect(chars('ㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ')).toHaveLength(20);
    expect(chars('ㄲㄸㅃㅆㅉㅘ')).toEqual(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅘ']);
  });

  it('lowercases per code point', () => {
    expect(toUnits('İx')).toEqual([unit('i', 'i', 0, 1, true), unit('̇', '̇', 0, 1), unit('x', 'x', 1, 2)]);
    expect(chars('ΟΣς')).toEqual(['ο', 'σ', 'ς']);
  });

  it('keeps a surrogate pair in one unit and a lone surrogate as is', () => {
    expect(toUnits('😀A')).toEqual([unit('😀', '😀', 0, 2, true), unit('a', 'a', 2, 3)]);
    expect(chars('\ud83d')).toEqual(['\ud83d']);
  });

  it('builds a key with exactly one code unit per unit', () => {
    expect(toKey(toUnits('홍길 a😀ㅘ'))).toBe('ㅎㄱa\ud83dㅗ');
  });
});

function match(query: string, target: string) {
  const q = toUnits(query);
  const t = toUnits(target);
  return matchUnits(q, toKey(q), t, toKey(t));
}

describe('matchUnits: unit rules', () => {
  it.each([
    ['ㅎㄱㄷ', '홍길동', [0, 1, 2]],
    ['ㄲ', '까', [0]],
    ['ㄳ', '검색', [0, 1]],
    ['고', '과', [0]],
    ['우', '원', [0]],
    ['으', '의', [0]],
    ['달', '닭', [0]],
    ['갑', '값', [0]],
    ['달', '다람쥐', [0, 1]],
    ['갑', '가방', [0, 1]],
    ['고', '과자', [0]],
    ['ㄳ', '감사', [0, 1]],
    ['간', '가나', [0, 1]],
    ['바난', '바나나', [0, 1, 2]],
    ['읫', '의사', [0, 1]],
    ['닭', '달가', [0, 1]],
    ['값', '갑사', [0, 1]],
    ['값', '갑 사', [0, 1]],
    ['간', '가ㄴ', [0, 1]],
    ['홍ㄱ', '홍길동', [0, 1]],
    ['😀', 'a😀b', [1]],
    ['👩', '👩‍💻', [0]],
    ['ㅘ', 'ㅘ', [0]],
    ['ABC', 'abc', [0, 1, 2]],
    ['İ', 'İx', [0, 1]],
    ['길'.normalize('NFD'), '홍길동', [1]],
    ['길', '홍길동'.normalize('NFD'), [1]],
  ])('%s matches %s', (query, target, positions) => {
    expect(match(query, target)?.positions).toEqual(positions);
  });

  it.each([
    ['ㄱ', '까'],
    ['ㄱㄱ', 'ㄲ'],
    ['ㄲ', '가'],
    ['하ㄱ', '한글'],
    ['ㅏ', '가'],
    ['간', '가'],
    ['간', '가마'],
    ['간', '가a'],
    ['가', '나'],
    ['😀', '😁\u{1fa00}'],
    ['\ud83d', '😀'],
    ['ος', 'ΟΣ'],
    ['abc', 'ab'],
    ['길홍', '홍길동'],
    ['홍길덩', '홍길동'],
    // an unfinished earlier syllable (editing mid-word) does not match
    ['호길동', '홍길동'],
    // broken halves never match a whole emoji
    ['😀', '\ud83d \ude00'],
  ])('%s does not match %s', (query, target) => {
    expect(match(query, target)).toBeNull();
  });
});

describe('matchUnits: grade, partial and window', () => {
  it.each([
    ['홍길동', '홍길동', 0, 0, [0, 1, 2]],
    ['홍길', '홍길동', 1, 0, [0, 1]],
    ['호', '홍', 1, 1, [0]],
    ['간', '가나', 1, 1, [0, 1]],
    ['길동', '우리 길동', 2, 0, [2, 3]],
    ['길동', '홍길동', 3, 0, [1, 2]],
    ['홍동', '홍길동', 4, 0, [0, 2]],
    ['ㅎㄷ', '홍길동', 4, 2, [0, 2]],
    // grade beats exactness: the earlier partial window wins
    ['가', '강가', 1, 1, [0]],
    // same grade: the exact window wins over an earlier partial one
    ['가', 'x강x가', 3, 0, [3]],
    // same grade and partial: the earlier start wins
    ['가', 'x가가', 3, 0, [1]],
    // a later word start beats an earlier mid-word window
    ['가', 'x가 가', 2, 0, [2]],
    // subsequence is tightened from the back
    ['가다', '가x가x다', 4, 0, [2, 4]],
    // dokkaebi inside a subsequence keeps its two units adjacent
    ['홍간', '홍x가나', 4, 1, [0, 2, 3]],
  ])('%s in %s → grade %i, partial %i', (query, target, grade, partial, positions) => {
    expect(match(query, target)).toEqual({ grade, partial, positions });
  });
});

describe('createSearcher', () => {
  const ranked = (query: string, items: string[]) => createSearcher(items)(query).map((r) => r.item);

  it.each([
    ['호', ['강호동', '홍길동', '홍기'], ['홍기', '홍길동', '강호동']],
    ['길동', ['가길나동', '홍길동', '우리 길동', '길동이네'], ['길동이네', '우리 길동', '홍길동', '가길나동']],
    ['홍길동', ['홍길동전', '홍길동'], ['홍길동', '홍길동전']],
    ['가', ['나가', '가'], ['가', '나가']],
    ['홍동', ['홍길동', '홍동'], ['홍동', '홍길동']],
    ['ab', ['axxb', 'axb'], ['axb', 'axxb']],
    ['a', ['a2', 'a1'], ['a2', 'a1']],
  ])('ranks %s', (query, items, expected) => {
    expect(ranked(query, items)).toEqual(expected);
  });

  it.each([
    [
      '홍길',
      '홍 길동',
      [
        [0, 1],
        [2, 3],
      ],
    ],
    ['홍길', '홍길동', [[0, 2]]],
    ['간', '가나', [[0, 2]]],
    ['ㄱ', '길', [[0, 1]]],
    ['ㄳ', 'ㄳ', [[0, 1]]],
    ['ㅎㄱ', '홍길동'.normalize('NFD'), [[0, 6]]],
    ['😀', 'a😀b', [[1, 3]]],
    ['👩', '👩‍💻', [[0, 2]]],
    [
      'İx',
      'aİbx',
      [
        [1, 2],
        [3, 4],
      ],
    ],
    ['가', '강가', [[0, 1]]],
    // trailing whitespace keeps the last syllable composing
    ['간 ', '가나', [[0, 2]]],
  ])('returns ranges for %s in %s', (query, item, ranges) => {
    expect(createSearcher([item])(query)[0]?.ranges).toEqual(ranges);
  });

  it('ignores whitespace in the query', () => {
    const search = createSearcher(['홍길동', '서울']);
    expect(search(' 홍 길 ')).toEqual(search('홍길'));
  });

  it.each(['', '   '])('returns every item in original order for an empty query %j', (query) => {
    expect(createSearcher(['b', '', 'a'])(query)).toEqual([
      { item: 'b', index: 0, ranges: [] },
      { item: '', index: 1, ranges: [] },
      { item: 'a', index: 2, ranges: [] },
    ]);
  });

  it.each([
    ['', undefined, 3],
    ['', 2, 2],
    ['', 0, 0],
    ['', -1, 0],
    ['a', undefined, 3],
    ['a', 2, 2],
    ['a', 0, 0],
    ['a', -1, 0],
    ['a', 10, 3],
    ['a', Infinity, 3],
    ['a', 2.7, 2],
    ['a', NaN, 0],
  ])('query %j with limit %s returns %i results', (query, limit, count) => {
    expect(createSearcher(['a', 'ab', 'abc'])(query, { limit })).toHaveLength(count);
  });

  it('applies the limit after ranking', () => {
    expect(createSearcher(['xa', 'a'])('a', { limit: 1 }).map((r) => r.item)).toEqual(['a']);
  });

  it('does not return an empty-string item for a non-empty query', () => {
    expect(createSearcher(['', 'a'])('a').map((r) => r.index)).toEqual([1]);
  });

  it('returns an empty array for no items and no match', () => {
    expect(createSearcher([])('a')).toEqual([]);
    expect(createSearcher(['가'])('나')).toEqual([]);
  });

  it('calls key once per item, keeps references and copies the array', () => {
    const items = [{ name: '홍길동' }, { name: '서울' }];
    const first = items[0]!;
    const key = vi.fn((item: { name: string }) => item.name);
    const search = createSearcher(items, { key });
    items.length = 0;
    search('홍');
    const [hit] = search('ㅎ');
    expect(key).toHaveBeenCalledTimes(2);
    expect(hit?.item).toBe(first);
    expect(hit?.index).toBe(0);
    expect(search('')).toHaveLength(2);
  });

  it('types item from the array or the key selector', () => {
    const users: readonly { name: string }[] = [{ name: '가' }];
    expectTypeOf(createSearcher(users, { key: (u) => u.name })).toEqualTypeOf<Searcher<{ name: string }>>();
    expectTypeOf(createSearcher(['a', 'b'] as const)).toEqualTypeOf<Searcher<'a' | 'b'>>();
    // @ts-expect-error objects need a key selector
    const missingKey = () => createSearcher(users);
    expect(missingKey).toBeTypeOf('function');
  });
});

describe('highlight', () => {
  it.each([
    [
      '홍 길동',
      [
        [0, 1],
        [2, 3],
      ],
      [
        ['홍', true],
        [' ', false],
        ['길', true],
        ['동', false],
      ],
    ],
    [
      '홍길동',
      [[1, 3]],
      [
        ['홍', false],
        ['길동', true],
      ],
    ],
    ['홍길동', [[0, 3]], [['홍길동', true]]],
    ['홍길동', [], [['홍길동', false]]],
    ['', [], []],
  ] as [string, [number, number][], [string, boolean][]][])('splits %j by %j', (text, ranges, expected) => {
    expect(highlight(text, ranges)).toEqual(expected.map(([part, matched]) => ({ text: part, match: matched })));
  });
});
