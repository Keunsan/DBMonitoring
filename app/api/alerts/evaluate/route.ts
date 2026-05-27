/** 알림 정책 평가 API입니다. */

import { withApiHandler } from "@/lib/api";
import { evaluateAlertPolicies } from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 최신 수집 데이터에 임계치 정책을 적용해 알림 후보를 생성합니다.
 */
export const POST = withApiHandler(async () => ({
  data: await evaluateAlertPolicies(),
}));
