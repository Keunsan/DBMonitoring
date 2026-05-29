/** SQL 상세 분석 화면용 데이터를 조합합니다. */

import { listSqlPerformance, listSqlPlanSnapshots } from "@/services/storage";
import type { SqlPerformanceRecord, SqlPlanSnapshotRecord } from "@/services/storage/types";
import type { DbInstanceId } from "@/types/domain";

export type SqlDetailView = {
  sqlId: string;
  latest: SqlPerformanceRecord | null;
  history: SqlPerformanceRecord[];
  plans: SqlPlanSnapshotRecord[];
  performanceChange: {
    avgElapsedChangePercent: number | null;
    cpuChangePercent: number | null;
  };
};

const percentChange = (current: number, baseline: number | null) => {
  if (baseline === null || baseline <= 0) {
    return null;
  }

  return ((current - baseline) / baseline) * 100;
};

/**
 * SQL ID 기준 상세 분석 데이터를 반환합니다.
 */
export const getSqlDetailView = async (
  dbInstanceId: DbInstanceId,
  sqlId: string,
): Promise<SqlDetailView | null> => {
  const history = (
    await listSqlPerformance(dbInstanceId, 100, sqlId)
  ).sort(
    (left, right) =>
      new Date(left.metricTime).getTime() - new Date(right.metricTime).getTime(),
  );

  if (history.length === 0) {
    return null;
  }

  const latest = history.at(-1) ?? null;
  const baseline = history.length > 1 ? history[0] : null;
  const plans = await listSqlPlanSnapshots({ dbInstanceId, sqlId, limit: 20 });

  return {
    sqlId,
    latest,
    history,
    plans,
    performanceChange: {
      avgElapsedChangePercent: percentChange(
        latest?.avgElapsedMs ?? 0,
        baseline?.avgElapsedMs ?? null,
      ),
      cpuChangePercent: percentChange(latest?.totalCpuMs ?? 0, baseline?.totalCpuMs ?? null),
    },
  };
};
