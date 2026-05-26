/** API 목록 조회에 사용할 공통 페이징 파라미터 헬퍼입니다. */

import type { ApiMeta } from "@/types/api";

export type PaginationParams = {
  page: number;
  pageSize: number;
  offset: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const toPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

/**
 * URLSearchParams에서 page/pageSize를 읽어 안전한 페이징 값으로 변환합니다.
 */
export const parsePaginationParams = (
  searchParams: URLSearchParams,
): PaginationParams => {
  const page = toPositiveInt(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = Math.min(
    toPositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );

  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
};

/**
 * 목록 응답의 meta 필드를 생성합니다.
 */
export const createPaginationMeta = (
  params: PaginationParams,
  total?: number,
): ApiMeta => ({
  page: params.page,
  pageSize: params.pageSize,
  ...(total !== undefined ? { total } : {}),
});
