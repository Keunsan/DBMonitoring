/** 수집된 metric history에서 화면용 resourceSummary를 계산합니다. */

import { SERVER_METRIC_KEYS } from "@/lib/monitoring/metric-keys";
import type { MetricHistoryRecord } from "@/services/storage/types";

export type ResourceSummary = {
  cpuUsedPercent: number | null;
  memoryUsedPercent: number | null;
  memoryAvailableMb: number | null;
  pageLifeExpectancy: number | null;
  memoryGrantsPending: number | null;
  diskReadIops: number | null;
  diskWriteIops: number | null;
  diskReadLatencyMs: number | null;
  diskWriteLatencyMs: number | null;
  storageUsedPercent: number | null;
  logUsedPercent: number | null;
  tempdbUsedMb: number | null;
  batchRequestsPerSec: number | null;
  transactionsPerSec: number | null;
  userConnections: number | null;
  processesBlocked: number | null;
  sessionTotalCount: number | null;
  sessionActiveCount: number | null;
  sessionIdleCount: number | null;
  sessionRunningSqlCount: number | null;
};

const getMetricValue = (
  metrics: MetricHistoryRecord[],
  key: string,
): number | null => {
  const found = metrics.find((metric) => metric.metricName === key);
  return found ? found.metricValue : null;
};

/**
 * 최신 metric 스냅샷에서 리소스 요약 객체를 생성합니다.
 */
export const buildResourceSummary = (
  metrics: MetricHistoryRecord[],
): ResourceSummary => {
  const dataUsed = getMetricValue(metrics, SERVER_METRIC_KEYS.storageDataUsedMb);
  const dataSize = getMetricValue(metrics, SERVER_METRIC_KEYS.storageDataSizeMb);
  const storageUsedPercent =
    dataUsed !== null && dataSize !== null && dataSize > 0
      ? (dataUsed / dataSize) * 100
      : null;

  return {
    cpuUsedPercent: getMetricValue(metrics, SERVER_METRIC_KEYS.cpuUsedPercent),
    memoryUsedPercent: getMetricValue(
      metrics,
      SERVER_METRIC_KEYS.memoryUsedPercent,
    ),
    memoryAvailableMb: getMetricValue(metrics, SERVER_METRIC_KEYS.memoryAvailableMb),
    pageLifeExpectancy: getMetricValue(metrics, SERVER_METRIC_KEYS.pageLifeExpectancy),
    memoryGrantsPending: getMetricValue(
      metrics,
      SERVER_METRIC_KEYS.memoryGrantsPending,
    ),
    diskReadIops: getMetricValue(metrics, SERVER_METRIC_KEYS.diskReadIops),
    diskWriteIops: getMetricValue(metrics, SERVER_METRIC_KEYS.diskWriteIops),
    diskReadLatencyMs: getMetricValue(metrics, SERVER_METRIC_KEYS.diskReadLatencyMs),
    diskWriteLatencyMs: getMetricValue(metrics, SERVER_METRIC_KEYS.diskWriteLatencyMs),
    storageUsedPercent,
    logUsedPercent: getMetricValue(metrics, SERVER_METRIC_KEYS.logUsedPercent),
    tempdbUsedMb: getMetricValue(metrics, SERVER_METRIC_KEYS.tempdbUsedMb),
    batchRequestsPerSec: getMetricValue(
      metrics,
      SERVER_METRIC_KEYS.batchRequestsPerSec,
    ),
    transactionsPerSec: getMetricValue(metrics, SERVER_METRIC_KEYS.transactionsPerSec),
    userConnections: getMetricValue(metrics, SERVER_METRIC_KEYS.userConnections),
    processesBlocked: getMetricValue(metrics, SERVER_METRIC_KEYS.processesBlocked),
    sessionTotalCount: getMetricValue(metrics, SERVER_METRIC_KEYS.sessionTotalCount),
    sessionActiveCount: getMetricValue(metrics, SERVER_METRIC_KEYS.sessionActiveCount),
    sessionIdleCount: getMetricValue(metrics, SERVER_METRIC_KEYS.sessionIdleCount),
    sessionRunningSqlCount: getMetricValue(
      metrics,
      SERVER_METRIC_KEYS.sessionRunningSqlCount,
    ),
  };
};

/**
 * 지표 값에 따른 간단한 건강 상태를 반환합니다.
 */
export const getResourceHealth = (
  key: keyof ResourceSummary,
  value: number | null,
): "normal" | "caution" | "warning" | "unknown" => {
  if (value === null || Number.isNaN(value)) {
    return "unknown";
  }

  switch (key) {
    case "cpuUsedPercent":
      if (value >= 95) return "warning";
      if (value >= 85) return "caution";
      return "normal";
    case "memoryUsedPercent":
    case "storageUsedPercent":
    case "logUsedPercent":
      if (value >= 90) return "warning";
      if (value >= 75) return "caution";
      return "normal";
    case "pageLifeExpectancy":
      if (value <= 60) return "warning";
      if (value <= 180) return "caution";
      return "normal";
    case "diskReadLatencyMs":
    case "diskWriteLatencyMs":
      if (value >= 50) return "warning";
      if (value >= 20) return "caution";
      return "normal";
    case "processesBlocked":
      if (value >= 10) return "warning";
      if (value >= 3) return "caution";
      return "normal";
    default:
      return "normal";
  }
};
