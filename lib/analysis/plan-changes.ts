/** 실행 계획 변경 분석 결과를 계산합니다. */

import { listSqlPlanSnapshots } from "@/services/storage";
import type { SqlPlanSnapshotRecord } from "@/services/storage/types";
import type { DbInstanceId } from "@/types/domain";

export type PlanChangeInsight = {
  sqlId: string;
  currentPlanHash: string;
  previousPlanHash: string | null;
  currentAvgElapsedMs: number;
  previousAvgElapsedMs: number | null;
  currentTotalCpuMs: number;
  previousTotalCpuMs: number | null;
  elapsedChangePercent: number | null;
  cpuChangePercent: number | null;
  isDegraded: boolean;
  recommendation: string;
  capturedAt: string;
};

const percentChange = (current: number, previous: number | null) => {
  if (previous === null || previous <= 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
};

/**
 * plan hash 변경 전후 성능 비교 결과를 반환합니다.
 */
export const analyzePlanChanges = async (
  dbInstanceId: DbInstanceId,
  limit = 50,
): Promise<PlanChangeInsight[]> => {
  const plans = await listSqlPlanSnapshots({ dbInstanceId, limit: 200 });
  const grouped = new Map<string, SqlPlanSnapshotRecord[]>();

  for (const plan of plans) {
    const items = grouped.get(plan.sqlId) ?? [];
    items.push(plan);
    grouped.set(plan.sqlId, items);
  }

  const insights: PlanChangeInsight[] = [];

  for (const [sqlId, snapshots] of grouped) {
    const sorted = [...snapshots].sort(
      (left, right) =>
        new Date(right.capturedAt).getTime() - new Date(left.capturedAt).getTime(),
    );
    const latest = sorted[0];
    const previousDifferent = sorted.find((item) => item.planHash !== latest.planHash);

    const elapsedChangePercent = percentChange(
      latest.avgElapsedMs,
      previousDifferent?.avgElapsedMs ?? null,
    );
    const cpuChangePercent = percentChange(
      latest.totalCpuMs,
      previousDifferent?.totalCpuMs ?? null,
    );

    const isDegraded =
      (elapsedChangePercent !== null && elapsedChangePercent >= 30) ||
      (cpuChangePercent !== null && cpuChangePercent >= 30);

    if (!previousDifferent && !isDegraded) {
      continue;
    }

    insights.push({
      sqlId,
      currentPlanHash: latest.planHash,
      previousPlanHash: previousDifferent?.planHash ?? null,
      currentAvgElapsedMs: latest.avgElapsedMs,
      previousAvgElapsedMs: previousDifferent?.avgElapsedMs ?? null,
      currentTotalCpuMs: latest.totalCpuMs,
      previousTotalCpuMs: previousDifferent?.totalCpuMs ?? null,
      elapsedChangePercent,
      cpuChangePercent,
      isDegraded,
      recommendation: isDegraded
        ? "실행 계획 변경 이후 성능이 악화되었습니다. 인덱스, 통계, 파라미터 스니핑 여부를 확인하세요."
        : "실행 계획이 변경되었으나 성능 악화는 확인되지 않았습니다.",
      capturedAt: latest.capturedAt,
    });
  }

  return insights
    .sort((left, right) => Number(right.isDegraded) - Number(left.isDegraded))
    .slice(0, limit);
};
