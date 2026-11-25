import process from 'node:process';
import { describe, test } from 'vitest';
import { createSearcher } from '../dist/index.mjs';
import { makeScenarios } from './measure-search.mjs';

function registerBenchmark(name: string, workload: () => unknown): void {
  test(name, async ({ bench }) => {
    const result = await bench(name, workload).run();
    process.stdout.write(`${name}: ${result.throughput.mean.toFixed(2)} ops/s\n`);
  });
}

const [scenario] = makeScenarios(42);

describe('createSearcher', () => {
  registerBenchmark('10K candidates, create searcher', () => createSearcher(scenario.items));

  const search = createSearcher(scenario.items);
  const options = { limit: scenario.limit };
  for (const [label, query] of [
    ['mixed', '홍길'],
    ['high-hit', 'ㄱ'],
    ['no match', 'zzzz'],
  ]) {
    registerBenchmark(`10K candidates, ${label}`, () => {
      const results = search(query!, options);
      const first = results[0]?.ranges[0];
      const last = results.at(-1)?.ranges.at(-1);
      return results.length + (first?.[0] ?? 0) + (first?.[1] ?? 0) + (last?.[0] ?? 0) + (last?.[1] ?? 0);
    });
  }
});
