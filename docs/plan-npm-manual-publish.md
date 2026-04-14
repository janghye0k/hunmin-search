# npm 수동 배포 계획

이 문서는 **GitHub Actions로 레지스트리에 자동 `npm publish`를 하지 않는다**는 전제 아래, 로컬에서 **검증·버전·CHANGELOG·배포**를 어떻게 맞출지 정리합니다. 표시명 **Hunmin Search**, 패키지 이름 **`hunmin-search`**(하이픈, 비스코프)로의 리네이밍은 [README](../README.md)·`package.json` 일괄 갱신과 함께 진행합니다.

## 결정 사항(고정)

| 항목 | 결정 |
|------|------|
| npm 패키지 `name` | **`hunmin-search`** (단일 하이픈, 스코프 없음) |
| `private` | **`false`** (npm 공개 배포 전제) |
| `files` (tarball) | **현행 유지**: `dist`, `README.md`, `LICENSE`만 포함. `English-README.md` 등은 tarball에 넣지 않음([DOCUMENTATION_LINKS.md](./DOCUMENTATION_LINKS.md) 참고). |
| `prepublishOnly` | **둔다.** `pnpm publish` 직전에 **`prepublish:safe`**가 자동 실행되도록 한다(`publish:check` 전체는 재귀 방지를 위해 수동). |
| 버전·CHANGELOG | **[Conventional Commits](https://www.conventionalcommits.org/)** 규칙으로 히스토리를 쌓고, **[`commit-and-tag-version`](https://github.com/conventional-changelog/commit-and-tag-version)**(구 `standard-version` 계열)으로 **`package.json`의 `version` 갱신 + `CHANGELOG.md` 생성·갱신 + git 태그**를 한 번에 처리한다. |
| 레지스트리 배포 | **사람이** `pnpm publish`(또는 동등)로 수행. CI·Secrets로 publish하지 않음. |

## 목표

- npm에 올리는 작업은 **항상 수동**이다.
- 저장소에는 **배포 전 검증 스크립트**, **`prepublishOnly`**, **릴리스(버전+CHANGELOG+태그) 스크립트**를 두어 실수를 줄인다.
- **CI**는 품질만 검증하며, `NPM_TOKEN`이나 publish 워크플로는 추가하지 않는다.

## 하지 않을 것

- 브랜치 푸시만으로 `npm publish`를 실행하는 GitHub Actions.
- Repository secrets에 npm 토큰을 넣어 자동 배포하는 구성.

## 전제 조건(메타데이터)

| 항목 | 설명 |
|------|------|
| `repository` / `homepage` / `bugs` | npm·GitHub 링크 품질을 위해 채운다. npmjs 패키지 페이지에서 `./docs/...` 상대 링크가 깨지는 이유와 대안은 [DOCUMENTATION_LINKS.md](./DOCUMENTATION_LINKS.md)를 따른다. |
| npm 동일 버전 | 이미 올라간 `version`은 다시 publish할 수 없다. **항상 `commit-and-tag-version`으로 올린 뒤** publish한다. |

## Conventional Commits(필수 관례)

`commit-and-tag-version`은 **커밋 메시지**를 읽어 CHANGELOG 섹션을 만든다. 아래 형태를 **기본**으로 쓴다.

- `feat: 설명` → 마이너 버전 후보(요약은 CHANGELOG Features 등에 반영)
- `fix: 설명` → 패치 버전 후보
- `feat!:` 또는 본문에 `BREAKING CHANGE:` → 메이저 버전 후보
- `chore:`, `docs:`, `ci:` 등 → 기본 설정에서는 CHANGELOG에 안 잡히거나 Others 등으로 묶일 수 있음(도구·프리셋에 따름)

자동 분류 품질을 높이려면 **PR/커밋 리뷰에서 접두사 준수**를 습관화한다. 필요하면 나중에 **commitlint**로 강제할 수 있으나, 본 계획의 필수 항목은 아니다.

## 버전·CHANGELOG: `commit-and-tag-version`

### 역할

- 현재 `package.json`의 `version`과 git 히스토리(또는 이전 태그)를 기준으로 **다음 시맨틱 버전**을 계산한다.
- **`CHANGELOG.md`**를 갱신(또는 최초 생성)한다.
- **`package.json`의 `version` 필드**를 위 버전으로 바꾼다.
- 설정에 따라 **annotated git tag**(예: `v1.2.3`)를 생성하고, **버전 bump + CHANGELOG**를 포함한 **커밋**을 만든다.

### 설치(구현 시)

개발 의존성으로 추가한다.

```bash
pnpm add -D commit-and-tag-version
```

### `package.json` 스크립트(권장 형태)

| 스크립트 | 역할 |
|----------|------|
| `release` | `commit-and-tag-version` 실행. **이전 git 태그 이후의 Conventional Commits**를 보고 시맨틱 버전 상승 폭(패치·마이너·메이저)을 **자동**으로 정한다. |
| `release:minor` | `commit-and-tag-version --release-as minor` |
| `release:major` | `commit-and-tag-version --release-as major` |

처음 저장소에 도입할 때는 **기존 태그가 없으면** 첫 실행 옵션으로 `--first-release`를 쓰는 패턴이 있다(현재 `version`을 그대로 “첫 릴리스”로 두고 CHANGELOG만 시작). **이미 npm에 올린 버전과 로컬 `version`이 같다면**, 팀이 정한 기준에 맞춰 첫 태그/CHANGELOG 시작점을 한 번 정리한다.

### 선택 설정

- 프로젝트 루트에 **`.versionrc.json`**(또는 `package.json`의 `commit-and-tag-version` 필드)로 헤더·타입 라벨 등을 조정할 수 있다.
- 기본 프리셋으로 시작하고, CHANGELOG 헤딩이 마음에 들지 않을 때만 조정해도 된다.

### 릴리스 후 git

도구가 **커밋과 태그를 로컬에 만든 뒤**, 원격에 반영하려면(팀 브랜치 전략에 맞게) 예를 들어 다음을 실행한다.

```powershell
git push --follow-tags origin main
```

브랜치 이름은 저장소 기본 브랜치에 맞게 바꾼다.

## 배포 전 검증·publish 스크립트

| 스크립트 | 역할 |
|----------|------|
| `publish:check` | `pnpm run typecheck` → `pnpm run build` → `pnpm test` → `pnpm run publint` → `pnpm run attw` (**CI와 동일 순서**). **수동으로 publish하기 직전**에 한 번 돌리는 통합 게이트. |
| `publish:dry-run` | `pnpm publish --dry-run --no-git-checks --access public` |
| `prepublish:safe` | `typecheck` → `build` → `vitest run`(단, **`test/pack-contents.test.ts` 제외**) → `publint`. |
| `prepublishOnly` | **`pnpm run prepublish:safe`** 를 호출한다. `publish:check` 전체를 여기에 넣지 않는 이유: `pnpm test`가 tarball을 만드는 테스트를 포함하거나, `attw`가 내부적으로 pack을 돌릴 때 **`prepublishOnly`가 중첩되어 무한 재귀**가 될 수 있기 때문이다. `attw`까지 포함한 전체 검증은 **`pnpm run publish:check`**로 별도 실행한다. |
| `pnpm pack` | 일부 패키지 매니저에서 `prepublishOnly`가 pack에도 걸릴 수 있다. pack만 빠르게 할 때는 `pnpm pack --ignore-scripts`를 쓰면 `prepack`까지 건너뛰므로, **`dist`가 이미 최신**일 때만 사용한다. |

## 권장 흐름 한 번에(로컬)

1. 기능·수정을 **Conventional Commits** 형식으로 `main`(또는 작업 브랜치)에 쌓는다.
2. 릴리스 준비: `pnpm run release` (또는 `release:minor` / `release:major`).
3. 생성된 커밋·태그·`CHANGELOG.md`·`version`을 검토한다.
4. `git push` 및 `git push --follow-tags`(또는 팀 규칙).
5. (권장) `pnpm run publish:check`로 `attw`·pack 회귀 테스트까지 포함한 **전체 CI 동등 검증**.
6. 레지스트리: `pnpm publish --dry-run ...` 후 `pnpm publish --access public` (이때 **`prepublishOnly` → `prepublish:safe`**).

## 수동 배포 명령 참고 (PowerShell)

```powershell
npm login
pnpm run release
# 검토 후
git push --follow-tags origin main
pnpm run publish:check
pnpm publish --dry-run --no-git-checks --access public
pnpm publish --access public
```

## 로컬 검증과 CI

| 구분 | 내용 |
|------|------|
| CI | typecheck, build, test, publint, attw, 브라우저 스모크. **publish 없음.** |
| publish 직전 | `prepublishOnly`가 `prepublish:safe`를 강제한다. `publish:check`는 배포 직전에 수동으로 실행한다. |

## 체크리스트(배포 직전)

- [ ] `pnpm run release`(또는 minor/major)로 **version·CHANGELOG·태그** 반영 완료, 원격 푸시 완료
- [ ] `private`가 **`false`**인지 확인
- [ ] `pnpm publish --dry-run`으로 tarball·응답 확인
- [ ] 루트 `README.md`가 npm에 보일 본문인지 확인(`files`는 결정 사항대로)

## 관련 문서

- [DOCUMENTATION_LINKS.md](./DOCUMENTATION_LINKS.md)
- [api-surface.md](./api-surface.md)

## 요약

- **결정**: `hunmin-search`, `private: false`, `files` 현행, **`prepublishOnly` 사용**, 버전·CHANGELOG는 **Conventional Commits + `commit-and-tag-version`**, npm 업로드는 **수동**.
- **저장소 반영**: `commit-and-tag-version` devDependency, `release` / `release:minor` / `release:major`, `publish:check`, `publish:dry-run`, `prepublish:safe` + `prepublishOnly`, [CHANGELOG.md](../CHANGELOG.md) 초안, [README](../README.md) 링크. `package.json`의 `repository`·`bugs`·`homepage`는 실제 Git 호스트 URL로 유지한다.
