/** 수집된 Deadlock 이벤트 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listDeadlockEvents } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DB 인스턴스 조건에 맞는 최근 Deadlock 이벤트를 반환합니다.
 */
export const GET = withApiHandler(({ request }) => {
  const url = new URL(request.url);

  return {
    data: {
      items: listDeadlockEvents(url.searchParams.get("dbInstanceId") ?? undefined),
    },
  };
});
