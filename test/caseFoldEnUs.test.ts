import { describe, expect, it } from 'vitest';
import { matchSubsequenceKo } from '../src/score/subsequence';
import { caseFoldEnUs } from '../src/util/caseFoldEnUs';

describe('caseFoldEnUs', () => {
  it('uses en-US locale (not default locale) for Latin', () => {
    expect(caseFoldEnUs('FOO')).toBe('foo');
    expect(caseFoldEnUs('İ')).toBe('i\u0307');
  });

  it('allows ASCII query to match dotted capital I in haystack when case-insensitive', () => {
    expect(matchSubsequenceKo('i', 'İ', { caseSensitive: false }).ok).toBe(true);
  });
});
