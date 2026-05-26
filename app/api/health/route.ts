/** API·앱 상태 확인 (T-007에서 인증·DB 연동 확장)입니다. */

import { withApiHandler } from "@/lib/api";
import { getDbClientStatus } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API 프로세스와 운영 DB 클라이언트 설정 상태를 반환합니다.
 */
export const GET = withApiHandler(() => {
  return {
    data: {
      status: "ok",
      service: "dbmonitoring-api",
      db: getDbClientStatus(),
      timestamp: new Date().toISOString(),
    },
  };
});
