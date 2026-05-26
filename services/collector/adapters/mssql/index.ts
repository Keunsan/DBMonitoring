/** MSSQL Agentless 수집 어댑터 (T-015에서 구현)입니다. */

import type { CollectorAdapter, CollectorContext } from "@/services/collector/types";

const notImplemented = async (): Promise<never> => {
  throw new Error("MSSQL Collector는 T-015에서 구현 예정입니다.");
};

/**
 * MSSQL Collector 어댑터 인스턴스를 생성합니다.
 */
export const createMssqlCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  void context;
  return {
  testConnection: notImplemented,
  collectAvailability: notImplemented,
  collectMetrics: notImplemented,
  collectSessions: notImplemented,
  collectLocks: notImplemented,
  collectDeadlocks: notImplemented,
  collectTopSql: notImplemented,
  };
};
