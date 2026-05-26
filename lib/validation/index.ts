/** 입력 검증 스키마·헬퍼 진입점입니다. */

import { badRequest } from "@/lib/api/errors";

/**
 * API 요청 본문이 객체인지 확인합니다.
 */
export const assertJsonObject = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * JSON 요청 본문을 객체로 읽고, 실패 시 한글 오류를 반환합니다.
 */
export const readJsonObject = async (
  request: Request,
): Promise<Record<string, unknown>> => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch (error) {
    throw badRequest("요청 본문이 올바른 JSON 형식이 아닙니다.", {
      reason: error instanceof Error ? error.name : "InvalidJson",
    });
  }

  if (!assertJsonObject(payload)) {
    throw badRequest("요청 본문은 JSON 객체 형식이어야 합니다.");
  }

  return payload;
};
