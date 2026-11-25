import { CHOSEONGS, jamo } from './hangul';

export interface Unit {
  /** Character used for comparison. */
  ch: string;
  /** Jamo disassembly of `ch`. */
  j: string;
  /** Source range `[start, end)` in UTF-16 indices. */
  start: number;
  end: number;
  /** First unit of the text, or preceded by whitespace. */
  word: boolean;
}

// Modern NFD syllable (lead, vowel, optional final), or a lone lead consonant. Sticky: matched at one index.
const CONJOINING = /([\u1100-\u1112])(?:([\u1161-\u1175])([\u11a8-\u11c2])?)?/y;

/** Normalize a string into comparison units; queries and candidates share this. */
export function toUnits(text: string): Unit[] {
  const units: Unit[] = [];
  let word = true;
  let end: number;

  const push = (ch: string, j: string, from: number, to: number): void => {
    units.push({ ch, j, start: from, end: to, word });
    word = false;
  };

  for (let start = 0; start < text.length; start = end) {
    let char = String.fromCodePoint(text.codePointAt(start)!);
    end = start + char.length;

    if (/\s/.test(char)) {
      word = true;
      continue;
    }

    CONJOINING.lastIndex = start;
    const match = CONJOINING.exec(text);
    if (match) {
      const [matched, lead, vowel, final] = match;
      const l = lead!.charCodeAt(0) - 0x1100;
      end = start + matched.length;
      char = vowel
        ? String.fromCharCode(
            0xac00 + l * 588 + (vowel.charCodeAt(0) - 0x1161) * 28 + (final ? final.charCodeAt(0) - 0x11a7 : 0)
          )
        : CHOSEONGS[l]!;
    }

    const j = jamo(char);

    // Compatibility consonant clusters (ㄳ…ㅄ) become one unit per consonant.
    if (char >= '\u3131' && char <= '\u314e' && j.length === 2) {
      for (const part of j) push(part, part, start, end);
    } else {
      // `char` is a single code point, so lowercasing is never locale- or context-dependent: 'İ' yields two units.
      for (const lower of char.toLowerCase()) push(lower, jamo(lower), start, end);
    }
  }

  return units;
}

/** One UTF-16 code unit per unit: the first jamo of each. */
export function toKey(units: readonly Unit[]): string {
  return units.map((unit) => unit.j[0]).join('');
}

export interface Match {
  /** 0 exact, 1 prefix, 2 word-start run, 3 inner run, 4 subsequence. */
  grade: 0 | 1 | 2 | 3 | 4;
  /** Query units that matched only partially (unfinished input). */
  partial: number;
  /** Matched candidate unit indices, ascending. */
  positions: number[];
}

const isSyllable = (ch: string): boolean => ch >= '가' && ch <= '힣';
const isHangul = (ch: string): boolean => isSyllable(ch) || (ch >= 'ㄱ' && ch <= 'ㅣ');

/** Number of candidate units (0, 1 or 2) that `q` consumes at `target[p]`; `last` marks the final query unit. */
function consume(q: Unit, target: readonly Unit[], p: number, last: boolean): 0 | 1 | 2 {
  const c = target[p]!;
  if (!isHangul(q.ch) || (isSyllable(q.ch) && !last)) return c.ch === q.ch ? 1 : 0;
  if (c.j.startsWith(q.j)) return 1;

  // The final consonant of the syllable being typed may belong to the next candidate unit: 간 → 가나.
  const d = target[p + 1];
  const hasFinal = isSyllable(q.ch) && (q.ch.charCodeAt(0) - 0xac00) % 28 !== 0;
  return hasFinal && isSyllable(c.ch) && c.j === q.j.slice(0, -1) && d && isHangul(d.ch) && d.j[0] === q.j.at(-1)
    ? 2
    : 0;
}

/** Ranking order between matches: grade, partial, window length, start. */
function compareMatches(a: Match, b: Match): number {
  const width = (m: Match): number => m.positions.at(-1)! - m.positions[0]!;
  return a.grade - b.grade || a.partial - b.partial || width(a) - width(b) || a.positions[0]! - b.positions[0]!;
}

/** Match each query unit at its start position; null if any unit fails there. */
function evaluate(query: readonly Unit[], target: readonly Unit[], starts: readonly number[]) {
  let partial = 0;
  const positions: number[] = [];

  for (const [i, q] of query.entries()) {
    const p = starts[i]!;
    const used = consume(q, target, p, i === query.length - 1);
    if (!used) return null;
    if (used === 2 || target[p]!.ch !== q.ch) partial++;
    positions.push(p);
    if (used === 2) positions.push(p + 1);
  }

  return { partial, positions };
}

