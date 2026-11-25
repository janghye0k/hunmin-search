const SEED = 42;
const WARMUPS = 20;
const SAMPLES = 100;
const CANDIDATE_COUNT = 10_000;
const BUDGET_MS = 16;

const names = ['홍길동', '홍기준', '김민수', '이영희', '박지성', '최현우', '정수빈', '강도윤', '조은지', '장하늘'];
const departments = [
  '기술지원팀',
  '고객서비스팀',
  '인사운영팀',
  '재무기획팀',
  '품질관리팀',
  '물류운영팀',
  '정보보안팀',
  '제품개발팀',
  '시설관리팀',
  '구매계약팀',
  '교육협력팀',
  '감사운영팀',
];
const periods = ['상반기', '하반기', '제1분기', '제2분기', '제3분기', '제4분기', '2025년도', '2026년도'];
const topics = [
  '가나 지사 전산 운영',
  '고객 상담 시스템 운영',
  '신규 입사자 직무 교육',
  '외부 협력사 계약 갱신',
  '사내 정보 보호 정책',
  '재난 대응 모의 훈련',
  '국내 사업장 설비 관리',
  '업무 지원 시스템 개선',
  '부서별 예산 집행 현황',
  '개인 정보 접근 권한',
  '사내 안전 점검 절차',
  '공공 데이터 활용 사업',
  '서비스 품질 개선 계획',
  '지역 물류센터 운영',
  '현장 근로자 건강 관리',
  '해외 법인 비용 정산',
];
const documentTypes = ['검토 결과서', '변경 요청서', '업무 보고서', '정기 점검표', '실무 안내서', '회의 자료집'];

export function makeScenarios(seed) {
  let state = seed >>> 0;
  const pick = (values) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return values[Math.floor((state / 0x100000000) * values.length)];
  };
  const candidates = (makeItem) => Array.from({ length: CANDIDATE_COUNT }, (_, index) => makeItem(index));
  const items = candidates((index) => {
    const kind = index % 10;
    let text;
    if (kind < 4) {
      text = [pick(departments), pick(periods), pick(topics), pick(documentTypes)].join(' ');
    } else {
      const name = pick(names);
      text = kind < 7 ? name : pick(departments) + ' ' + name;
    }
    const item = text + ' ' + index;
    return index % 10 === 0 ? item.normalize('NFD') : item;
  });
  const repeated = candidates((index) => '가'.repeat(40 - String(index).length) + index);

  return [
    {
      name: 'mixed',
      recordOnly: false,
      items,
      queries: ['ㅎㄱ', 'ㄱ', 'ㅎ', '호', '홍', '홍ㄱ', '홍기', '홍길', '간', 'zzzz', '', '  홍 길 '.normalize('NFD')],
      limit: 20,
    },
    { name: 'repeated-40', recordOnly: true, items: repeated, queries: ['가가가'], limit: 20 },
    { name: 'unlimited', recordOnly: true, items: repeated, queries: ['가가가'] },
    {
      name: 'candidate-160',
      recordOnly: true,
      items: candidates((index) => items[index].padEnd(160, '가나다 ')),
      queries: ['ㅎㄱ'],
      limit: 20,
    },
    { name: 'query-5000', recordOnly: true, items, queries: ['가'.repeat(5000)], limit: 20 },
  ];
}

