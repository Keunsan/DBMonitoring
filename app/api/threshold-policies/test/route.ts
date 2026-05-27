/** 임계치 정책 테스트 API입니다. */

import { withApiHandler } from "@/lib/api";
import { testThresholdPolicies } from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 특정 DB 인스턴스의 최근 수집 데이터에 정책을 적용한 결과를 반환합니다.
 */
export const GET = withApiHandler(({ request }) => {
  const url = new URL(request.url);
  const dbInstanceId = url.searchParams.get("dbInstanceId");

  return {
    data: {
      items: dbInstanceId ? testThresholdPolicies(dbInstanceId) : [],
    },
  };
});
