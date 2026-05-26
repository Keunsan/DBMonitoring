/** 인스턴스별 수집 스케줄러 스텁 (T-016에서 구현)입니다. */

import type { DbInstanceId } from "@/types/domain";

export type SchedulerStatus = {
  dbInstanceId: DbInstanceId;
  lastRunAt: string | null;
  nextRunAt: string | null;
  consecutiveFailures: number;
};

/**
 * 활성 DB 인스턴스에 대한 스케줄러 상태 목록을 반환합니다 (스텁).
 */
export const listSchedulerStatuses = (): SchedulerStatus[] => [];
