/** 감사 로그 이벤트 타입 (T-010, T-019 감사 테이블과 정렬)입니다. */

export type AuditAction =
  | "AUTH_LOGIN"
  | "AUTH_LOGOUT"
  | "DB_INSTANCE_CREATE"
  | "DB_INSTANCE_UPDATE"
  | "DB_INSTANCE_DELETE"
  | "DB_CONNECTION_TEST"
  | "ROLE_CHANGE"
  | "ALERT_ACK";

export type AuditLogEntry = {
  id: string;
  tenantId: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  detail: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};
