import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iifeBundle = join(root, 'dist', 'index.iife.js');

test.describe('dist IIFE (HunminSearch global)', () => {
  test('exposes createSearcher and finds a Korean name by its initials', async ({ page }) => {
    await page.addScriptTag({ path: iifeBundle });
    const result = await page.evaluate(() => {
      const api = (
        globalThis as typeof globalThis & {
          HunminSearch?: typeof import('../src');
        }
      ).HunminSearch;
      const search = api?.createSearcher?.(['홍길동', '서울']);
      return { createSearcherType: typeof api?.createSearcher, first: search?.('ㅎㄱ')[0]?.item };
    });
    expect(result.createSearcherType).toBe('function');
    expect(result.first).toBe('홍길동');
  });
});
