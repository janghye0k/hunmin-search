# Hunmin Search (`hunmin-search`)

[English README](./English-README.md) (파일명은 npm 자동 포함 규칙 회피용입니다.)

한글·라틴 혼합 문자열에 대해 **부분열(subsequence) 필터**와 **한글 완화 Levenshtein** 점수로 후보를 정렬하는 소형 라이브러리입니다. **런타임 npm 의존성은 없습니다.**

## 문서

- **한국어 허브**: [docs/ko/README.md](./docs/ko/README.md) · **English hub**: [docs/en/README.md](./docs/en/README.md)
- **공개 API 목록**: [docs/api-surface.md](./docs/api-surface.md)
- npm **배포 tarball**에는 `dist/`, `README.md`(한국어), `LICENSE`만 들어갑니다(`package.json` `files`). 영어 개요는 저장소의 [`English-README.md`](./English-README.md)이며, 상세 문서는 `docs/`에 있습니다. 레지스트리 웹에서 `./docs/...` 링크가 깨지면 Git 호스팅에서 열거나 [docs/DOCUMENTATION_LINKS.md](./docs/DOCUMENTATION_LINKS.md)의 절대 URL 패턴을 쓰세요.

## 요구 사항

- Node.js **18** 이상 권장 (`engines` 참고).

## 설치

