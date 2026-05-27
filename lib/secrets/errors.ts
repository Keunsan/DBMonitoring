/** Secret Resolver 전용 오류 코드와 사용자 메시지입니다. */

import { ApiRouteError } from "@/lib/api";

export type ConnectionSecretErrorCode =
  | "DB_CONNECTION_SECRET_NOT_FOUND"
  | "DB_CONNECTION_SECRET_INVALID"
  | "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE"
  | "DB_CONNECTION_NETWORK_FAILED"
  | "DB_CONNECTION_LOGIN_FAILED"
  | "DB_CONNECTION_TEST_FAILED";

/**
 * Secret 관련 API 오류를 생성합니다.
 */
export const connectionSecretError = (
  code: ConnectionSecretErrorCode,
  message: string,
  status: number,
  cause?: unknown,
  meta?: Record<string, unknown>,
) =>
  new ApiRouteError({
    code,
    message,
    status,
    cause,
    meta,
  });

/**
 * 드라이버 오류 코드를 사용자용 연결 실패 메시지로 변환합니다.
 */
export const getDbConnectionFailureMessage = (error: unknown): string => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "ELOGIN" || code === "ORA-01017" || code === "NJS-007") {
    return "DB 로그인에 실패했습니다. 계정, 비밀번호, DB 권한을 확인해주세요.";
  }

  if (
    code === "ETIMEOUT" ||
    code === "ESOCKET" ||
    code === "EINSTLOOKUP" ||
    code === "ORA-12170" ||
    code === "ORA-12541"
  ) {
    return "DB에 접속할 수 없습니다. 호스트, 포트, 방화벽, VPN, TLS 설정을 확인해주세요.";
  }

  if (error instanceof ApiRouteError) {
    return error.message;
  }

  return "DB 연결 확인 중 오류가 발생했습니다. 서버 로그와 연결 설정을 확인해주세요.";
};

/**
 * 드라이버 오류를 분류된 API 오류로 변환합니다.
 */
export const toConnectionTestApiError = (error: unknown) => {
  if (error instanceof ApiRouteError) {
    return error;
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  if (code === "ELOGIN" || code === "ORA-01017" || code === "NJS-007") {
    return connectionSecretError(
      "DB_CONNECTION_LOGIN_FAILED",
      getDbConnectionFailureMessage(error),
      502,
      error,
    );
  }

  if (
    code === "ETIMEOUT" ||
    code === "ESOCKET" ||
    code === "EINSTLOOKUP" ||
    code === "ORA-12170" ||
    code === "ORA-12541"
  ) {
    return connectionSecretError(
      "DB_CONNECTION_NETWORK_FAILED",
      getDbConnectionFailureMessage(error),
      502,
      error,
    );
  }

  return connectionSecretError(
    "DB_CONNECTION_TEST_FAILED",
    getDbConnectionFailureMessage(error),
    502,
    error,
  );
};
