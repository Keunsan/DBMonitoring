/** connection_secret_ref를 credential로 해석하는 Resolver입니다. */

import { isSupabaseServerConfigured } from "@/lib/db/supabase-server";
import { getSecretProvider } from "@/lib/env";
import { formatSecretRefForLog } from "@/lib/security/mask";
import type { DbmsType } from "@/types/domain";

import { resolveEnvConnectionSecret } from "./env-provider";
import { connectionSecretError } from "./errors";
import { parseConnectionSecretRef } from "./refs";
import type { ResolvedConnectionSecret } from "./types";
import { fetchVaultConnectionSecret } from "./vault-store";

/**
 * connection_secret_ref를 해석해 DB 접속 credential을 반환합니다.
 */
export const resolveConnectionSecret = async (
  connectionSecretRef: string,
  expectedDbmsType?: DbmsType,
): Promise<ResolvedConnectionSecret> => {
  const parsed = parseConnectionSecretRef(connectionSecretRef);
  const provider = getSecretProvider();

  if (parsed.kind === "env") {
    if (provider === "supabase_vault") {
      console.warn(
        "[CONNECTION_SECRET_ENV_FALLBACK]",
        formatSecretRefForLog(parsed.raw),
      );
    }

    return {
      ref: parsed,
      credential: resolveEnvConnectionSecret(parsed.envName, expectedDbmsType),
    };
  }

  if (!isSupabaseServerConfigured()) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_PROVIDER_UNAVAILABLE",
      "vault ref를 사용하려면 Supabase URL과 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.",
      503,
      undefined,
      { ref: parsed.raw, provider },
    );
  }

  return {
    ref: parsed,
    credential: await fetchVaultConnectionSecret(parsed.vaultName, expectedDbmsType),
  };
};
