# Hunmin Search (`hunmin-search`)

[English README](https://github.com/janghye0k/hunmin-search/blob/main/English-README.md)

타이핑 중에 바로 쓰는 한글 검색 라이브러리입니다. IME 조합 중인 입력과 초성 입력을 그대로 일치시키고, 순위를 매긴 결과와 하이라이트 위치를 돌려줍니다. **런타임 npm 의존성은 없습니다.**

```ts
import { createSearcher, highlight } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('ㅎㄱ');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
highlight('홍길동', [[0, 2]]);
// [{ text: '홍길', match: true }, { text: '동', match: false }]
```

## 문서

- [한국어 문서](https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/README.md) · [English documentation](https://github.com/janghye0k/hunmin-search/blob/main/docs/en/README.md)
- [공개 API 목록](https://github.com/janghye0k/hunmin-search/blob/main/docs/api-surface.md)

## 요구 사항

- Node.js `^22.0.0 || ^24.0.0 || >=26.0.0` (`engines`). 그 밖의 버전은 지원이 끝난 버전이라 제외합니다.

## 설치

로컬 패키지나 Git 의존성으로 연결하거나, npm에서 `pnpm add hunmin-search`로 설치합니다. 버전별 변경 사항은 변경 기록을 참고하세요. [CHANGELOG.md](https://github.com/janghye0k/hunmin-search/blob/main/CHANGELOG.md)

```bash
pnpm add ./path/to/hunmin-search
# 또는 빌드 후: pnpm pack → .tgz 설치
```

배포 tarball에는 `dist/`, `README.md`, `LICENSE`, `package.json`이 포함됩니다. `pnpm pack` 또는 `npm publish` 전에 `prepack`으로 `pnpm run build`가 실행됩니다.

## Node에서 쓰기

### ESM (`import`)

```js
import { createSearcher } from 'hunmin-search';

createSearcher(['홍길동', '서울'])('홍길');
// [{ item: '홍길동', index: 0, ranges: [[0, 2]] }]
```

### CommonJS (`require`)

```js
const { createSearcher } = require('hunmin-search');

createSearcher(['홍길동', '서울'])('홍길');
```

같은 애플리케이션 안에서 **ESM `import`와 CJS `require`로 이 패키지를 동시에** 불러오면 [듀얼 패키지 이슈(dual package hazard)](https://nodejs.org/api/packages.html#dual-package-hazard)가 생길 수 있습니다. **한 가지 모듈 형식만** 쓰는 것을 권장합니다.

## 브라우저에서 쓰기

번들러 없이 스크립트만 넣는 경우, 빌드 산출물 `dist/index.iife.js`를 로드하면 전역 객체 **`HunminSearch`**(tsdown `globalName`)가 생깁니다.

```html
<script src="./node_modules/hunmin-search/dist/index.iife.js"></script>
<script>
  const hits = HunminSearch.createSearcher(['홍길동', '서울'])('홍길');
</script>
```

번들러(Vite·Webpack 등)에서는 `package.json`의 `exports` 서브패스 **`hunmin-search/browser`**를 쓰세요.

```js
import { createSearcher } from 'hunmin-search/browser';
```

`import` 조건은 브라우저용 ESM 번들(`dist/browser.mjs`)로, `require` 조건은 CJS 빌드로 연결됩니다. IIFE(`dist/index.iife.js`)는 `<script src>`로 **파일 경로를 직접** 지정할 때만 쓰며 `exports`에는 포함되지 않습니다. 설치 도구·모노레포에 따라 경로가 달라질 수 있습니다.

## 화면에 붙이기

아래 예제의 `users`는 `{ id, name }` 객체 배열이고, `input`과 `list`는 이미 있는 DOM 요소입니다.

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

### 주의

- `users` 참조는 안정적이어야 합니다. 렌더링마다 새 배열을 만들면 searcher도 매번 다시 만들어집니다.
- `limit`을 주고 짧은 항목이 약 1만 개 이하인 목록이라면 보통 debounce가 필요 없습니다. 입력할 때마다 호출하세요. 그보다 크거나 조건이 다르면 사용하는 데이터로 직접 확인하세요.
- 검색기는 만들 때의 목록을 전처리해 둡니다. 목록이 바뀌면 searcher를 다시 만드세요.
- Vue는 조합 중에 `v-model`이 갱신되지 않으므로 `@input`을 쓰세요.

## API 요약

- **`createSearcher(items, { key }?)`** — 검색 함수를 만듭니다. 문자열 배열이면 `key`를 생략합니다. 검색 함수 `(query, { limit }?)`는 일치한 항목만 순위 순으로 `{ item, index, ranges }[]`로 돌려줍니다. 점수는 없으며 순서가 순위입니다.
- **`highlight(text, ranges)`** — 문자열을 `{ text, match }[]` 조각으로 나눕니다.
- **`getChoseong(text)`**, **`disassemble(text)`** — 초성 추출과 자모 분해.

타입과 입력 상태별 일치 예는 API 문서에서 확인할 수 있습니다. [검색 API](https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/api-search.md)

## 동작 규칙

- **공백 무시**: 검색어와 항목의 공백은 비교에서 뺍니다(`홍길` → `홍 길동`).
- **조합 중 입력**: 검색어의 마지막 글자는 아직 치는 중으로 봅니다(`간` → `가나`, `달` → `닭`, `고` → `과`).
- **초성**: `ㅎㄱㄷ` → `홍길동`. 쌍자음은 구분하므로 `ㄱ`은 `까`와 일치하지 않습니다.
- **마지막 글자 앞은 확정**: 앞의 완성형 음절은 똑같아야 합니다(`하ㄱ`은 `한글`과 일치하지 않음).
- **대소문자**는 구분하지 않습니다.
- **건너뛴 입력**: `홍동` → `홍길동`처럼 사이를 건너뛴 일치는 가장 아래 등급입니다. 한 항목에 가능한 조합이 여럿이면 부분 일치가 적고, 강조 구간이 좁고, 시작이 빠른 순으로 고릅니다.
- **순위**: 아래 값을 차례로 비교하며 앞의 것이 우선합니다.
  1. 등급: 완전 일치 → 접두 → 단어 시작에서 이어짐 → 중간에서 이어짐 → 건너뛴 일치
  2. 일부만 일치한 글자 수가 적은 것
  3. 첫 일치부터 마지막 일치까지의 길이가 짧은 것
  4. 일치 시작 위치가 앞인 것
  5. 항목이 짧은 것(공백 제외)
  6. 원래 순서
- **빈 검색어**(공백만 있는 경우 포함): 전체 항목을 원래 순서로 돌려주며 `ranges`는 `[]`입니다.
- **`ranges`**: 원문 기준 UTF-16 인덱스 `[start, end)`입니다. 일부만 일치한 음절은 통째로 포함합니다.

## 한계

- 오타 허용과 여러 필드 검색은 없습니다.
- 두벌식 입력 기준입니다. 천지인 입력의 중간 상태는 지원하지 않습니다.
- 분해형(NFD)은 현대 한글만 합쳐서 비교합니다. 그 밖의 결합 문자는 정규화하지 않습니다.
- 그리스어 어말 시그마처럼 문맥에 따른 대소문자 접기는 하지 않습니다(`ΟΣ`와 `ος`는 일치하지 않음).
- ZWJ로 묶인 이모지는 묶음 전체가 강조된다고 보장하지 않습니다.
- 긴 목록은 느릴 수 있습니다. 같은 문자가 반복되는 데이터이거나 `limit`을 생략하면 훨씬 느려질 수 있습니다. 사용하는 데이터로 직접 확인하세요.

## 개발

- 기여 가이드: [CONTRIBUTING.md](./CONTRIBUTING.md) · 변경 기록: [CHANGELOG.md](./CHANGELOG.md)
- 소스 타입체크: **`moduleResolution`: `Bundler`**, 상대 경로 import는 **확장자 없이** 작성합니다.
- 빌드는 **tsdown**으로 `dist/`에 ESM(`index.mjs`), CJS(`index.cjs`), 브라우저 ESM(`browser.mjs`), 브라우저 IIFE(`index.iife.js`), 선언 파일(`.d.mts`·`.d.cts`)을 냅니다. `publint`와 `attw` 검사도 빌드에 포함됩니다. 빌드에는 Node `^22.18.0 || ^24.11.0 || >=26.0.0`이 필요합니다.

일부 Vitest 테스트는 **`dist`가 있어야** 통과합니다. 로컬에서는 보통 아래 순서를 따릅니다(CI와 동일).

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
pnpm run test:browser   # Playwright — Chromium 필요
pnpm run bench           # vitest bench — 성능 벤치마크 (먼저 build 필요)
node bench/measure-search.mjs chromium # 일반 데이터 1만 건의 질의별 p95 검사
```

## 라이선스

MIT — `LICENSE` 파일 참고. 참조·이식한 타 라이브러리 로직이 있다면 각 소스 파일 주석의 출처를 따릅니다.