export function sampleScenario(createSearcher, scenario) {
  const { name, recordOnly, items, queries, limit } = scenario;
  const options = limit === undefined ? undefined : { limit };
  const clock = globalThis.performance;
  const start = clock.now();
  const search = createSearcher(items);
  const creationMs = clock.now() - start;
  let checksum = 0;

  return {
    name,
    recordOnly,
    candidates: items.length,
    limit: limit ?? null,
    creationMs,
    warmups: WARMUPS,
    samples: SAMPLES,
    queries: queries.map((query) => {
      const times = [];
      let hits;
      let firstRange;
      let lastRange;
      for (let i = -WARMUPS; i < SAMPLES; i++) {
        const start = clock.now();
        const results = search(query, options);
        const elapsed = clock.now() - start;
        hits = results.length;
        firstRange = results[0]?.ranges[0] ?? null;
        lastRange = results.at(-1)?.ranges.at(-1) ?? null;
        checksum +=
          hits + (firstRange?.[0] ?? 0) + (firstRange?.[1] ?? 0) + (lastRange?.[0] ?? 0) + (lastRange?.[1] ?? 0);
        if (i >= 0) times.push(elapsed);
      }
      times.sort((a, b) => a - b);
      const percentile = (fraction) => times[Math.ceil(fraction * times.length) - 1];
      return {
        query,
        hits,
        firstRange,
        lastRange,
        p50: percentile(0.5),
        p95: percentile(0.95),
        p99: percentile(0.99),
        max: times.at(-1),
      };
    }),
    checksum,
  };
}

async function measureNode(process) {
  const { createSearcher } = await import('../dist/index.mjs');
  const scenarios = makeScenarios(SEED);
  const gc = globalThis.gc;
  if (!gc) throw new Error('Run the Node measurement with node --expose-gc.');
  const measurements = scenarios.map((scenario) => {
    const result = sampleScenario(createSearcher, scenario);
    gc();
    const before = process.memoryUsage().heapUsed;
    const search = createSearcher(scenario.items);
    gc();
    const after = process.memoryUsage().heapUsed;
    const retainedHeapMiB = (after - before) / 1024 ** 2;
    // Keep the index reachable through the second collection.
    search('', { limit: 1 });
    return { ...result, retainedHeapMiB };
  });
  return { runtime: process.version, measurements };
}

async function measureChromium() {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const origin = 'http://localhost';
    await page.route(origin + '/', (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html>' }));
    const { readFile } = await import('node:fs/promises');
    const { URL } = await import('node:url');
    for (const path of ['/bench/measure-search.mjs', '/dist/browser.mjs']) {
      const body = await readFile(new URL('..' + path, import.meta.url));
      await page.route(origin + path, (route) => route.fulfill({ contentType: 'text/javascript', body }));
    }
    await page.goto(origin);
    const measurements = await page.evaluate(async (seed) => {
      const { makeScenarios, sampleScenario } = await import('/bench/measure-search.mjs');
      const { createSearcher } = await import('/dist/browser.mjs');
      return makeScenarios(seed).map((scenario) => sampleScenario(createSearcher, scenario));
    }, SEED);
    const budgetMisses = measurements
      .filter((measurement) => !measurement.recordOnly)
      .flatMap(({ name, queries }) =>
        queries.filter(({ p95 }) => p95 > BUDGET_MS).map(({ query, p95 }) => ({ scenario: name, query, p95 }))
      );
    return { runtime: browser.version(), measurements, localBudgetMet: budgetMisses.length === 0, budgetMisses };
  } finally {
    await browser.close();
  }
}

if (typeof globalThis.process !== 'undefined') {
  const { default: process } = await import('node:process');
  const { pathToFileURL } = await import('node:url');
  if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
    const mode = process.argv[2];
    if (mode !== 'node' && mode !== 'chromium') throw new Error('Specify node or chromium.');
    const { cpus, release, totalmem } = await import('node:os');
    const result = mode === 'node' ? await measureNode(process) : await measureChromium();
    const device = {
      platform: process.platform,
      release: release(),
      arch: process.arch,
      cpu: cpus()[0]?.model,
      logicalCpus: cpus().length,
      memoryGiB: totalmem() / 1024 ** 3,
    };
    process.stdout.write(JSON.stringify({ mode, seed: SEED, device, budgetMs: BUDGET_MS, ...result }, null, 2) + '\n');
    if (mode === 'chromium' && !result.localBudgetMet) {
      for (const { scenario, query, p95 } of result.budgetMisses) {
        process.stderr.write(
          `${scenario} ${JSON.stringify(query)}: p95 ${p95.toFixed(2)} ms exceeds ${BUDGET_MS} ms\n`
        );
      }
      process.exitCode = 1;
    }
  }
}
