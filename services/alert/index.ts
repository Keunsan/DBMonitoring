/** 임계치 정책 관리와 알림 이벤트 생성 서비스입니다. */

import { listBusinessSystems, listDbInstances } from "@/lib/inventory/store";
import {
  listBlockingSnapshots,
  listCollectionRuns,
  listDeadlockEvents,
  listMetricHistory,
  listSessionSnapshots,
  listSqlPerformance,
} from "@/services/storage";
import type { DbInstanceId, SeverityLevel } from "@/types/domain";
import { DEFAULT_TENANT_ID } from "@/types/domain";
import type { AlertEvent } from "@/types/entities";

export type ThresholdScopeType = "GLOBAL" | "BUSINESS_SYSTEM" | "DB_INSTANCE";

export type ThresholdMetricKey =
  | "CONNECTION_FAILURE"
  | "USER_CONNECTIONS"
  | "ACTIVE_SESSIONS"
  | "BLOCKING_SECONDS"
  | "BLOCKED_SESSIONS"
  | "DEADLOCK_COUNT"
  | "PAGE_LIFE_EXPECTANCY"
  | "BATCH_REQUESTS_PER_SEC"
  | "SQL_AVG_ELAPSED_MS"
  | "SQL_CPU_MS"
  | "COLLECT_DELAY";

