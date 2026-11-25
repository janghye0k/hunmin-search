import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iifeBundle = join(root, 'dist', 'index.iife.js');

test.describe('dist IIFE (HunminSearch global)', () => {
  test('exposes createSearcher on globalThis after script load', async ({ page }) => {
    await page.addScriptTag({ path: iifeBundle });
    const t = await page.evaluate(() => {
      const g = globalThis as unknown as { HunminSearch?: { createSearcher?: unknown } };
      return typeof g.HunminSearch?.createSearcher;
    });
    expect(t).toBe('function');
  });

  test('createSearcher returns expected hit for hangul query', async ({ page }) => {
    await page.addScriptTag({ path: iifeBundle });
    const first = await page.evaluate(() => {
      const g = globalThis as unknown as {
        HunminSearch: { createSearcher: (items: string[]) => (query: string) => { item: string }[] };
      };
      return g.HunminSearch.createSearcher(['홍길동', '서울'])('홍길')[0]?.item;
    });
    expect(first).toBe('홍길동');
  });
});
