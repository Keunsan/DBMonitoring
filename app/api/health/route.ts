/** API·앱 상태 확인 (T-007에서 인증·DB 연동 확장)입니다. */

import { apiSuccess } from "@/lib/api";
import { getDbClientStatus } from "@/lib/db";

export const GET = async () => {
  return Response.json(
    apiSuccess({
      status: "ok",
      service: "dbmonitoring-api",
      db: getDbClientStatus(),
      timestamp: new Date().toISOString(),
    }),
  );
};
