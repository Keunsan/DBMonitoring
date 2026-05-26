/** 개발 환경에서 ERP 테스트 DB 연결 상태를 확인하는 API입니다. */

import { ApiRouteError, notFound, withApiHandler } from "@/lib/api";
import {
  getErpConnectionFailureMessage,
  getErpTestDbConfig,
  testErpTestDbConnection,
} from "@/lib/db/erp-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * ERP 테스트 DB 연결 확인 결과를 반환합니다.
 */
export const GET = withApiHandler(async () => {
  if (process.env.NODE_ENV === "production") {
    throw notFound();
  }

  const configResult = getErpTestDbConfig();

  if (!configResult.configured) {
    throw new ApiRouteError({
      code: "ERP_TEST_DB_NOT_CONFIGURED",
      message: "ERP 테스트 DB 환경 변수가 설정되지 않았습니다.",
      status: 400,
      meta: {
        missingKeys: configResult.missingKeys,
      },
    });
  }

  try {
    const connection = await testErpTestDbConnection();

    return {
      data: {
        status: "connected",
        target: connection.target,
        info: connection.info,
        checkedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "UNKNOWN";

    console.error("[ERP_TEST_DB_CONNECTION_FAILED]", {
      name: error instanceof Error ? error.name : "UnknownError",
      code,
    });

    throw new ApiRouteError({
      code: "ERP_TEST_DB_CONNECTION_FAILED",
      message: getErpConnectionFailureMessage(error),
      status: 502,
      cause: error,
    });
  }
});
