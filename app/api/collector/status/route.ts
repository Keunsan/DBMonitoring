/** Collector 스케줄러 상태 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listSchedulerStatuses } from "@/services/collector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 활성 DB 인스턴스별 Collector 실행 상태를 반환합니다.
 */
export const GET = withApiHandler(async () => ({
  data: {
    items: await listSchedulerStatuses(),
  },
}));
