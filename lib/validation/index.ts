/** 입력 검증 스키마·헬퍼 진입점 (T-007 Zod 연동 예정)입니다. */

/**
 * API 요청 본문이 객체인지 확인합니다.
 */
export const assertJsonObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
