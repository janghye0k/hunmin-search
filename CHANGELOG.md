# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Release automation uses [Conventional Commits](https://www.conventionalcommits.org/) and [`commit-and-tag-version`](https://github.com/conventional-changelog/commit-and-tag-version); see [docs/plan-npm-manual-publish.md](./docs/plan-npm-manual-publish.md).

## [0.1.0] - 2026-04-14

### Changed

- npm package name from `hangul-search` to **`hunmin-search`** (project branding: **Hunmin Search**).
- **Breaking:** IIFE global `hangulSearch` → **`HunminSearch`** (`tsup` `globalName`).
- **Breaking:** `searchHangulRanked` → **`searchKoRanked`**, `searchHangulDetailed` → **`searchKoDetailed`** (source files `searchKoRanked.ts`, `searchKoDetailed.ts`).
