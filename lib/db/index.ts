/** Supabase/PostgreSQL 클라이언트 진입점 (T-008, T-019에서 구현)입니다. */

import { getOptionalEnv, validateRequiredEnv } from "@/lib/env";

export type DbClientStatus = "not_configured" | "ready" | "error";

/**
 * 운영 DB 연결 환경 변수 설정 상태를 반환합니다.
 */
export const getDbClientStatus = (): DbClientStatus => {
  const hasSupabaseConfig =
    !!getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    !!getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const hasDatabaseUrl = !!getOptionalEnv("DATABASE_URL");

  if (!hasSupabaseConfig && !hasDatabaseUrl) {
    return "not_configured";
  }

  return validateRequiredEnv().ok ? "ready" : "error";
};
