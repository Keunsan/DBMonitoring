/** 임계치 정책 목록 조회와 등록 API입니다. */

import { ApiRouteError, withApiHandler } from "@/lib/api";
import { readJsonObject } from "@/lib/validation";
import {
  createThresholdPolicy,
  listThresholdPolicies,
  type ThresholdMetricKey,
  type ThresholdPolicyInput,
  type ThresholdScopeType,
} from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") {
    return value;
  }

  return fallback;
};

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePolicyInput = (payload: Record<string, unknown>): ThresholdPolicyInput => {
  const scopeType = String(payload.scopeType ?? "GLOBAL") as ThresholdScopeType;
  const metricKey = String(payload.metricKey ?? "") as ThresholdMetricKey;
  const comparison = String(payload.comparison ?? "GTE") as "GTE" | "LTE";

  if (!["GLOBAL", "BUSINESS_SYSTEM", "DB_INSTANCE"].includes(scopeType)) {
    throw new ApiRouteError({
      code: "INVALID_THRESHOLD_SCOPE",
      message: "임계치 적용 범위가 올바르지 않습니다.",
      status: 400,
    });
  }

  if (!["GTE", "LTE"].includes(comparison)) {
    throw new ApiRouteError({
      code: "INVALID_THRESHOLD_COMPARISON",
      message: "임계치 비교 방식이 올바르지 않습니다.",
      status: 400,
    });
  }

  if (!metricKey) {
    throw new ApiRouteError({
      code: "INVALID_THRESHOLD_METRIC",
      message: "임계치 지표를 선택해주세요.",
      status: 400,
    });
  }

  return {
    scopeType,
    scopeId: typeof payload.scopeId === "string" ? payload.scopeId : null,
    metricKey,
    warningThreshold: parseNumber(payload.warningThreshold, 0),
    criticalThreshold: parseNumber(payload.criticalThreshold, 0),
    comparison,
    durationSec: parseNumber(payload.durationSec, 60),
    isActive: parseBoolean(payload.isActive, true),
    description: String(payload.description ?? metricKey),
  };
};

/**
 * 임계치 정책 목록을 반환합니다.
 */
export const GET = withApiHandler(() => ({
  data: {
    items: listThresholdPolicies(),
  },
}));

/**
 * 임계치 정책을 등록합니다.
 */
export const POST = withApiHandler(async ({ request }) => {
  const payload = await readJsonObject(request);

  try {
    return {
      data: createThresholdPolicy(parsePolicyInput(payload)),
      status: 201,
    };
  } catch (error) {
    throw new ApiRouteError({
      code: "THRESHOLD_POLICY_CREATE_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "임계치 정책 등록에 실패했습니다.",
      status: 400,
    });
  }
});
