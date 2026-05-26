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
};

/** DBMS별 수집 어댑터 공통 인터페이스 */
export type CollectorAdapter = {
  testConnection: () => Promise<ConnectionTestResult>;
  collectAvailability: () => Promise<AvailabilityPayload>;
  collectMetrics: () => Promise<MetricPayload[]>;
  collectSessions: () => Promise<SessionPayload[]>;
  collectLocks: () => Promise<BlockingPayload[]>;
  collectDeadlocks: () => Promise<DeadlockPayload[]>;
  collectTopSql: () => Promise<SqlPerformancePayload[]>;
};

export type AvailabilityPayload = {
  collectTime: string;
  isReachable: boolean;
  healthMessage?: string;
};

export type MetricPayload = {
  collectTime: string;
  metricName: string;
  metricValue: number;
  unit?: string;
};

export type SessionPayload = {
  collectTime: string;
  sessionId: string;
  loginName: string;
  status: string;
  waitType: string | null;
  waitMs: number | null;
  sqlId: string | null;
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
};

export type CollectorAdapterFactory = (
  context: CollectorContext,
) => CollectorAdapter;
