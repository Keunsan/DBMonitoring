/** connection_secret_ref 생성·파싱 유틸입니다. */

import { badRequest } from "@/lib/api";

import type { ConnectionSecretRefKind, ParsedConnectionSecretRef } from "./types";

const VAULT_PREFIX = "vault:";
const ENV_PREFIX = "env:";

/**
 * DB 인스턴스용 Supabase Vault secret 이름을 생성합니다.
 */
export const buildVaultSecretName = (dbInstanceId: string, keyPrefix?: string) => {
  const prefix = (keyPrefix ?? process.env.SECRET_KEY_PREFIX ?? "dbmonitoring").trim();
  return `${prefix}/instances/${dbInstanceId}`;
};

/**
 * DB 인스턴스용 vault connection_secret_ref 문자열을 생성합니다.
 */
export const buildVaultConnectionSecretRef = (dbInstanceId: string, keyPrefix?: string) =>
  `${VAULT_PREFIX}${buildVaultSecretName(dbInstanceId, keyPrefix)}`;

/**
 * connection_secret_ref 문자열을 파싱합니다.
 */
export const parseConnectionSecretRef = (ref: string): ParsedConnectionSecretRef => {
  const trimmed = ref.trim();

  if (trimmed.startsWith(VAULT_PREFIX)) {
    const vaultName = trimmed.slice(VAULT_PREFIX.length).trim();

    if (vaultName.length === 0) {
      throw badRequest("vault secret ref 형식이 올바르지 않습니다.");
    }

    return { kind: "vault", vaultName, raw: trimmed };
  }

  if (trimmed.startsWith(ENV_PREFIX)) {
    const envName = trimmed.slice(ENV_PREFIX.length).trim();

    if (envName.length === 0) {
      throw badRequest("env secret ref 형식이 올바르지 않습니다.");
    }

    return { kind: "env", envName, raw: trimmed };
  }

  throw badRequest(
    "connectionSecretRef는 vault: 또는 env: 로 시작해야 합니다. 예: vault:dbmonitoring/instances/{id}",
  );
};

/**
 * ref 종류를 반환합니다.
 */
export const getConnectionSecretRefKind = (ref: string): ConnectionSecretRefKind =>
  parseConnectionSecretRef(ref).kind;