로컬 패키지나 Git 의존성으로 연결하거나, npm에서 `pnpm add hunmin-search`로 설치합니다. 버전·CHANGELOG는 [CHANGELOG.md](https://github.com/janghye0k/hunmin-search/blob/main/CHANGELOG.md), 배포 절차는 [docs/ko/npm-publish.md](https://github.com/janghye0k/hunmin-search/blob/main/docs/ko/npm-publish.md)를 참고하세요.

```bash
pnpm add ./path/to/hunmin-search
# 또는 빌드 후: pnpm pack → .tgz 설치
```

배포 tarball에는 `dist/`, `README.md`, `LICENSE`만 포함됩니다(`files` 필드). `pnpm pack` 또는 `npm publish` 전에 `prepack`으로 `pnpm run build`가 실행됩니다.

## Node에서 쓰기

### ESM (`import`)

```js
import { searchKoRanked, searchKoDetailed } from 'hunmin-search';

searchKoRanked('홍길', ['홍길동', '서울']);
// [{ value: '홍길동', score: number }]

searchKoDetailed('길', ['홍길동'], { includeEditTrace: true });
```

### CommonJS (`require`)

```js
const { searchKoRanked, searchKoDetailed } = require('hunmin-search');

searchKoRanked('홍길', ['홍길동', '서울']);
```

같은 애플리케이션 안에서 **ESM `import`와 CJS `require`로 이 패키지를 동시에** 불러오면 [듀얼 패키지 이슈(dual package hazard)](https://nodejs.org/api/packages.html#dual-package-hazard)가 생길 수 있습니다. **한 가지 모듈 형식만** 쓰는 것을 권장합니다.

## 브라우저에서 쓰기

번들러 없이 스크립트만 넣는 경우, 빌드 산출물 `dist/index.global.cjs`를 로드하면 전역 객체 **`HunminSearch`**(tsup `globalName`)가 생깁니다.

```html
<script src="./node_modules/hunmin-search/dist/index.global.cjs"></script>
<script>
  const hits = HunminSearch.searchKoRanked('홍길', ['홍길동', '서울']);
</script>
```

번들러(Vite·Webpack 등)에서는 `package.json`의 `exports` 서브패스 **`hunmin-search/browser`**를 쓰세요.

```js
import { searchKoRanked } from 'hunmin-search/browser';
```

`import` 조건은 브라우저용 ESM 번들(`dist/index.browser.js`)로, `require` 조건은 CJS 빌드로 연결됩니다. IIFE(`dist/index.global.cjs`)는 `<script src>`로 **파일 경로를 직접** 지정할 때만 쓰며 `exports`에는 포함되지 않습니다. 설치 도구·모노레포에 따라 경로가 달라질 수 있습니다.

## API 요약

- **`searchKoRanked(query, candidates, options?)`** — 통과한 후보만 점수 내림차순(`value`, `score`만).
- **`searchKoDetailed(...)`** — 동일 정렬 + `subsequenceAlignments`, `editDistance`(부분열 실패 시 `null`), 선택 `editTrace`.
- 저수준: `matchSubsequenceKo`, `levenshteinKo`, `rankByKoPipeline`, 한글 분해·초성 유틸 등은 패키지 엔트리에서 re-export.

## 제약·메모

- 인덱스는 UTF-16 코드 유닛 기준입니다. 이모지 같은 서로게이트 쌍은 인덱스 두 칸을 씁니다.
- 대소문자를 무시할 때는 문자열 전체를 `toLocaleLowerCase('en-US')`로 소문자화한 뒤 비교합니다. 편집 거리와 점수 분모도 소문자화한 문자열 길이를 씁니다.
- `İ`처럼 소문자화하면 길이가 늘어나는 문자는 `subsequenceAlignments`와 `editTrace`의 인덱스가 원문의 같은 위치를 여러 번 가리킬 수 있습니다. 인덱스는 항상 원문 범위 안에 있습니다. 하이라이트할 때는 중복을 합쳐서 쓰면 됩니다. `editTrace`는 소문자화한 문자열의 편집 경로이며 원문을 그대로 고치는 명령 목록은 아닙니다.
- 그리스 대문자 `Σ`는 단어 끝에 오는지에 따라 `σ`나 `ς`로 바뀝니다. 질의와 후보를 따로 소문자화하기 때문에 같은 `Σ`도 양쪽에서 다르게 바뀔 수 있습니다.
- 유니코드 정규화는 하지 않습니다. 완성형(NFC)과 분해형(NFD)은 다른 문자열이므로 호출하기 전에 질의와 후보를 NFC로 맞추세요. 반환되는 인덱스는 넘겨준 문자열 기준입니다. 정규화하기 전의 원문을 화면에 보여준다면 위치 변환이 따로 필요합니다.

```ts
const nfc = (s: string) => s.normalize('NFC');
searchKoRanked(nfc(query), candidates.map(nfc));
```

- 편집 거리는 항상 최소 편집 거리입니다. `similarSubstitutionCost`(기본 `0.01`)의 범위와 오류 처리는 [docs/ko/api-score.md](./docs/ko/api-score.md)에 있습니다.
- Node 18은 공식 지원이 끝났지만 `engines`는 `>=18`을 유지합니다. 새 서비스에는 지원 중인 LTS를 쓰세요.
- 긴 문자열이나 후보가 많으면 비용이 큽니다. `pnpm bench`로 환경별 성능을 확인할 수 있고, 배치 크기와 길이 상한은 호출하는 쪽에서 두는 것을 권장합니다.
## 개발

- 기여 가이드: [CONTRIBUTING.md](./CONTRIBUTING.md) · 변경 기록: [CHANGELOG.md](./CHANGELOG.md)
- 소스 타입체크: **`moduleResolution`: `Bundler`**, 상대 경로 import는 **확장자 없이** 작성합니다.
- 빌드는 **tsup**으로 `dist/`에 ESM(`.js`), CJS(`.cjs`), 브라우저 ESM(`.browser.js`), 브라우저 IIFE(`.global.cjs`), 선언 파일을 냅니다.

일부 Vitest 테스트는 **`dist`가 있어야** 통과합니다. 로컬에서는 보통 아래 순서를 따릅니다(CI와 동일).

```bash
pnpm install
pnpm run typecheck
pnpm run build
pnpm test
pnpm run lint
pnpm run publint
pnpm run attw
pnpm run test:browser   # Playwright — Chromium 필요
pnpm run bench           # vitest bench — 성능 벤치마크
```

## 라이선스

MIT — `LICENSE` 파일 참고. 참조·이식한 타 라이브러리 로직이 있다면 각 소스 파일 주석의 출처를 따릅니다.
