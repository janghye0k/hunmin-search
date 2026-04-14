# npm 배포 가이드 (저장소 운영자 전용)

이 문서는 **`hunmin-search`** 패키지를 npm에 올릴 때, 본인 PC에서 따라 하면 되는 순서만 적었습니다. GitHub Actions로 자동 publish는 쓰지 않고, **로컬에서 `pnpm publish`** 하는 전제입니다.

- 저장소: [github.com/janghye0k/hunmin-search](https://github.com/janghye0k/hunmin-search)
- 패키지 페이지(배포 후): `https://www.npmjs.com/package/hunmin-search`

## 사전 조건

1. [npm](https://www.npmjs.com/) 계정이 있고, **`hunmin-search` 이름이 비어 있는지** 확인합니다(이미 사용 중이면 스코프 패키지 등으로 정책을 바꿔야 합니다).
2. 이 저장소 루트에서 **`pnpm install`**까지 끝난 상태입니다.
3. `package.json`의 **`private`는 `false`**입니다. `true`면 publish가 거절됩니다.

## 한 번만: 레지스트리 로그인

PowerShell 예시입니다.

```powershell
npm login
```

2FA를 쓰는 계정이면, npm 안내에 따라 **Access Token**을 만들고 `~/.npmrc`에 넣는 방식이 더 편할 수 있습니다. 토큰은 절대 저장소에 커밋하지 마세요.

## 배포할 때마다: 권장 순서

### 1) 커밋 메시지 관례 (선택이지만 강력 권장)

버전과 `CHANGELOG.md`를 자동으로 맞추려면 [Conventional Commits](https://www.conventionalcommits.org/) 형식으로 쌓아 둡니다. 예: `feat: …`, `fix: …`, 브레이킹은 `feat!:` 또는 본문에 `BREAKING CHANGE:`.

### 2) 릴리스 커밋과 태그 (`commit-and-tag-version`)

저장소에 다음 스크립트가 있습니다.

| 명령 | 설명 |
|------|------|
| `pnpm run release` | 마지막 git 태그 이후 커밋을 보고 **다음 시맨틱 버전**을 정하고, `CHANGELOG.md`와 `package.json`의 `version`을 갱신한 뒤 **커밋·태그**를 만듭니다. |
| `pnpm run release:minor` | `commit-and-tag-version --release-as minor` |
| `pnpm run release:major` | `commit-and-tag-version --release-as major` |

**처음 태그가 없을 때**는 도구 안내에 따라 `--first-release` 등을 붙이는 식으로 시작할 수 있습니다. 이미 `CHANGELOG.md`가 있으면 그다음부터는 보통 `pnpm run release`만으로 충분합니다.

실행 후에는 생성된 커밋과 태그를 원격에 올립니다.

```powershell
git push origin main
git push origin --tags
```

브랜치 이름이 `main`이 아니면 바꿉니다.

### 3) 배포 직전 품질 검증

CI와 동일한 전체 검증입니다(권장).

```powershell
pnpm run publish:check
```

`typecheck` → `build` → `test` → `publint` → `attw` 순서입니다.

### 4) 실제로 올리기 전 리허설

```powershell
pnpm run publish:dry-run
```

또는 동일하게:

```powershell
pnpm publish --dry-run --no-git-checks --access public
```

tarball에 무엇이 들어가는지, 레지스트리가 거절하지 않는지 확인합니다.

### 5) npm에 publish

```powershell
pnpm publish --access public
```

`pnpm publish`를 실행하면 npm이 **`prepublishOnly`**를 돌리고, 그 안에서 **`prepublish:safe`**가 실행됩니다. pack 관련 테스트와의 재귀를 막기 위해, 여기서는 **`publish:check`보다 약한** 검증만 자동으로 돕니다. 그래서 **반드시 위 3단계 `publish:check`를 배포 직전에 한 번** 돌리는 것을 권장합니다.

## tarball에 들어가는 것

`package.json`의 `files` 필드 때문에 npm 패키지에는 대략 다음만 포함됩니다.

- `dist/`
- `README.md`
- `LICENSE`
- `package.json` (npm이 항상 포함)

`docs/`, `English-README.md` 등은 **npm 페이지의 상대 링크로는 열리지 않을 수** 있습니다. 깨지는 링크는 [DOCUMENTATION_LINKS.md](../DOCUMENTATION_LINKS.md)를 참고해 GitHub 절대 URL로 안내합니다.

## 자주 막히는 경우

| 증상 | 원인 후보 |
|------|-----------|
| `403` 또는 이름 충돌 | `hunmin-search`가 이미 다른 계정에 등록됨 |
| 같은 버전 거절 | `package.json`의 `version`이 레지스트리에 이미 있음. `release`로 올리거나 수동으로 버전 증가 |
| 로그인 만료 | `npm login` 또는 토큰 갱신 |
| `git` 상태 경고 | `--no-git-checks`는 `publish:dry-run` / 스크립트에 이미 포함. 운영 정책에 맞게 유지 |

## 관련 파일

- [CHANGELOG.md](../../CHANGELOG.md): 사용자에게 보이는 변경 요약
- [CONTRIBUTING.md](../../CONTRIBUTING.md): 기여 시 참고

이 문서는 **본인 전용 운영 메모**로 두고, 팀에 맞게 문장만 고쳐 써도 됩니다.
