/** T-002 §8 기준 공통 도메인 enum 및 식별자 타입입니다. */

export type DbmsType = "MSSQL" | "ORACLE" | "AZURE_SQL";

export type ImportanceLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SeverityLevel = "INFO" | "WARN" | "CRITICAL";

export type CollectorType = "AGENT" | "AGENTLESS" | "API";

export type EnvType = "PROD" | "DEV" | "STG" | "DR";

export type CollectStatus = "OK" | "FAIL" | "DELAYED";

export type AlertStatus = "NEW" | "ACK" | "CLOSED";

export type IssueStatus =
  | "NEW"
  | "ACK"
  | "IN_PROGRESS"
  | "DONE"
  | "HOLD";

export type DbHealth = "NORMAL" | "CAUTION" | "WARNING" | "OUTAGE";

/** 1차 MVP 단일 테넌트 — 컬럼 예약용 기본값 */
export const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export type TenantId = string;
export type DbInstanceId = string;
export type BusinessSystemId = string;
