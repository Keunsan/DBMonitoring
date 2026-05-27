/** Collector payload를 공통 저장 모델로 정규화합니다. */

import type { CollectorRunResult } from "@/services/collector/types";
import type {
  BlockingSnapshotRecord,
  CollectionRunRecord,
  DeadlockRecord,
  MetricHistoryRecord,
  SessionSnapshotRecord,
  SqlPerformanceRecord,
} from "@/services/storage/types";
import { DEFAULT_TENANT_ID } from "@/types/domain";

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

/**
 * 단일 Collector 실행 결과를 저장 가능한 정규화 레코드로 변환합니다.
 */
export const normalizeCollectorRun = (result: CollectorRunResult) => {
  const collectionRun: CollectionRunRecord = {
    id: createId("run"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    status: result.status,
    errorMessage: result.errorMessage,
    metricsCount: result.metrics.length,
    sessionsCount: result.sessions.length,
    locksCount: result.locks.length,
    sqlCount: result.sql.length,
  };

  const metricHistory: MetricHistoryRecord[] = result.metrics.map((metric) => ({
    id: createId("metric"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    metricTime: metric.collectTime,
    metricName: metric.metricName,
    metricValue: metric.metricValue,
    unit: metric.unit ?? null,
    tags: metric.tags ?? {},
  }));

  const sessionSnapshots: SessionSnapshotRecord[] = result.sessions.map((session) => ({
    id: createId("session"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    snapshotTime: session.collectTime,
    sessionId: session.sessionId,
    loginName: session.loginName,
    status: session.status,
    waitType: session.waitType,
    waitMs: session.waitMs,
    sqlId: session.sqlId,
    blockingSessionId: session.blockingSessionId ?? null,
    command: session.command ?? null,
    cpuTimeMs: session.cpuTimeMs ?? null,
    logicalReads: session.logicalReads ?? null,
    sqlTextMasked: session.sqlTextMasked ?? null,
    hostName: session.hostName ?? null,
    programName: session.programName ?? null,
    databaseName: session.databaseName ?? null,
  }));

  const blockingSnapshots: BlockingSnapshotRecord[] = result.locks.map((lock) => ({
    id: createId("blocking"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    snapshotTime: lock.collectTime,
    blockerSessionId: lock.blockerSessionId,
    blockedSessionId: lock.blockedSessionId,
    lockType: lock.lockType,
    waitMs: lock.waitMs,
    objectName: lock.objectName,
  }));

  const sqlPerformance: SqlPerformanceRecord[] = result.sql.map((sql) => ({
    id: createId("sql"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    metricTime: sql.collectTime,
    sqlId: sql.sqlId,
    sqlTextMasked: sql.sqlTextMasked,
    executions: sql.executions,
    avgElapsedMs: sql.avgElapsedMs,
    totalCpuMs: sql.totalCpuMs,
    totalLogicalReads: sql.totalLogicalReads ?? null,
    lastExecutionTime: sql.lastExecutionTime ?? null,
  }));

  const deadlocks: DeadlockRecord[] = result.deadlocks.map((deadlock) => ({
    id: createId("deadlock"),
    tenantId: DEFAULT_TENANT_ID,
    dbInstanceId: result.dbInstanceId,
    occurredAt: deadlock.occurredAt,
    victimSessionId: deadlock.victimSessionId,
    graphXml: deadlock.graphXml,
  }));

  return {
    collectionRun,
    metricHistory,
    sessionSnapshots,
    blockingSnapshots,
    sqlPerformance,
    deadlocks,
  };
};