/** Best match of a non-empty query against one candidate: contiguous if possible, otherwise subsequence. */
export function matchUnits(
  query: readonly Unit[],
  queryKey: string,
  target: readonly Unit[],
  targetKey: string
): Match | null {
  const m = query.length;
  if (m > target.length) return null;

  let best: Match | null = null;
  for (let s = targetKey.indexOf(queryKey); s >= 0; s = targetKey.indexOf(queryKey, s + 1)) {
    // Equal keys are not enough (shared jamo or surrogate lead), so every unit is verified.
    const found = evaluate(
      query,
      target,
      query.map((_, i) => s + i)
    );
    if (!found) continue;

    const exact = found.partial === 0 && found.positions.length === target.length;
    const grade = s === 0 ? (exact ? 0 : 1) : target[s]!.word ? 2 : 3;
    const match: Match = { grade, ...found };
    if (!best || compareMatches(match, best) < 0) best = match;
  }
  if (best) return best;

  // Greedy subsequence: the earliest position for each query unit.
  const positions: number[] = [];
  let from = 0;
  for (const [i, q] of query.entries()) {
    let p = targetKey.indexOf(queryKey[i]!, from);
    while (p >= 0 && !consume(q, target, p, i === m - 1)) p = targetKey.indexOf(queryKey[i]!, p + 1);
    if (p < 0) return null;
    positions.push(p);
    from = p + 1;
  }

  // Keep the last position and pull the earlier ones as far right as they go.
  for (let i = m - 2; i >= 0; i--) {
    for (let p = positions[i + 1]! - 1; p > positions[i]!; p--) {
      if (consume(query[i]!, target, p, false)) {
        positions[i] = p;
        break;
      }
    }
  }

  return { grade: 4, ...evaluate(query, target, positions)! };
}

/** [start, end) — 원문 UTF-16 인덱스. 오름차순, 겹침·인접 없음. */
export type Range = readonly [start: number, end: number];

/** One match; array order is the ranking. */
export interface SearchResult<T> {
  item: T; // 넘겨준 객체 그대로
  index: number; // items 안의 위치
  ranges: Range[]; // key(item) 문자열 기준. 빈 검색어면 []
}

/** Options of `createSearcher`. */
export interface SearcherOptions<T> {
  key: (item: T) => string;
}

/** Options of a single search. */
export interface SearchOptions {
  limit?: number; // 생략하면 전부, 0 이하면 []
}

/** Searches the preprocessed items. */
export type Searcher<T> = (query: string, options?: SearchOptions) => SearchResult<T>[];

/** Merge the source ranges of the matched units; touching or overlapping ranges become one. */
function toRanges(units: readonly Unit[], positions: readonly number[]): Range[] {
  const ranges: [number, number][] = [];
  for (const p of positions) {
    const { start, end } = units[p]!;
    const previous = ranges.at(-1);
    if (previous && start <= previous[1]) previous[1] = end;
    else ranges.push([start, end]);
  }
  return ranges;
}

/** Preprocess `items` once and return a function that ranks them against a query. */
export function createSearcher<T extends string>(items: readonly T[]): Searcher<T>;
export function createSearcher<T>(items: readonly T[], options: SearcherOptions<T>): Searcher<T>;
export function createSearcher<T>(items: readonly T[], options?: SearcherOptions<T>): Searcher<T> {
  const select = options?.key ?? ((item: T) => item as string);
  const entries = items.map((item, index) => {
    const units = toUnits(select(item));
    return { item, index, units, key: toKey(units) };
  });

  return (query, { limit } = {}) => {
    const take = <E>(list: E[]): E[] => (limit === undefined ? list : list.slice(0, Math.max(0, limit)));
    const units = toUnits(query);
    if (!units.length) return take(entries).map(({ item, index }) => ({ item, index, ranges: [] }));

    const key = toKey(units);
    const hits = entries.flatMap((entry) => {
      const match = matchUnits(units, key, entry.units, entry.key);
      return match ? [{ entry, match }] : [];
    });
    // The sort is stable, so equal hits keep the original item order.
    hits.sort((a, b) => compareMatches(a.match, b.match) || a.entry.units.length - b.entry.units.length);

    return take(hits).map(({ entry: { item, index, units }, match }) => ({
      item,
      index,
      ranges: toRanges(units, match.positions),
    }));
  };
}

/** A slice of the text, flagged when it is part of a match. */
export interface HighlightPart {
  text: string;
  match: boolean;
}

/** Split `text` into matched and unmatched parts along `ranges`. */
export function highlight(text: string, ranges: readonly Range[]): HighlightPart[] {
  const parts: HighlightPart[] = [];
  const push = (from: number, to: number, match: boolean): void => {
    if (to > from) parts.push({ text: text.slice(from, to), match });
  };

  let last = 0;
  for (const [start, end] of ranges) {
    push(last, start, false);
    push(start, end, true);
    last = end;
  }
  push(last, text.length, false);

  return parts;
}
