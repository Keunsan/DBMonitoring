/** 수집된 시계열 지표 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listMetricHistory } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseLimit = (value: string | null) => {
  const parsed = value ? Number(value) : 200;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 1_000) : 200;
};

/**
 * DB 인스턴스와 지표명 조건에 맞는 최근 지표 이력을 반환합니다.
 */
export const GET = withApiHandler(async ({ request }) => {
  const url = new URL(request.url);

  return {
    data: {
      items: await listMetricHistory({
        dbInstanceId: url.searchParams.get("dbInstanceId") ?? undefined,
        metricName: url.searchParams.get("metricName") ?? undefined,
        limit: parseLimit(url.searchParams.get("limit")),
      }),
    },
  };
});
