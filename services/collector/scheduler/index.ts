/** 인스턴스별 Collector 실행 엔진입니다. */

import { listDbInstances, updateCollectStatus } from "@/lib/inventory/store";
import { createCollectorAdapter } from "@/services/collector/registry";
import type { CollectorContext, CollectorRunResult } from "@/services/collector/types";
import { saveCollectorRun } from "@/services/storage";
import type { CollectStatus, DbInstanceId } from "@/types/domain";

export type SchedulerStatus = {
  dbInstanceId: DbInstanceId;
  lastRunAt: string | null;
  nextRunAt: string | null;
  consecutiveFailures: number;
  lastStatus: CollectStatus | null;
  lastErrorMessage: string | null;
  isRunning: boolean;
};

type MutableSchedulerStatus = SchedulerStatus & {
  collectIntervalSec: number;
};

type GlobalSchedulerState = typeof globalThis & {
  __dbMonitoringCollectorSchedulerState?: Record<
    DbInstanceId,
    MutableSchedulerStatus
  >;
};

const now = () => new Date().toISOString();

const getState = () => {
  const globalState = globalThis as GlobalSchedulerState;

  if (!globalState.__dbMonitoringCollectorSchedulerState) {
    globalState.__dbMonitoringCollectorSchedulerState = {};
  }

  return globalState.__dbMonitoringCollectorSchedulerState;
};

const getOrCreateStatus = (
  dbInstanceId: DbInstanceId,
  collectIntervalSec: number,
): MutableSchedulerStatus => {
  const state = getState();

  if (!state[dbInstanceId]) {
    state[dbInstanceId] = {
      dbInstanceId,
      lastRunAt: null,
      nextRunAt: null,
      consecutiveFailures: 0,
      lastStatus: null,
      lastErrorMessage: null,
      isRunning: false,
      collectIntervalSec,
    };
  }

  state[dbInstanceId].collectIntervalSec = collectIntervalSec;

  return state[dbInstanceId];
};

const calculateNextRunAt = (collectIntervalSec: number) =>
  new Date(Date.now() + collectIntervalSec * 1_000).toISOString();

const toCollectorContext = (instance: ReturnType<typeof listDbInstances>[number]): CollectorContext => ({
  dbInstanceId: instance.id,
  dbmsType: instance.dbmsType,
  connectionSecretRef: instance.connectionSecretRef,
  databaseName: instance.databaseName,
  instanceName: instance.instanceName,
});

const createFailedResult = (
  dbInstanceId: DbInstanceId,
  startedAt: string,
  error: unknown,
): CollectorRunResult => ({
  dbInstanceId,
  startedAt,
  finishedAt: now(),
  status: "FAIL",
  availability: null,
  metrics: [],
  sessions: [],
  locks: [],
  deadlocks: [],
  sql: [],
  errorMessage: error instanceof Error ? error.message : "수집 중 오류가 발생했습니다.",
});

/**
 * 활성 DB 인스턴스에 대한 스케줄러 상태 목록을 반환합니다.
 */
export const listSchedulerStatuses = (): SchedulerStatus[] => {
  const instances = listDbInstances();

  return instances.map((instance) => {
    const status = getOrCreateStatus(instance.id, instance.collectIntervalSec);

    return {
      dbInstanceId: status.dbInstanceId,
      lastRunAt: status.lastRunAt,
      nextRunAt: status.nextRunAt,
      consecutiveFailures: status.consecutiveFailures,
      lastStatus: status.lastStatus,
      lastErrorMessage: status.lastErrorMessage,
      isRunning: status.isRunning,
    };
  });
};

/**
 * 단일 DB 인스턴스에 대해 Collector를 한 번 실행하고 결과를 저장합니다.
 */
export const runCollectorForInstance = async (
  dbInstanceId: DbInstanceId,
): Promise<CollectorRunResult> => {
  const instance = listDbInstances().find((item) => item.id === dbInstanceId);

  if (!instance) {
    throw new Error("DB 인스턴스를 찾을 수 없습니다.");
  }

  if (!instance.isActive) {
    throw new Error("비활성 DB 인스턴스는 수집할 수 없습니다.");
  }

  const status = getOrCreateStatus(instance.id, instance.collectIntervalSec);

  if (status.isRunning) {
    throw new Error("이미 해당 DB 인스턴스 수집이 진행 중입니다.");
  }

  const startedAt = now();
  status.isRunning = true;

  try {
    const adapter = createCollectorAdapter(toCollectorContext(instance));
    const availability = await adapter.collectAvailability();

    if (!availability.isReachable) {
      throw new Error(availability.healthMessage ?? "DB 연결 확인에 실패했습니다.");
    }

    const metrics = await adapter.collectMetrics();
    const sessions = await adapter.collectSessions();
    const locks = await adapter.collectLocks();
    const deadlocks = await adapter.collectDeadlocks();
    const sql = await adapter.collectSql();

    const result: CollectorRunResult = {
      dbInstanceId: instance.id,
      startedAt,
      finishedAt: now(),
      status: "OK",
      availability,
      metrics,
      sessions,
      locks,
      deadlocks,
      sql,
      errorMessage: null,
    };

    saveCollectorRun(result);
    updateCollectStatus(instance.id, "OK");
    status.lastStatus = "OK";
    status.lastErrorMessage = null;
    status.consecutiveFailures = 0;
    status.lastRunAt = result.finishedAt;
    status.nextRunAt = calculateNextRunAt(instance.collectIntervalSec);

    return result;
  } catch (error) {
    const result = createFailedResult(instance.id, startedAt, error);

    saveCollectorRun(result);
    updateCollectStatus(instance.id, "FAIL");
    status.lastStatus = "FAIL";
    status.lastErrorMessage = result.errorMessage;
    status.consecutiveFailures += 1;
    status.lastRunAt = result.finishedAt;
    status.nextRunAt = calculateNextRunAt(instance.collectIntervalSec);

    return result;
  } finally {
    status.isRunning = false;
  }
};

/**
 * 활성화된 모든 DB 인스턴스를 한 번씩 수집합니다.
 */
export const runCollectorOnce = async () => {
  const activeInstances = listDbInstances().filter((instance) => instance.isActive);
  const results: CollectorRunResult[] = [];

  for (const instance of activeInstances) {
    results.push(await runCollectorForInstance(instance.id));
  }

  return results;
};
