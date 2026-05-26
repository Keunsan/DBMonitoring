/** Oracle 수집 어댑터 스텁 (T-014 인터페이스, 구현 후순위)입니다. */

import type { CollectorAdapter, CollectorContext } from "@/services/collector/types";

/**
 * Oracle Collector 어댑터 스텁을 반환합니다.
 */
export const createOracleCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  throw new Error(
    `Oracle Collector는 1차 MVP 범위 외(스텁)입니다. instance=${context.dbInstanceId}`,
  );
};
