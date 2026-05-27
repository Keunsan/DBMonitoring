/** Oracle 수집 어댑터 스텁 (T-014 인터페이스, 구현 후순위)입니다. */

import type { CollectorAdapter, CollectorContext } from "@/services/collector/types";

const unsupported = async (): Promise<never> => {
  throw new Error("Oracle Collector는 1차 MVP 범위 외(스텁)입니다.");
};

/**
 * Oracle Collector 어댑터 스텁을 반환합니다.
 */
export const createOracleCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  void context;

  return {
    connect: unsupported,
    collectAvailability: unsupported,
    collectMetrics: unsupported,
    collectSessions: unsupported,
    collectLocks: unsupported,
    collectDeadlocks: unsupported,
    collectSql: unsupported,
  };
};
