/**
 * Latin/ASCII case folding using the `en-US` locale (`toLocaleLowerCase`).
 * Avoids locale-dependent surprises (e.g. Turkish dotted/dotless I) that affect `toLowerCase()`.
 *
 * 터키어 로케일 등에서 생기는 `I`/`ı` 문제를 피하려고 `en-US` 접기를 씁니다. 한글에는 영향이 없습니다.
 */
export function caseFoldEnUs(s: string): string {
  return s.toLocaleLowerCase('en-US');
}
