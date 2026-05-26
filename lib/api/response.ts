/** Route Handler용 공통 API 응답 헬퍼입니다. */

import type { ApiError, ApiMeta, ApiResponse } from "@/types/api";

/**
 * 성공 응답 본문을 생성합니다.
 * @param data - 응답 데이터
 * @param meta - 페이징 등 메타 정보
 */
export const apiSuccess = <T>(data: T, meta?: ApiMeta): ApiResponse<T> => ({
  data,
  error: null,
  ...(meta ? { meta } : {}),
});

/**
 * 실패 응답 본문을 생성합니다. message는 사용자에게 노출할 한글 메시지입니다.
 */
export const apiFailure = (
  code: string,
  message: string,
  meta?: ApiMeta,
): ApiResponse<null> => ({
  data: null,
  error: { code, message } satisfies ApiError,
  ...(meta ? { meta } : {}),
});
