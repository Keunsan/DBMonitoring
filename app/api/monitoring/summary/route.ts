/** 실시간 모니터링 요약 조회 API입니다. */

import { listDbInstances } from "@/lib/inventory/store";
import { withApiHandler } from "@/lib/api";
import { getMonitoringSummary } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DB 인스턴스별 최신 수집 요약을 반환합니다.
 */
export const GET = withApiHandler(async () => {
  const instances = await listDbInstances();
  const items = await Promise.all(
    instances.map(async (instance) => ({
      instance,
      summary: await getMonitoringSummary(instance.id),
    })),
  );

  return {
    data: { items },
  };
});
