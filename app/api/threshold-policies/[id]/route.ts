/** 임계치 정책 수정·삭제 API입니다. */

import { ApiRouteError, withApiHandler } from "@/lib/api";
import { readJsonObject } from "@/lib/validation";
import {
  deleteThresholdPolicy,
  updateThresholdPolicy,
  type ThresholdMetricKey,
  type ThresholdPolicyInput,
  type ThresholdScopeType,
} from "@/services/alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parsePolicyInput = (payload: Record<string, unknown>): ThresholdPolicyInput => ({
  scopeType: String(payload.scopeType ?? "GLOBAL") as ThresholdScopeType,
  scopeId: typeof payload.scopeId === "string" ? payload.scopeId : null,
  metricKey: String(payload.metricKey ?? "") as ThresholdMetricKey,
  warningThreshold: parseNumber(payload.warningThreshold, 0),
  criticalThreshold: parseNumber(payload.criticalThreshold, 0),
  comparison: String(payload.comparison ?? "GTE") as "GTE" | "LTE",
  durationSec: parseNumber(payload.durationSec, 60),
  isActive: typeof payload.isActive === "boolean" ? payload.isActive : true,
  description: String(payload.description ?? payload.metricKey ?? ""),
});

/**
 * 임계치 정책을 수정합니다.
 */
export const PATCH = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async ({ request: apiRequest }) => {
    const payload = await readJsonObject(apiRequest);

    try {
      return {
        data: updateThresholdPolicy(id, parsePolicyInput(payload)),
      };
    } catch (error) {
      throw new ApiRouteError({
        code: "THRESHOLD_POLICY_UPDATE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "임계치 정책 수정에 실패했습니다.",
        status: 400,
      });
    }
  })(request);
};

/**
 * 임계치 정책을 삭제합니다.
 */
export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(() => {
    try {
      deleteThresholdPolicy(id);
      return {
        data: {
          deleted: true,
        },
      };
    } catch (error) {
      throw new ApiRouteError({
        code: "THRESHOLD_POLICY_DELETE_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "임계치 정책 삭제에 실패했습니다.",
        status: 400,
      });
    }
  })(request);
};
