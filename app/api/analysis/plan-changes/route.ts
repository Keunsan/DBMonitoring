/** 실행 계획 변경 분석 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { analyzePlanChanges } from "@/lib/analysis/plan-changes";
import type { DbInstanceId } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseLimit = (value: string | null) => {
  const parsed = value ? Number(value) : 50;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 50;
};

/**
 * plan hash 변경 전후 성능 비교 결과를 반환합니다.
 */
export const GET = withApiHandler(async ({ request }) => {
  const url = new URL(request.url);
  const dbInstanceId = url.searchParams.get("dbInstanceId") as DbInstanceId | null;

  if (!dbInstanceId) {
    throw new Error("dbInstanceId가 필요합니다.");
  }

  return {
    data: {
      items: await analyzePlanChanges(dbInstanceId, parseLimit(url.searchParams.get("limit"))),
    },
  };
});
