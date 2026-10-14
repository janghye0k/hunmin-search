# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.2.0](https://github.com/janghye0k/hunmin-search/compare/v0.1.2...v0.2.0) (2026-10-14)


### ⚠ BREAKING CHANGES

* hunmin-search/browser now resolves to an ESM build for
import and to the CJS build for require instead of the IIFE file.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
* scores for characters whose lowercase form is longer change,
alignment and trace indices may repeat, and code that builds
SubsequenceMatchResult or RankedKoHit objects by hand must now provide
queryIndices.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
* distances and scores can be lower than before because the
result is now the true minimum, and an invalid similarSubstitutionCost throws
RangeError instead of being computed with.

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>

### Bug Fixes

* make hunmin-search/browser a real ESM subpath ([403ac37](https://github.com/janghye0k/hunmin-search/commit/403ac37d0f3ab62641c5034111d0da617c935c41))
* report original-string positions for case-folded text ([39e4713](https://github.com/janghye0k/hunmin-search/commit/39e471331c94dfe97ab58cde8785709c906c6bf4))
* return the true minimum edit distance and validate similarSubstitutionCost ([ce3e6cc](https://github.com/janghye0k/hunmin-search/commit/ce3e6cc067ac73eb01af0429e20d64379f944fba))

## [0.1.2](https://github.com/janghye0k/hunmin-search/compare/v0.1.1...v0.1.2) (2026-07-14)


### Bug Fixes

* tar test compat, optimize levenshteinKo DP, fix docs, add benchmarks ([036dec7](https://github.com/janghye0k/hunmin-search/commit/036dec727a4dc1f64cc22a7753ea695efe134882))

## 0.1.1 (2026-04-14)


### Features

* add documentation files, update README, and implement npmignore for safety ([ccd47db](https://github.com/janghye0k/hunmin-search/commit/ccd47db9e73a29ee2ac3c25e7723d3fde8d5173c))
* add Hangul disassembly and similarity functions with tests ([2003146](https://github.com/janghye0k/hunmin-search/commit/200314631a269473dec02714ce2c38df5ac27824))
* add license, README, CI configuration, and update project dependencies ([0084ca5](https://github.com/janghye0k/hunmin-search/commit/0084ca5497c695a7784d73c59d2d5c7af5d92991))
* enhance scoring functions with subsequence matching and pipeline ranking ([29849e7](https://github.com/janghye0k/hunmin-search/commit/29849e7d6e16089a0899b2aa722c43ea1f952c10))
* implement searchDetailed and searchRanked functions with corresponding types and tests ([f94cc80](https://github.com/janghye0k/hunmin-search/commit/f94cc807b86922a4f1588b0099a90600c4b08e38))
* update scoring and search functions to support null edit distances and improve case folding ([aa57973](https://github.com/janghye0k/hunmin-search/commit/aa579730aab032b5661631bc44e6dd209720e3e8))

## [0.1.0] - 2026-04-14

### Changed

- npm package name from `hangul-search` to **`hunmin-search`** (project branding: **Hunmin Search**).
- **Breaking:** IIFE global `hangulSearch` → **`HunminSearch`** (`tsup` `globalName`).
- **Breaking:** `searchHangulRanked` → **`searchKoRanked`**, `searchHangulDetailed` → **`searchKoDetailed`** (source files `searchKoRanked.ts`, `searchKoDetailed.ts`).
