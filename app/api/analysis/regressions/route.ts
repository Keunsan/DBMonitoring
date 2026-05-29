/** SQL 성능 회귀 이벤트 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listSqlRegressionEvents } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseLimit = (value: string | null) => {
  const parsed = value ? Number(value) : 100;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;
};

/**
 * 저장된 SQL 성능 회귀 이벤트 목록을 반환합니다.
 */
export const GET = withApiHandler(async ({ request }) => {
  const url = new URL(request.url);

  return {
    data: {
      items: await listSqlRegressionEvents(
        url.searchParams.get("dbInstanceId") ?? undefined,
        parseLimit(url.searchParams.get("limit")),
      ),
    },
  };
});
