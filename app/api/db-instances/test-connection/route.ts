/** 등록 전 DB 인스턴스 입력값 기반 연결 테스트 API입니다. */

import { withApiHandler } from "@/lib/api";
import { testPrecreateDbInstanceConnection } from "@/lib/inventory/precreate-connection-test";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 아직 저장하지 않은 DB 인스턴스와 접속 계정으로 연결 테스트를 수행합니다.
 */
export const POST = withApiHandler(async ({ request }) => {
  const payload = await readJsonObject(request);

  return {
    data: await testPrecreateDbInstanceConnection(payload),
  };
});
