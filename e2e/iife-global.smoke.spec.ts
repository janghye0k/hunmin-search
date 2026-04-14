import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iifeBundle = join(root, 'dist', 'index.global.cjs');

test.describe('dist IIFE (hangulSearch global)', () => {
  test('exposes searchHangulRanked on globalThis after script load', async ({ page }) => {
    await page.addScriptTag({ path: iifeBundle });
    const t = await page.evaluate(() => {
      const g = globalThis as unknown as { hangulSearch?: { searchHangulRanked?: unknown } };
      return typeof g.hangulSearch?.searchHangulRanked;
    });
    expect(t).toBe('function');
  });

  test('searchHangulRanked returns expected hit for hangul query', async ({ page }) => {
    await page.addScriptTag({ path: iifeBundle });
    const first = await page.evaluate(() => {
      const g = globalThis as unknown as {
        hangulSearch?: { searchHangulRanked?: (q: string, c: string[]) => unknown };
      };
      const hits = g.hangulSearch?.searchHangulRanked?.('홍길', ['홍길동', '서울']) as { value?: string }[];
      return hits?.[0]?.value;
    });
    expect(first).toBe('홍길동');
  });
});
