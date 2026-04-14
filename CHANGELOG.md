# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

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
