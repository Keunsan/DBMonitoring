/** API 오류를 안전한 사용자 메시지로 변환하기 위한 공통 오류 타입입니다. */

import type { ApiMeta } from "@/types/api";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "VALIDATION_FAILED"
  | "INTERNAL_SERVER_ERROR"
  | "SERVICE_UNAVAILABLE";

type ApiErrorOptions = {
  code: ApiErrorCode | string;
  message: string;
  status?: number;
  meta?: ApiMeta;
  cause?: unknown;
};

/**
 * Route Handler에서 예상 가능한 실패를 표현합니다.
 */
export class ApiRouteError extends Error {
  code: string;
  status: number;
  meta?: ApiMeta;
  cause?: unknown;

  constructor({ code, message, status = 500, meta, cause }: ApiErrorOptions) {
    super(message);
    this.name = "ApiRouteError";
    this.code = code;
    this.status = status;
    this.meta = meta;
    this.cause = cause;
  }
}

/**
 * 입력 검증 실패 오류를 생성합니다.
 */
export const badRequest = (message: string, meta?: ApiMeta) =>
  new ApiRouteError({
    code: "BAD_REQUEST",
    message,
    status: 400,
    meta,
  });

/**
 * 리소스를 찾을 수 없는 오류를 생성합니다.
 */
export const notFound = (message = "요청한 리소스를 찾을 수 없습니다.") =>
  new ApiRouteError({
    code: "NOT_FOUND",
    message,
    status: 404,
  });

/**
 * 일시적인 서비스 실패 오류를 생성합니다.
 */
export const serviceUnavailable = (
  message = "서비스를 일시적으로 사용할 수 없습니다.",
  meta?: ApiMeta,
  cause?: unknown,
) =>
  new ApiRouteError({
    code: "SERVICE_UNAVAILABLE",
    message,
    status: 503,
    meta,
    cause,
  });

/**
 * 값이 공통 API 오류인지 확인합니다.
 */
export const isApiRouteError = (error: unknown): error is ApiRouteError =>
  error instanceof ApiRouteError;
