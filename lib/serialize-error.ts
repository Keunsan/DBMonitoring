/** 로그 출력용 오류 객체를 직렬화합니다. */

/**
 * Error 또는 Supabase/DB 오류를 로그에 안전하게 기록할 수 있는 형태로 변환합니다.
 */
export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error !== null) {
    return error;
  }

  return { value: String(error) };
};
