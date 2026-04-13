/**
 * Latin/ASCII case folding using the `en-US` locale (`toLocaleLowerCase`).
 * Avoids locale-dependent surprises (e.g. Turkish dotted/dotless I) that affect `toLowerCase()`.
 */
export function caseFoldEnUs(s: string): string {
  return s.toLocaleLowerCase('en-US');
}
