import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const esmBundle = readFileSync(join(root, 'dist', 'index.browser.js'), 'utf8');
const origin = 'https://hunmin.test';

test.describe('dist ESM browser bundle (hunmin-search/browser)', () => {
  test('can be loaded as a module and exposes named exports', async ({ page }) => {
    await page.route(`${origin}/**`, async (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname === '/') {
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' });
      }
      if (pathname === '/index.browser.js') {
        return route.fulfill({ contentType: 'text/javascript', body: esmBundle });
      }
      return route.abort();
    });
    await page.goto(`${origin}/`);

    const result = await page.evaluate(async (url) => {
      const mod = await import(/* @vite-ignore */ url);
      return {
        type: typeof mod.searchKoRanked,
        first: mod.searchKoRanked('홍길', ['홍길동', '서울'])[0]?.value,
      };
    }, `${origin}/index.browser.js`);

    expect(result).toEqual({ type: 'function', first: '홍길동' });
  });
});
