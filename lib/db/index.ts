/** Supabase/PostgreSQL 클라이언트 진입점 (T-008, T-019에서 구현)입니다. */

export type DbClientStatus = "not_configured" | "ready" | "error";

/**
 * 운영 DB 연결 상태를 반환합니다. T-008 환경 변수 확정 후 구현합니다.
 */
export const getDbClientStatus = (): DbClientStatus => "not_configured";
