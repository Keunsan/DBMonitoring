/** Collector 실행 이력 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listCollectionRuns } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 최근 Collector 실행 이력을 반환합니다.
 */
export const GET = withApiHandler(({ request }) => {
  const url = new URL(request.url);

  return {
    data: {
      items: listCollectionRuns(url.searchParams.get("dbInstanceId") ?? undefined),
    },
  };
});
