/** 알림 이벤트 확인 처리 API입니다. */

import { ApiRouteError, withApiHandler } from "@/lib/api";
import { acknowledgeAlertEvent } from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * 알림 이벤트를 확인 처리합니다.
 */
export const POST = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(() => {
    try {
      return {
        data: acknowledgeAlertEvent(id),
      };
    } catch (error) {
      throw new ApiRouteError({
        code: "ALERT_ACK_FAILED",
        message:
          error instanceof Error ? error.message : "알림 확인 처리에 실패했습니다.",
        status: 400,
      });
    }
  })(request);
};
