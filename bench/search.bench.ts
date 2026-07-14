import { bench, describe } from 'vitest';
import { levenshteinKo, matchSubsequenceKo, searchKoRanked } from '../src';

const KOREAN_NAMES = [
  '김민수',
  '이영희',
  '박지성',
  '최현우',
  '정수빈',
  '강도윤',
  '조은지',
  '윤서연',
  '장하늘',
  '임재현',
  '한소희',
  '오지훈',
  '신미래',
  '권나영',
  '홍길동',
  '서민정',
  '류현진',
  '배수지',
  '남궁민',
  '제갈량',
];

function generateCandidates(n: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(KOREAN_NAMES[i % KOREAN_NAMES.length]! + (i >= KOREAN_NAMES.length ? String(i) : ''));
  }
  return result;
}

function generateMatchHeavy(n: number): string[] {
  const bases = ['강남구청', '강남역', '강남대로', '강원도청', '강릉시', '강서구', '강동구', '강북구'];
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    result.push(bases[i % bases.length]! + (i >= bases.length ? String(i) : ''));
  }
  return result;
}

const C100 = generateCandidates(100);
const C1K = generateCandidates(1_000);
const C10K = generateCandidates(10_000);
const M1K = generateMatchHeavy(1_000);

describe('searchKoRanked — filter-heavy (few matches)', () => {
  bench('100 candidates', () => {
    searchKoRanked('홍길', C100);
  });

  bench('1K candidates', () => {
    searchKoRanked('홍길', C1K);
  });

  bench('10K candidates', () => {
    searchKoRanked('홍길', C10K);
  });
});

describe('searchKoRanked — match-heavy (most pass subsequence)', () => {
  bench('1K candidates, jamo query', () => {
    searchKoRanked('ㄱ', M1K);
  });

  bench('1K candidates, syllable query', () => {
    searchKoRanked('강', M1K);
  });
});

describe('levenshteinKo', () => {
  bench('short (3 vs 3)', () => {
    levenshteinKo('가나다', '가나라');
  });

  bench('medium (20 vs 20)', () => {
    levenshteinKo('가'.repeat(20), '나'.repeat(20));
  });

  bench('long (100 vs 100)', () => {
    levenshteinKo('가'.repeat(100), '나'.repeat(100));
  });

  bench('asymmetric (3 vs 100)', () => {
    levenshteinKo('가나다', '나'.repeat(100));
  });
});

describe('matchSubsequenceKo', () => {
  bench('short query, short haystack', () => {
    matchSubsequenceKo('홍길', '홍길동');
  });

  bench('short query, long haystack', () => {
    matchSubsequenceKo('홍길', '김철수홍길동이영희박지성');
  });

  bench('jamo query', () => {
    matchSubsequenceKo('ㅎㄱ', '홍길동');
  });
});
