/** API 공통 응답 규약 타입입니다 (T-007에서 Route Handler에 적용). */

export type ApiError = {
  code: string;
  message: string;
};

export type ApiMeta = {
  page?: number;
  pageSize?: number;
  total?: number;
  [key: string]: unknown;
};

export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
};

export type ApiSuccess<T> = {
  data: T;
  error: null;
  meta?: ApiMeta;
};

export type ApiFailure = {
  data: null;
  error: ApiError;
  meta?: ApiMeta;
};
