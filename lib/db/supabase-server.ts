/** 서버 전용 Supabase 클라이언트 (Vault RPC 전용)입니다. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getOptionalEnv } from "@/lib/env";

let cachedClient: SupabaseClient | null | undefined;

/**
 * Supabase 서버 클라이언트 설정 여부를 반환합니다.
 */
export const isSupabaseServerConfigured = (): boolean => {
  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  return !!url && !!serviceRoleKey;
};

/**
 * service role 기반 Supabase 클라이언트를 반환합니다.
 */
export const getSupabaseServerClient = (): SupabaseClient | null => {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
};
