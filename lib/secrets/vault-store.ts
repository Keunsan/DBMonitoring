/** Supabase Vault에 connection secret을 저장·조회·삭제합니다. */

import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/db/supabase-server";
import { formatSecretRefForLog, maskSensitiveRecord } from "@/lib/security/mask";
import type { DbmsType } from "@/types/domain";

import { connectionSecretError } from "./errors";
import { parseConnectionCredential } from "./validate";
import type { ConnectionCredential } from "./types";

/**
 * Vault에서 connection secret JSON을 조회합니다.
 */
export const fetchVaultConnectionSecret = async (
  vaultName: string,
  expectedDbmsType?: DbmsType,
): Promise<ConnectionCredential> => {
  const client = getSupabaseServerClient();

  if (!client) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "Supabase Vault 연동이 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.",
      503,
    );
  }

  const { data, error } = await client.rpc("resolve_connection_secret", {
    p_secret_name: vaultName,
  });

  if (error) {
    console.error(
      "[VAULT_CONNECTION_SECRET_FETCH_FAILED]",
      maskSensitiveRecord({
        secretRef: formatSecretRefForLog(`vault:${vaultName}`),
        code: error.code,
        message: error.message,
      }),
    );

    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "접속 Secret을 조회하지 못했습니다. Vault 설정과 권한을 확인해주세요.",
      503,
      error,
    );
  }

  if (data === null || data === undefined) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_NOT_FOUND",
      "등록된 접속 Secret을 찾을 수 없습니다. 관리 화면에서 Secret을 등록해주세요.",
      404,
      undefined,
      { vaultName },
    );
  }

  try {
    return parseConnectionCredential(data, expectedDbmsType);
  } catch (error) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_INVALID",
      error instanceof Error ? error.message : "접속 Secret 형식이 올바르지 않습니다.",
      400,
      error,
    );
  }
};

/**
 * Vault에 connection secret을 저장하거나 갱신합니다.
 */
export const upsertConnectionSecret = async (
  vaultName: string,
  credential: ConnectionCredential,
  description?: string,
) => {
  const client = getSupabaseServerClient();

  if (!client) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "Supabase Vault 연동이 설정되지 않았습니다.",
      503,
    );
  }

  const { error } = await client.rpc("upsert_connection_secret", {
    p_secret_name: vaultName,
    p_secret: credential,
    p_description: description ?? `DB connection credential for ${vaultName}`,
  });

  if (error) {
    console.error(
      "[VAULT_CONNECTION_SECRET_UPSERT_FAILED]",
      maskSensitiveRecord({
        secretRef: formatSecretRefForLog(`vault:${vaultName}`),
        code: error.code,
        message: error.message,
      }),
    );

    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "접속 Secret을 저장하지 못했습니다. Vault 권한과 migration 적용 여부를 확인해주세요.",
      503,
      error,
    );
  }
};

/**
 * Vault에서 connection secret을 삭제합니다.
 */
export const deleteConnectionSecret = async (vaultName: string): Promise<boolean> => {
  if (!isSupabaseServerConfigured()) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "Supabase Vault 연동이 설정되지 않았습니다.",
      503,
    );
  }

  const client = getSupabaseServerClient();

  if (!client) {
    return false;
  }

  const { data, error } = await client.rpc("delete_connection_secret", {
    p_secret_name: vaultName,
  });

  if (error) {
    console.error(
      "[VAULT_CONNECTION_SECRET_DELETE_FAILED]",
      maskSensitiveRecord({
        secretRef: formatSecretRefForLog(`vault:${vaultName}`),
        code: error.code,
        message: error.message,
      }),
    );

    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "접속 Secret을 삭제하지 못했습니다.",
      503,
      error,
    );
  }

  return Boolean(data);
};
