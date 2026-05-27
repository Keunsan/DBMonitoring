/** Collector 어댑터·수집 payload 타입 (T-003 §4.4, T-014)입니다. */

import type { DbInstanceId, DbmsType } from "@/types/domain";

export type ConnectionTestResult = {
  success: boolean;
  message: string;
  latencyMs?: number;
};

export type CollectorContext = {
  dbInstanceId: DbInstanceId;
  dbmsType: DbmsType;
  connectionSecretRef: string;
  instanceName: string;
  host: string;
  port: number;
  serviceName: string | null;
  databaseName: string | null;
  envType: string;
};

/** DBMS별 수집 어댑터 공통 인터페이스 */
export type ICollectorAdapter = {
  connect: () => Promise<ConnectionTestResult>;
  collectAvailability: () => Promise<AvailabilityPayload>;
  collectMetrics: () => Promise<MetricPayload[]>;
  collectSessions: () => Promise<SessionPayload[]>;
  collectLocks: () => Promise<BlockingPayload[]>;
  collectDeadlocks: () => Promise<DeadlockPayload[]>;
  collectSql: () => Promise<SqlPerformancePayload[]>;
};

export type CollectorAdapter = ICollectorAdapter;

export type AvailabilityPayload = {
  collectTime: string;
  isReachable: boolean;
  healthMessage?: string;
  latencyMs?: number;
  serverName?: string | null;
  databaseName?: string | null;
  version?: string | null;
};

export type MetricPayload = {
  collectTime: string;
  metricName: string;
  metricValue: number;
  unit?: string;
  tags?: Record<string, string>;
};

export type SessionPayload = {
  collectTime: string;
  sessionId: string;
  loginName: string;
  status: string;
  waitType: string | null;
  waitMs: number | null;
  sqlId: string | null;
  hostName?: string | null;
  programName?: string | null;
  databaseName?: string | null;
};

export type BlockingPayload = {
  collectTime: string;
  blockerSessionId: string;
  blockedSessionId: string;
  lockType: string;
  waitMs: number;
  objectName: string | null;
};

export type DeadlockPayload = {
  occurredAt: string;
  victimSessionId: string;
  graphXml: string;
};

export type SqlPerformancePayload = {
  collectTime: string;
  sqlId: string;
  sqlTextMasked: string;
  executions: number;
  avgElapsedMs: number;
  totalCpuMs: number;
  totalLogicalReads?: number;
  lastExecutionTime?: string | null;
};

export type CollectorAdapterFactory = (
  context: CollectorContext,
) => CollectorAdapter;

export type CollectorRunResult = {
  dbInstanceId: DbInstanceId;
  startedAt: string;
  finishedAt: string;
  status: "OK" | "FAIL";
  availability: AvailabilityPayload | null;
  metrics: MetricPayload[];
  sessions: SessionPayload[];
  locks: BlockingPayload[];
  deadlocks: DeadlockPayload[];
  sql: SqlPerformancePayload[];
  errorMessage: string | null;
};
