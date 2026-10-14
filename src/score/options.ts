export const DEFAULT_SIMILAR_COST = 0.01;

/**
 * Validates `similarSubstitutionCost`: `undefined` → default, finite number >= 0 → as is, anything else → `RangeError`.
 *
 * 유사 치환 비용 검증: 생략/`undefined`는 기본값, 유한한 0 이상의 수는 그대로, 그 외는 `RangeError`입니다.
 */
export function resolveSimilarCost(value: unknown): number {
  if (value === undefined) return DEFAULT_SIMILAR_COST;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`similarSubstitutionCost must be a finite number >= 0 (received ${String(value)})`);
  }
  return value;
}
