/** 개발용 메모리 기반 수집 결과 저장소입니다. */

import type { CollectorRunResult } from "@/services/collector/types";
import { normalizeCollectorRun } from "@/services/storage/normalize";
import type {
  BlockingSnapshotRecord,
  CollectionRunRecord,
  DeadlockRecord,
  MetricHistoryRecord,
  MonitoringSummary,
  MonitoringStorageState,
  SessionSnapshotRecord,
  SqlPerformanceRecord,
} from "@/services/storage/types";
import type { DbInstanceId } from "@/types/domain";

type GlobalMonitoringStorageState = typeof globalThis & {
  __dbMonitoringStorageState?: MonitoringStorageState;
};

const MAX_RECORDS_PER_BUCKET = 5_000;

const getState = (): MonitoringStorageState => {
  const globalState = globalThis as GlobalMonitoringStorageState;

  if (!globalState.__dbMonitoringStorageState) {
    globalState.__dbMonitoringStorageState = {
      collectionRuns: [],
      metricHistory: [],
      sessionSnapshots: [],
      blockingSnapshots: [],
      sqlPerformance: [],
      deadlocks: [],
    };
  }

  return globalState.__dbMonitoringStorageState;
};

const trimBucket = <T>(items: T[]) => items.slice(-MAX_RECORDS_PER_BUCKET);

/**
 * Collector 실행 결과를 메모리 저장소에 적재합니다.
 */
export const saveCollectorRun = (result: CollectorRunResult) => {
  const state = getState();
  const normalized = normalizeCollectorRun(result);

  state.collectionRuns = trimBucket([
    ...state.collectionRuns,
    normalized.collectionRun,
  ]);
  state.metricHistory = trimBucket([
    ...state.metricHistory,
    ...normalized.metricHistory,
  ]);
  state.sessionSnapshots = trimBucket([
    ...state.sessionSnapshots,
    ...normalized.sessionSnapshots,
  ]);
  state.blockingSnapshots = trimBucket([
    ...state.blockingSnapshots,
    ...normalized.blockingSnapshots,
  ]);
  state.sqlPerformance = trimBucket([
    ...state.sqlPerformance,
    ...normalized.sqlPerformance,
  ]);
  state.deadlocks = trimBucket([...state.deadlocks, ...normalized.deadlocks]);

  return normalized.collectionRun;
};

/**
 * 최근 Collector 실행 이력을 반환합니다.
 */
export const listCollectionRuns = (
  dbInstanceId?: DbInstanceId,
): CollectionRunRecord[] => {
  const runs = getState().collectionRuns;
  const filtered = dbInstanceId
    ? runs.filter((run) => run.dbInstanceId === dbInstanceId)
    : runs;

  return [...filtered].reverse();
};

/**
 * 시계열 지표 이력을 반환합니다.
 */
export const listMetricHistory = (params: {
  dbInstanceId?: DbInstanceId;
  metricName?: string;
  limit?: number;
}): MetricHistoryRecord[] => {
  const limit = params.limit ?? 200;
  const filtered = getState().metricHistory.filter((metric) => {
    if (params.dbInstanceId && metric.dbInstanceId !== params.dbInstanceId) {
      return false;
    }

    if (params.metricName && metric.metricName !== params.metricName) {
      return false;
    }

    return true;
  });

  return filtered.slice(-limit).reverse();
};

/**
 * 최근 세션 스냅샷을 반환합니다.
 */
export const listSessionSnapshots = (
  dbInstanceId?: DbInstanceId,
  limit = 200,
): SessionSnapshotRecord[] => {
  const filtered = getState().sessionSnapshots.filter(
    (session) => !dbInstanceId || session.dbInstanceId === dbInstanceId,
  );

  return filtered.slice(-limit).reverse();
};

/**
 * 최근 SQL 성능 집계 결과를 반환합니다.
 */
export const listSqlPerformance = (
  dbInstanceId?: DbInstanceId,
  limit = 100,
): SqlPerformanceRecord[] => {
  const filtered = getState().sqlPerformance.filter(
    (sql) => !dbInstanceId || sql.dbInstanceId === dbInstanceId,
  );

  return filtered.slice(-limit).reverse();
};

/**
 * 최근 Blocking 스냅샷을 반환합니다.
 */
export const listBlockingSnapshots = (
  dbInstanceId?: DbInstanceId,
  limit = 100,
): BlockingSnapshotRecord[] => {
  const filtered = getState().blockingSnapshots.filter(
    (blocking) => !dbInstanceId || blocking.dbInstanceId === dbInstanceId,
  );

  return filtered.slice(-limit).reverse();
};

/**
 * 최근 Deadlock 이벤트를 반환합니다.
 */
export const listDeadlockEvents = (
  dbInstanceId?: DbInstanceId,
  limit = 100,
): DeadlockRecord[] => {
  const filtered = getState().deadlocks.filter(
    (deadlock) => !dbInstanceId || deadlock.dbInstanceId === dbInstanceId,
  );

  return filtered.slice(-limit).reverse();
};

/**
 * 대시보드와 실시간 화면에서 사용할 최신 모니터링 요약을 반환합니다.
 */
export const getMonitoringSummary = (
  dbInstanceId: DbInstanceId,
): MonitoringSummary => {
  const latestRun = listCollectionRuns(dbInstanceId)[0] ?? null;
  const latestMetricTime = getState()
    .metricHistory.filter((metric) => metric.dbInstanceId === dbInstanceId)
    .at(-1)?.metricTime;
  const latestSessionTime = getState()
    .sessionSnapshots.filter((session) => session.dbInstanceId === dbInstanceId)
    .at(-1)?.snapshotTime;

  return {
    dbInstanceId,
    lastRun: latestRun,
    latestMetrics: latestMetricTime
      ? getState().metricHistory.filter(
          (metric) =>
            metric.dbInstanceId === dbInstanceId &&
            metric.metricTime === latestMetricTime,
        )
      : [],
    latestSessions: latestSessionTime
      ? getState().sessionSnapshots.filter(
          (session) =>
            session.dbInstanceId === dbInstanceId &&
            session.snapshotTime === latestSessionTime,
        )
      : [],
    latestSql: listSqlPerformance(dbInstanceId, 10),
    blockingCount: listBlockingSnapshots(dbInstanceId, 100).length,
    deadlockCount: listDeadlockEvents(dbInstanceId, 100).length,
  };
};

/**
 * 저장소 상태 요약을 반환합니다.
 */
export const getMonitoringStorageSummary = () => {
  const state = getState();

  return {
    collectionRuns: state.collectionRuns.length,
    metricHistory: state.metricHistory.length,
    sessionSnapshots: state.sessionSnapshots.length,
    blockingSnapshots: state.blockingSnapshots.length,
    sqlPerformance: state.sqlPerformance.length,
    deadlocks: state.deadlocks.length,
  };
};
