/**
 * Latin/ASCII case folding using the `en-US` locale (`toLocaleLowerCase`).
 * Avoids locale-dependent surprises (e.g. Turkish dotted/dotless I) that affect `toLowerCase()`.
 *
 * 터키어 로케일 등에서 생기는 `I`/`ı` 문제를 피하려고 `en-US` 접기를 씁니다. 한글에는 영향이 없습니다.
 */
export function caseFoldEnUs(s: string): string {
  return s.toLocaleLowerCase('en-US');
}

/**
 * Folded text plus an optional map from each folded UTF-16 unit to the original UTF-16 index.
 * `origIndex` is absent when folding kept the length (identity).
 *
 * 접힌 문자열과, 접힌 유닛마다 원문 UTF-16 위치를 가리키는 선택적 표입니다. 길이가 같으면 표가 없고 항등입니다.
 */
export interface FoldedText {
  text: string;
  origIndex?: number[];
}

/**
 * Folds the whole string once (keeps context rules such as final sigma) and maps folded units to original indices.
 * The map uses only per-code-point folded *lengths*, never the per-code-point text.
 *
 * 전체 문자열을 한 번 접고, 코드 포인트별 접힌 길이만으로 위치 표를 만듭니다. 길이가 늘어난 문자(`İ`)의 모든 유닛은 원문 위치 하나를 가리킵니다.
 */
export function foldWithMap(s: string): FoldedText {
  const text = caseFoldEnUs(s);
  if (text.length === s.length) return { text }; // folding never shrinks, so equal length means no expansion

  const origIndex: number[] = [];
  let pos = 0;
  for (const ch of s) {
    const foldedLen = caseFoldEnUs(ch).length;
    for (let k = 0; k < foldedLen; k++) {
      origIndex.push(foldedLen === ch.length ? pos + k : pos);
    }
    pos += ch.length;
  }
  return { text, origIndex };
}

/** `caseSensitive` ? the string as is : {@link foldWithMap}. */
export function prepareText(s: string, caseSensitive: boolean): FoldedText {
  return caseSensitive ? { text: s } : foldWithMap(s);
}

/** Original UTF-16 index for folded unit `i`. */
export function originalIndex(f: FoldedText, i: number): number {
  return f.origIndex ? f.origIndex[i]! : i;
}