export type ThresholdPolicy = {
  id: string;
  scopeType: ThresholdScopeType;
  scopeId: string | null;
  metricKey: ThresholdMetricKey;
  warningThreshold: number;
  criticalThreshold: number;
  comparison: "GTE" | "LTE";
  durationSec: number;
  isActive: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type ThresholdPolicyInput = Omit<
  ThresholdPolicy,
  "id" | "createdAt" | "updatedAt"
>;

export type AlertEvaluationResult = {
  eventsCreated: number;
  suppressed: number;
  evaluatedAt: string;
  events: AlertEvent[];
};

type AlertState = {
  policies: ThresholdPolicy[];
  events: AlertEvent[];
  fingerprints: Record<string, string>;
};

type GlobalAlertState = typeof globalThis & {
  __dbMonitoringAlertState?: AlertState;
};

const now = () => new Date().toISOString();

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const defaultPolicies = (): ThresholdPolicy[] => {
  const createdAt = now();
  const base = (
    metricKey: ThresholdMetricKey,
    warningThreshold: number,
    criticalThreshold: number,
    comparison: "GTE" | "LTE",
    durationSec: number,
    description: string,
  ): ThresholdPolicy => ({
    id: createId("policy"),
    scopeType: "GLOBAL",
    scopeId: null,
    metricKey,
    warningThreshold,
    criticalThreshold,
    comparison,
    durationSec,
    isActive: true,
    description,
    createdAt,
    updatedAt: createdAt,
  });

  return [
    base("CONNECTION_FAILURE", 2, 3, "GTE", 0, "연속 수집 실패 횟수"),
    base("USER_CONNECTIONS", 500, 800, "GTE", 300, "사용자 연결 수"),
    base("ACTIVE_SESSIONS", 50, 100, "GTE", 180, "Active 세션 수"),
    base("BLOCKING_SECONDS", 30, 60, "GTE", 60, "Blocking 대기 시간"),
    base("BLOCKED_SESSIONS", 5, 10, "GTE", 60, "Blocked 세션 수"),
    base("DEADLOCK_COUNT", 3, 5, "GTE", 600, "Deadlock 발생 건수"),
    base("PAGE_LIFE_EXPECTANCY", 180, 60, "LTE", 300, "Page Life Expectancy"),
    base("BATCH_REQUESTS_PER_SEC", 2_000_000, 3_000_000, "GTE", 300, "Batch Requests/sec"),
    base("SQL_AVG_ELAPSED_MS", 10_000, 30_000, "GTE", 60, "SQL 평균 수행 시간"),
    base("SQL_CPU_MS", 30_000, 60_000, "GTE", 60, "Top SQL CPU 시간"),
    base("COLLECT_DELAY", 3, 5, "GTE", 0, "수집 주기 대비 지연 배수"),
  ];
};

const getState = (): AlertState => {
  const globalState = globalThis as GlobalAlertState;

  if (!globalState.__dbMonitoringAlertState) {
    globalState.__dbMonitoringAlertState = {
      policies: defaultPolicies(),
      events: [],
      fingerprints: {},
    };
  }

  return globalState.__dbMonitoringAlertState;
};

const assertScopeExists = (input: ThresholdPolicyInput) => {
  if (input.scopeType === "BUSINESS_SYSTEM") {
    const exists = listBusinessSystems().some((system) => system.id === input.scopeId);

    if (!exists) {
      throw new Error("업무 시스템을 찾을 수 없습니다.");
    }
  }

  if (input.scopeType === "DB_INSTANCE") {
    const exists = listDbInstances().some((instance) => instance.id === input.scopeId);

    if (!exists) {
      throw new Error("DB 인스턴스를 찾을 수 없습니다.");
    }
  }
};

const normalizeScopeId = (input: ThresholdPolicyInput) =>
  input.scopeType === "GLOBAL" ? null : input.scopeId;

const isBreached = (
  value: number,
  threshold: number,
  comparison: "GTE" | "LTE",
) => (comparison === "GTE" ? value >= threshold : value <= threshold);

const getSeverity = (policy: ThresholdPolicy, value: number): SeverityLevel | null => {
  if (isBreached(value, policy.criticalThreshold, policy.comparison)) {
    return "CRITICAL";
  }

  if (isBreached(value, policy.warningThreshold, policy.comparison)) {
    return "WARN";
  }

  return null;
};

const getPolicyScopeRank = (policy: ThresholdPolicy) => {
  if (policy.scopeType === "DB_INSTANCE") {
    return 3;
  }

  if (policy.scopeType === "BUSINESS_SYSTEM") {
    return 2;
  }

  return 1;
};

const resolvePoliciesForInstance = (
  dbInstanceId: DbInstanceId,
): ThresholdPolicy[] => {
  const instance = listDbInstances().find((item) => item.id === dbInstanceId);

  if (!instance) {
    return [];
  }

  const policies = getState().policies
    .filter((policy) => policy.isActive)
    .filter((policy) => {
      if (policy.scopeType === "GLOBAL") {
        return true;
      }

      if (policy.scopeType === "BUSINESS_SYSTEM") {
        return policy.scopeId === instance.businessSystemId;
      }

      return policy.scopeId === instance.id;
    })
    .sort((a, b) => getPolicyScopeRank(b) - getPolicyScopeRank(a));

  const selected = new Map<ThresholdMetricKey, ThresholdPolicy>();

  for (const policy of policies) {
    if (!selected.has(policy.metricKey)) {
      selected.set(policy.metricKey, policy);
    }
  }

  return [...selected.values()];
};

const getLatestMetricValue = (
  dbInstanceId: DbInstanceId,
  metricName: string,
) => listMetricHistory({ dbInstanceId, metricName, limit: 1 })[0]?.metricValue ?? null;

const getPolicyValue = (dbInstanceId: DbInstanceId, metricKey: ThresholdMetricKey) => {
  const instance = listDbInstances().find((item) => item.id === dbInstanceId);
  const lastRun = listCollectionRuns(dbInstanceId)[0];

  switch (metricKey) {
    case "CONNECTION_FAILURE":
      return lastRun?.status === "FAIL" ? 1 : 0;
    case "USER_CONNECTIONS":
      return getLatestMetricValue(dbInstanceId, "User Connections");
    case "ACTIVE_SESSIONS":
      return listSessionSnapshots(dbInstanceId, 200).filter(
        (session) => session.status === "running",
      ).length;
    case "BLOCKING_SECONDS":
      return Math.max(
        0,
        ...listBlockingSnapshots(dbInstanceId, 100).map(
          (blocking) => blocking.waitMs / 1_000,
        ),
      );
    case "BLOCKED_SESSIONS":
      return listBlockingSnapshots(dbInstanceId, 100).length;
    case "DEADLOCK_COUNT":
      return listDeadlockEvents(dbInstanceId, 100).length;
    case "PAGE_LIFE_EXPECTANCY":
      return getLatestMetricValue(dbInstanceId, "Page life expectancy");
    case "BATCH_REQUESTS_PER_SEC":
      return getLatestMetricValue(dbInstanceId, "Batch Requests/sec");
    case "SQL_AVG_ELAPSED_MS":
      return Math.max(
        0,
        ...listSqlPerformance(dbInstanceId, 20).map((sql) => sql.avgElapsedMs),
      );
    case "SQL_CPU_MS":
      return Math.max(
        0,
        ...listSqlPerformance(dbInstanceId, 20).map((sql) => sql.totalCpuMs),
      );
    case "COLLECT_DELAY": {
      if (!instance?.lastCollectAt || !instance.collectIntervalSec) {
        return 0;
      }

      const elapsedSec = (Date.now() - new Date(instance.lastCollectAt).getTime()) / 1_000;
      return elapsedSec / instance.collectIntervalSec;
    }
  }
};

const createAlertEvent = (
  dbInstanceId: DbInstanceId,
  policy: ThresholdPolicy,
  value: number,
  severity: SeverityLevel,
): AlertEvent => ({
  id: createId("alert"),
  tenantId: DEFAULT_TENANT_ID,
  dbInstanceId,
  eventTime: now(),
  severity,
  category: policy.metricKey,
  title: `${policy.description} 기준 초과`,
  message: `${policy.description} 값이 ${value}로 기준(${severity === "CRITICAL" ? policy.criticalThreshold : policy.warningThreshold})을 초과했습니다.`,
  status: "NEW",
  acknowledgedAt: null,
  acknowledgedBy: null,
});

/**
 * 임계치 정책 목록을 반환합니다.
 */
export const listThresholdPolicies = () => getState().policies;

/**
 * 새 임계치 정책을 등록합니다.
 */
export const createThresholdPolicy = (input: ThresholdPolicyInput) => {
  assertScopeExists(input);

  const createdAt = now();
  const policy: ThresholdPolicy = {
    ...input,
    id: createId("policy"),
    scopeId: normalizeScopeId(input),
    createdAt,
    updatedAt: createdAt,
  };

  getState().policies.push(policy);
  return policy;
};

/**
 * 임계치 정책을 수정합니다.
 */
export const updateThresholdPolicy = (
  id: string,
  input: ThresholdPolicyInput,
) => {
  assertScopeExists(input);

  const state = getState();
  const index = state.policies.findIndex((policy) => policy.id === id);

  if (index < 0) {
    throw new Error("임계치 정책을 찾을 수 없습니다.");
  }

  state.policies[index] = {
    ...state.policies[index],
    ...input,
    scopeId: normalizeScopeId(input),
    updatedAt: now(),
  };

  return state.policies[index];
};

/**
 * 임계치 정책을 삭제합니다.
 */
export const deleteThresholdPolicy = (id: string) => {
  const state = getState();
  const nextPolicies = state.policies.filter((policy) => policy.id !== id);

  if (nextPolicies.length === state.policies.length) {
    throw new Error("임계치 정책을 찾을 수 없습니다.");
  }

  state.policies = nextPolicies;
};

/**
 * 최신 지표에 대해 알림 정책을 평가합니다.
 */
export const evaluateAlertPolicies = async (): Promise<AlertEvaluationResult> => {
  const state = getState();
  const evaluatedAt = now();
  const events: AlertEvent[] = [];
  let suppressed = 0;

  for (const instance of listDbInstances().filter((item) => item.isActive)) {
    for (const policy of resolvePoliciesForInstance(instance.id)) {
      const value = getPolicyValue(instance.id, policy.metricKey);

      if (value === null) {
        continue;
      }

      const severity = getSeverity(policy, value);

      if (!severity) {
        continue;
      }

      const fingerprint = `${instance.id}:${policy.metricKey}:${severity}`;
      const lastEventAt = state.fingerprints[fingerprint];

      if (
        lastEventAt &&
        Date.now() - new Date(lastEventAt).getTime() < Math.max(policy.durationSec, 60) * 1_000
      ) {
        suppressed += 1;
        continue;
      }

      const event = createAlertEvent(instance.id, policy, value, severity);
      state.events.push(event);
      state.fingerprints[fingerprint] = event.eventTime;
      events.push(event);
    }
  }

  return {
    eventsCreated: events.length,
    suppressed,
    evaluatedAt,
    events,
  };
};

/**
 * 알림 이벤트 목록을 반환합니다.
 */
export const listAlertEvents = () => [...getState().events].reverse();

/**
 * 알림 이벤트를 확인 처리합니다.
 */
export const acknowledgeAlertEvent = (id: string, acknowledgedBy = "local-user") => {
  const event = getState().events.find((item) => item.id === id);

  if (!event) {
    throw new Error("알림 이벤트를 찾을 수 없습니다.");
  }

  event.status = "ACK";
  event.acknowledgedAt = now();
  event.acknowledgedBy = acknowledgedBy;

  return event;
};

/**
 * 특정 DB 인스턴스의 정책 테스트 결과를 반환합니다.
 */
export const testThresholdPolicies = (dbInstanceId: DbInstanceId) =>
  resolvePoliciesForInstance(dbInstanceId)
    .map((policy) => {
      const value = getPolicyValue(dbInstanceId, policy.metricKey);
      const severity = value === null ? null : getSeverity(policy, value);

      return {
        policy,
        value,
        severity,
        breached: severity !== null,
      };
    })
    .filter((result) => result.value !== null);
