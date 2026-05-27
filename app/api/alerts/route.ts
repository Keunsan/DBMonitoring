/** 알림 이벤트 목록 조회 API입니다. */

import { withApiHandler } from "@/lib/api";
import { listAlertEvents } from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 생성된 알림 이벤트 목록을 반환합니다.
 */
export const GET = withApiHandler(() => ({
  data: {
    items: listAlertEvents(),
  },
}));
