# Search API

Sources: [`src/search.ts`](../../src/search.ts), [`src/hangul.ts`](../../src/hangul.ts)

## Types and signatures

```ts
export type Range = readonly [start: number, end: number];

export interface SearchResult<T> {
  item: T;
  index: number;
  ranges: Range[];
}

export interface SearcherOptions<T> {
  key: (item: T) => string;
}

export interface SearchOptions {
  limit?: number;
}

export type Searcher<T> = (query: string, options?: SearchOptions) => SearchResult<T>[];

export function createSearcher<T extends string>(items: readonly T[]): Searcher<T>;
export function createSearcher<T>(items: readonly T[], options: SearcherOptions<T>): Searcher<T>;

export interface HighlightPart {
  text: string;
  match: boolean;
}

export function highlight(text: string, ranges: readonly Range[]): HighlightPart[];

export function getChoseong(text: string): string;
export function disassemble(text: string): string;
```

## Contracts

- `createSearcher` calls `key` once per item to preprocess it, and shallow-copies the array. Create a new searcher when the list changes. Omit `key` for an array of strings.
- `SearchResult.item` is the object you passed in, and `index` is its position in `items`.
- `ranges` are `[start, end)` UTF-16 indices into `key(item)`, ascending, never overlapping or touching. They are `[]` for an empty query.
- Omitting `limit` returns everything; `0` or less returns `[]`.
- No score or match kind is returned. The order is the ranking.
- `highlight` produces no empty parts, and joining the parts gives back the text. It expects `ranges` made by a searcher and does not validate them.

## Examples

```ts
import { createSearcher, highlight } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('ㅎㄱ');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
highlight('홍길동', [[0, 2]]);
// [{ text: '홍길', match: true }, { text: '동', match: false }]
```

### Vanilla

```ts
const search = createSearcher(users, { key: (u) => u.name });
input.addEventListener('input', () => {
  list.replaceChildren(
    ...search(input.value, { limit: 20 }).map(({ item, ranges }) => {
      const li = document.createElement('li');
      for (const part of highlight(item.name, ranges)) {
        const node = document.createElement(part.match ? 'mark' : 'span');
        node.textContent = part.text; // never use innerHTML
        li.append(node);
      }
      return li;
    })
  );
});
```

### React

```tsx
function UserSearch({ users }: { users: readonly User[] }) {
  const [query, setQuery] = useState('');
  const search = useMemo(() => createSearcher(users, { key: (u) => u.name }), [users]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {search(query, { limit: 20 }).map(({ item, ranges }) => (
          <li key={item.id}>
            {highlight(item.name, ranges).map((p, i) => (p.match ? <mark key={i}>{p.text}</mark> : p.text))}
          </li>
        ))}
      </ul>
    </>
  );
}
```

- Keep the `users` reference stable. Create a new searcher when the list changes.
- With `limit` and a list of about ten thousand short items or fewer, debounce is usually unnecessary. For larger lists or other conditions, measure with your own data.
- In Vue, `v-model` is not updated during composition, so use `@input`.

## Matching by input state

Whitespace in the query and the items is ignored, and so is case. A complete syllable in the query counts as unfinished only when it is the last character; earlier syllables must be identical. A compatibility jamo (`ㄱ`, `ㅘ`, …) matches by prefix at any position.

| Input state | Example |
|---|---|
| Choseong | `ㅎㄱㄷ` → 홍길동 |
| Tense consonants are distinct | `ㄱ` ✗ 까, `ㄲ` ✓ 까, `ㄱㄱ` ✗ ㄲ |
| Consonant cluster | `ㄳ` → 검색 |
| Compound vowel in progress | `고` → 과, `우` → 원, `으` → 의 |
| Compound final in progress | `달` → 닭, `갑` → 값 |
| Final moving to the next syllable | `간` → 가나, `바난` → 바나나, `읫` → 의사, `닭` → 달가, `값` → 갑사 (whitespace in between is allowed) |
| Earlier syllables are final | `하ㄱ` ✗ 한글 |
| Lone vowel | `ㅏ` does not match a syllable |
| Emoji | The whole code point must be equal; half a surrogate pair never matches. Highlighting a whole ZWJ sequence is not guaranteed (`👩` → `👩‍💻` gives `[0, 2]`) |

## Ranking

These are compared in order, and an earlier one wins.

1. Grade: exact (every character exact, whole item) · prefix · run starting at a word · run inside a word · match with gaps (subsequence)
2. Number of partially matched query characters
3. Span from the first match to the last
4. Match start position
5. Item length (not counting whitespace)
6. Original order

The grade outranks exactness. For example, searching `강가` with `가` reads it as `강` in progress and highlights the leading `강`. Exactness only counts within the same grade. A match with gaps is looked for only when there is no contiguous one.

If an item has several matches with gaps, the search picks the one with the fewest partial matches, then the narrowest span, then the earliest start. For example, searching `가x낙 가y나` with `가나` highlights the later **가**y**나** because both characters match exactly.

## Empty query and highlighting

- An empty or whitespace-only query returns every item in original order with `ranges: []`. `limit` still applies.
- `ranges` collect the source ranges of the matched characters and merge those that overlap or touch. A partially matched syllable is highlighted whole, and ignored whitespace is not highlighted (`홍길` → `홍 길동`: `[0, 1]`, `[2, 3]`).

## `getChoseong`, `disassemble`

`getChoseong` keeps only initial consonants (and whitespace); `disassemble` splits complete syllables and compound jamo into compatibility jamo.

```ts
import { disassemble, getChoseong } from 'hunmin-search';

getChoseong('띄어 쓰기') === 'ㄸㅇ ㅆㄱ';
disassemble('값') === 'ㄱㅏㅂㅅ';
```
