# 검색 API

소스: [`src/search.ts`](../../src/search.ts), [`src/hangul.ts`](../../src/hangul.ts)

## 타입과 시그니처

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

## 계약

- `createSearcher`는 항목마다 `key`를 한 번 호출해 전처리하고 배열을 얕게 복사합니다. 목록이 바뀌면 다시 만드세요. 문자열 배열이면 `key`를 생략합니다.
- `SearchResult.item`은 넘겨준 객체 그대로이고, `index`는 `items` 안의 위치입니다.
- `ranges`는 `key(item)` 문자열 기준의 `[start, end)` UTF-16 인덱스입니다. 오름차순이며 겹치거나 맞닿지 않습니다. 빈 검색어면 `[]`입니다.
- `limit`을 생략하면 전부, 0 이하면 `[]`를 돌려줍니다.
- 점수와 일치 종류는 돌려주지 않습니다. 순서가 순위입니다.
- `highlight`는 빈 조각을 만들지 않고, 조각을 이으면 원문입니다. `ranges`는 검색기가 만든 값을 전제로 하며 검증하지 않습니다.

## 사용 예

```ts
import { createSearcher, highlight } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('ㅎㄱ');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
highlight('홍길동', [[0, 2]]);
// [{ text: '홍길', match: true }, { text: '동', match: false }]
```

### 바닐라

```ts
const search = createSearcher(users, { key: (u) => u.name });
input.addEventListener('input', () => {
  list.replaceChildren(
    ...search(input.value, { limit: 20 }).map(({ item, ranges }) => {
      const li = document.createElement('li');
      for (const part of highlight(item.name, ranges)) {
        const node = document.createElement(part.match ? 'mark' : 'span');
        node.textContent = part.text; // innerHTML 사용 금지
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

- `users` 참조는 안정적이어야 합니다. 목록이 바뀌면 searcher를 다시 만듭니다.
- `limit`을 주고 짧은 항목이 약 1만 개 이하인 목록이라면 보통 debounce가 필요 없습니다. 그보다 크거나 조건이 다르면 사용하는 데이터로 직접 확인하세요.
- Vue는 조합 중에 `v-model`이 갱신되지 않으므로 `@input`을 쓰세요.

## 입력 상태별 일치

검색어와 항목의 공백은 비교에서 빼고, 대소문자는 구분하지 않습니다. 검색어의 완성형 음절은 마지막 글자만 "치는 중"으로 보고, 그 앞의 음절은 똑같아야 합니다. 호환 자모(`ㄱ`, `ㅘ` 등)는 위치와 관계없이 앞부분이 맞으면 일치합니다.

| 입력 상태 | 예 |
|---|---|
| 초성 | `ㅎㄱㄷ` → 홍길동 |
| 쌍자음 구분 | `ㄱ` ✗ 까, `ㄲ` ✓ 까, `ㄱㄱ` ✗ ㄲ |
| 겹자음 | `ㄳ` → 검색 |
| 겹모음 조합 | `고` → 과, `우` → 원, `으` → 의 |
| 겹받침 조합 | `달` → 닭, `갑` → 값 |
| 받침이 다음 글자로 넘어감 | `간` → 가나, `바난` → 바나나, `읫` → 의사, `닭` → 달가, `값` → 갑사 (사이 공백 허용) |
| 확정 음절 | `하ㄱ` ✗ 한글 |
| 홑 모음 | `ㅏ`는 음절과 일치하지 않음 |
| 이모지 | 코드 포인트 전체가 같아야 함. 서로게이트 반쪽은 일치하지 않음. ZWJ 묶음 전체 강조는 보장하지 않음(`👩` → `👩‍💻`는 `[0, 2]`) |

## 순위

아래 값을 차례로 비교하며 앞의 것이 우선합니다.

1. 등급: 완전(모든 글자가 정확하고 항목 전체) · 접두 · 단어 시작에서 이어짐 · 중간에서 이어짐 · 건너뛴 일치(부분열)
2. 일부만 일치한 검색어 글자 수
3. 첫 일치부터 마지막 일치까지의 길이
4. 일치 시작 위치
5. 항목 길이(공백 제외)
6. 원래 순서

등급이 정확도보다 우선합니다. 예를 들어 `가`로 `강가`를 찾으면 `강`을 치는 중으로 보고 앞의 `강`을 칠합니다. 정확도는 같은 등급 안에서만 따집니다. 건너뛴 일치는 이어진 일치가 없을 때만 찾습니다.

한 항목에 건너뛴 일치가 여러 개 있으면 부분 일치 수, 구간 폭, 시작 위치 순으로 가장 좋은 경로를 고릅니다. 예를 들어 `가나`로 `가x낙 가y나`를 찾으면 두 글자가 모두 정확히 맞는 뒤쪽의 **가**y**나**를 강조합니다.

## 빈 검색어와 하이라이트

- 검색어가 비었거나 공백뿐이면 전 항목을 원래 순서로, `ranges: []`로 돌려줍니다. `limit`은 적용합니다.
- `ranges`는 일치한 글자의 원문 범위를 모아 겹치거나 맞닿으면 합칩니다. 일부만 일치한 음절은 통째로 칠하고, 무시한 공백은 칠하지 않습니다(`홍길` → `홍 길동`: `[0, 1]`, `[2, 3]`).

## `getChoseong`, `disassemble`

`getChoseong`은 초성(과 공백)만 남기고, `disassemble`은 완성형 음절과 겹자모를 호환 자모로 풉니다.

```ts
import { disassemble, getChoseong } from 'hunmin-search';

getChoseong('띄어 쓰기') === 'ㄸㅇ ㅆㄱ';
disassemble('값') === 'ㄱㅏㅂㅅ';
```
