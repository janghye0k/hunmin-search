import { describe, test } from 'vitest';
import { createSearcher } from '../src';

function registerBenchmark(name: string, workload: () => void): void {
  test(name, async ({ bench }) => {
    const result = await bench(name, workload).run();
    process.stdout.write(`${name}: ${result.throughput.mean.toFixed(2)} ops/s\n`);
  });
}

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

const C10K = generateCandidates(10_000);
const M1K = generateMatchHeavy(1_000);

describe('createSearcher', () => {
  const names = createSearcher(C10K);
  const matches = createSearcher(M1K);

  registerBenchmark('10K candidates, filter-heavy', () => {
    names('홍길', { limit: 20 });
  });

  registerBenchmark('1K candidates, match-heavy', () => {
    matches('ㄱ', { limit: 20 });
  });
});
