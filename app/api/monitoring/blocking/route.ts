/** 수집된 Blocking 스냅샷 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listBlockingSnapshots } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseLimit = (value: string | null) => {
  const parsed = value ? Number(value) : 100;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;
};

/**
 * DB 인스턴스 조건에 맞는 최근 Blocking 스냅샷을 반환합니다.
 */
export const GET = withApiHandler(({ request }) => {
  const url = new URL(request.url);

  return {
    data: {
      items: listBlockingSnapshots(
        url.searchParams.get("dbInstanceId") ?? undefined,
        parseLimit(url.searchParams.get("limit")),
      ),
    },
  };
});
