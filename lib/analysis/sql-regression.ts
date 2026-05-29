/** SQL 성능 회귀 탐지 및 개선 권고를 계산합니다. */

import {
  listSqlPerformance,
  listSqlRegressionEvents,
  saveSqlRegressionEvents,
} from "@/services/storage";
import type { SqlRegressionEventRecord } from "@/services/storage/types";
import { createUuid } from "@/lib/create-uuid";
import { DEFAULT_TENANT_ID, type DbInstanceId } from "@/types/domain";

const REGRESSION_WARNING_PERCENT = 50;
const REGRESSION_CRITICAL_PERCENT = 100;
const BASELINE_SAMPLE_SIZE = 8;

const average = (values: number[]) =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const buildRecommendation = (
  metricKey: string,
  changePercent: number,
  sqlId: string,
): string => {
  if (metricKey === "avgElapsedMs") {
    return `SQL ${sqlId}의 평균 수행 시간이 baseline 대비 ${changePercent.toFixed(1)}% 증가했습니다. 실행 계획 변경, 인덱스 누락, 통계 정보 갱신을 확인하세요.`;
  }

  if (metricKey === "totalCpuMs") {
    return `SQL ${sqlId}의 CPU 사용량이 baseline 대비 ${changePercent.toFixed(1)}% 증가했습니다. 스캔 범위, 조인 순서, 병렬 처리 설정을 점검하세요.`;
  }

  return `SQL ${sqlId}의 ${metricKey} 지표가 baseline 대비 ${changePercent.toFixed(1)}% 악화되었습니다.`;
};

const detectMetricRegression = (
  dbInstanceId: DbInstanceId,
  sqlId: string,
  metricKey: "avgElapsedMs" | "totalCpuMs",
  history: { metricTime: string; value: number }[],
): SqlRegressionEventRecord | null => {
  if (history.length < 3) {
    return null;
  }

  const baselineValues = history
    .slice(0, -1)
    .slice(-BASELINE_SAMPLE_SIZE)
    .map((item) => item.value);
  const baseline = average(baselineValues);
  const current = history.at(-1)?.value ?? 0;

  if (baseline <= 0 || current <= baseline) {
    return null;
  }

  const changePercent = ((current - baseline) / baseline) * 100;

  if (changePercent < REGRESSION_WARNING_PERCENT) {
    return null;
  }

  const severity =
    changePercent >= REGRESSION_CRITICAL_PERCENT ? "CRITICAL" : "WARNING";

  return {
    id: createUuid(),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId,
    detectedAt: new Date().toISOString(),
    sqlId,
    metricKey,
    baselineValue: baseline,
    currentValue: current,
    changePercent,
    severity,
    recommendation: buildRecommendation(metricKey, changePercent, sqlId),
    status: "OPEN",
    issueCandidate: {
      title: `SQL 성능 회귀 (${sqlId})`,
      category: "SQL_REGRESSION",
      severity,
      metricKey,
      changePercent,
    },
  };
};

/**
 * DB 인스턴스별 SQL 성능 회귀를 탐지하고 저장합니다.
 */
export const detectSqlRegressions = async (dbInstanceId: DbInstanceId) => {
  const history = await listSqlPerformance(dbInstanceId, 500);
  const sqlIds = [...new Set(history.map((item) => item.sqlId))];
  const detected: SqlRegressionEventRecord[] = [];

  for (const sqlId of sqlIds) {
    const sqlHistory = history
      .filter((item) => item.sqlId === sqlId)
      .sort(
        (left, right) =>
          new Date(left.metricTime).getTime() - new Date(right.metricTime).getTime(),
      );

    const elapsedRegression = detectMetricRegression(
      dbInstanceId,
      sqlId,
      "avgElapsedMs",
      sqlHistory.map((item) => ({
        metricTime: item.metricTime,
        value: item.avgElapsedMs,
      })),
    );

    if (elapsedRegression) {
      detected.push(elapsedRegression);
    }

    const cpuRegression = detectMetricRegression(
      dbInstanceId,
      sqlId,
      "totalCpuMs",
      sqlHistory.map((item) => ({
        metricTime: item.metricTime,
        value: item.totalCpuMs,
      })),
    );

    if (cpuRegression) {
      detected.push(cpuRegression);
    }
  }

  if (detected.length > 0) {
    await saveSqlRegressionEvents(detected);
  }

  return {
    detectedCount: detected.length,
    events: detected,
    existing: await listSqlRegressionEvents(dbInstanceId, 100),
  };
};
