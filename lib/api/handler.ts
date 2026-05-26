/** Next.js Route Handler를 공통 응답 규약으로 감싸는 헬퍼입니다. */

import { isApiRouteError } from "@/lib/api/errors";
import { jsonFailure, jsonSuccess } from "@/lib/api/response";
import type { ApiMeta } from "@/types/api";

export type ApiRouteContext = {
  request: Request;
  requestId: string;
};

export type ApiRouteResult<T> = {
  data: T;
  status?: number;
  meta?: ApiMeta;
};

type ApiRouteHandler<T> = (context: ApiRouteContext) => Promise<ApiRouteResult<T>> | ApiRouteResult<T>;

const createRequestId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const logUnexpectedApiError = (requestId: string, error: unknown) => {
  console.error("[API_UNEXPECTED_ERROR]", {
    requestId,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown error",
  });
};

/**
 * Route Handler의 성공/실패 응답과 예외 처리를 표준화합니다.
 */
export const withApiHandler =
  <T>(handler: ApiRouteHandler<T>) =>
  async (request: Request): Promise<Response> => {
    const requestId = createRequestId();

    try {
      const result = await handler({ request, requestId });
      return jsonSuccess(result.data, {
        status: result.status,
        meta: {
          requestId,
          ...result.meta,
        },
      });
    } catch (error) {
      if (isApiRouteError(error)) {
        return jsonFailure(error.code, error.message, {
          status: error.status,
          meta: {
            requestId,
            ...error.meta,
          },
        });
      }

      logUnexpectedApiError(requestId, error);

      return jsonFailure(
        "INTERNAL_SERVER_ERROR",
        "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        {
          status: 500,
          meta: { requestId },
        },
      );
    }
  };
