/** SQL 상세 분석 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { getSqlDetailView } from "@/lib/analysis/sql-detail";
import type { DbInstanceId } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    sqlId: string;
  }>;
};

/**
 * SQL ID 기준 상세 분석 데이터를 반환합니다.
 */
export const GET = async (request: Request, { params }: RouteContext) => {
  const { sqlId } = await params;

  return withApiHandler(async ({ request: apiRequest }) => {
    const url = new URL(apiRequest.url);
    const dbInstanceId = url.searchParams.get("dbInstanceId") as DbInstanceId | null;

    if (!dbInstanceId) {
      throw new Error("dbInstanceId가 필요합니다.");
    }

    const detail = await getSqlDetailView(dbInstanceId, decodeURIComponent(sqlId));

    return { data: { detail } };
  })(request);
};
