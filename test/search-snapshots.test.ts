import { describe, expect, it } from 'vitest';
import { searchKoRanked } from '../src/api/index';

/** 스냅샷 안정화: 부동 소수 점수를 고정 자릿수로 반올림 */
function stabilize(hits: { value: string; score: number }[]) {
  return hits.map((h) => ({
    value: h.value,
    score: Number(h.score.toFixed(8)),
  }));
}

const SNAPSHOT_SCENARIOS: { id: string; query: string; candidates: string[] }[] = [
  { id: 'hong-gil', query: '홍길', candidates: ['김철수', '홍길동', '서울', '김홍길'] },
  { id: 'seoul', query: '서울', candidates: ['부산광역시', '서울특별시', '대전', '서울시'] },
  { id: 'gang', query: '강', candidates: ['강남구청', '서울시 강남', '강', '강원도'] },
  { id: 'hakgeup', query: '학급', candidates: ['A학급', 'B학급', '학급', '학급미정'] },
  { id: 'jamo-hg', query: 'ㅎㄱ', candidates: ['한글', '학교', '화곡역', '호구'] },
  { id: 'frontend', query: '프론트', candidates: ['백엔드', '프론트엔드', '프론트', '프리랜서'] },
  { id: 'react', query: '리액트', candidates: ['리액트', 'Vue', '리액트쿼리', '리엑트'] },
  { id: 'gildong', query: '길동', candidates: ['홍길동', '길동이', '동길', '서울길동'] },
  { id: 'subsequence-abc', query: 'abc', candidates: ['xaxbxcx', 'abc', 'acb', 'zzabczz'] },
  { id: 'case-insensitive', query: 'Foo', candidates: ['bar', 'fOoBar', 'FOO', 'xfooy'] },
  { id: 'numeric-mixed', query: '12', candidates: ['a1b2c3', '12', '112', '21'] },
  { id: 'spaces', query: 'a b', candidates: ['xx a b', 'ab', 'a  b', 'ba '] },
  { id: 'korean-partial', query: '각', candidates: ['가나다', '각도', '강남', '각'] },
  { id: 'english-korean', query: 'api한글', candidates: ['rest-api한글', 'api한글테스트', '한글api', 'api'] },
  { id: 'single-char-tie', query: 'x', candidates: ['ax', 'x', 'xx', 'bxc'] },
  { id: 'long-query', query: '검색엔진', candidates: ['검색', '한국검색엔진', '검색엔진최적화', '엔진검색'] },
];

describe('searchKoRanked snapshot (ordering + normalized scores)', () => {
  it.each(SNAPSHOT_SCENARIOS)('$id', ({ query, candidates }) => {
    expect(stabilize(searchKoRanked(query, candidates))).toMatchSnapshot();
  });
});
