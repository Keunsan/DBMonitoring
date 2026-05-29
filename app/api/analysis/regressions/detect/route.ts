/** SQL 성능 회귀 탐지 실행 API입니다. */

import { withApiHandler } from "@/lib/api";
import { detectSqlRegressions } from "@/lib/analysis/sql-regression";
import { readJsonObject } from "@/lib/validation";
import type { DbInstanceId } from "@/types/domain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 지정 DB 인스턴스에 대해 회귀 탐지를 실행하고 결과를 저장합니다.
 */
export const POST = withApiHandler(async ({ request }) => {
  const payload = await readJsonObject(request);
  const dbInstanceId = payload.dbInstanceId as DbInstanceId | undefined;

  if (!dbInstanceId || typeof dbInstanceId !== "string") {
    throw new Error("dbInstanceId가 필요합니다.");
  }

  const result = await detectSqlRegressions(dbInstanceId);

  return {
    data: result,
  };
});
