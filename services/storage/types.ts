/** 수집 결과 저장·정규화 레코드 타입입니다. */

import type { ResourceSummary } from "@/lib/monitoring/resource-summary";
import type { CollectStatus, DbInstanceId, TenantId } from "@/types/domain";

export type CollectionRunRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  startedAt: string;
  finishedAt: string;
  status: CollectStatus;
  errorMessage: string | null;
  metricsCount: number;
  sessionsCount: number;
  locksCount: number;
  sqlCount: number;
};

export type MetricHistoryRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  metricTime: string;
  metricName: string;
  metricValue: number;
  unit: string | null;
  tags: Record<string, string>;
};

export type SessionSnapshotRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  snapshotTime: string;
  sessionId: string;
  loginName: string;
  status: string;
  waitType: string | null;
  waitMs: number | null;
  sqlId: string | null;
  hostName: string | null;
  programName: string | null;
  databaseName: string | null;
};

export type BlockingSnapshotRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  snapshotTime: string;
  blockerSessionId: string;
  blockedSessionId: string;
  lockType: string;
  waitMs: number;
  objectName: string | null;
};

export type SqlPerformanceRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  metricTime: string;
  sqlId: string;
  sqlTextMasked: string;
  executions: number;
  avgElapsedMs: number;
  totalCpuMs: number;
  totalLogicalReads: number | null;
  lastExecutionTime: string | null;
};

export type DeadlockRecord = {
  id: string;
  tenantId: TenantId;
  dbInstanceId: DbInstanceId;
  occurredAt: string;
  victimSessionId: string;
  graphXml: string;
};

export type MonitoringStorageState = {
  collectionRuns: CollectionRunRecord[];
  metricHistory: MetricHistoryRecord[];
  sessionSnapshots: SessionSnapshotRecord[];
  blockingSnapshots: BlockingSnapshotRecord[];
  sqlPerformance: SqlPerformanceRecord[];
  deadlocks: DeadlockRecord[];
};

export type MonitoringSummary = {
  dbInstanceId: DbInstanceId;
  lastRun: CollectionRunRecord | null;
  latestMetrics: MetricHistoryRecord[];
  resourceSummary: ResourceSummary;
  latestSessions: SessionSnapshotRecord[];
  latestSql: SqlPerformanceRecord[];
  blockingCount: number;
  deadlockCount: number;
};
