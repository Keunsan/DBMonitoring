/** DB 인스턴스 connection secret 등록·삭제 비즈니스 로직입니다. */

import { badRequest, notFound } from "@/lib/api";
import {
  buildVaultConnectionSecretRef,
  buildVaultSecretName,
  deleteConnectionSecret,
  parseConnectionCredentialInput,
  parseConnectionSecretRef,
  upsertConnectionSecret,
} from "@/lib/secrets";
import { getDbInstance, updateDbInstanceSecretRef } from "./store";

export type ConnectionSecretInput = {
  username: string;
  password: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  connectionTimeoutMs?: number;
  requestTimeoutMs?: number;
  connectString?: string;
  serviceName?: string;
  walletLocation?: string;
};

/**
 * DB 인스턴스 접속 Secret을 Vault에 저장하고 ref를 갱신합니다.
 */
export const saveDbInstanceConnectionSecret = async (
  id: string,
  payload: ConnectionSecretInput,
) => {
  const instance = await getDbInstance(id);
  const credential = parseConnectionCredentialInput(
    {
      username: payload.username,
      password: payload.password,
      encrypt: payload.encrypt,
      trustServerCertificate: payload.trustServerCertificate,
      connectionTimeoutMs: payload.connectionTimeoutMs,
      requestTimeoutMs: payload.requestTimeoutMs,
      connectString: payload.connectString,
      serviceName: payload.serviceName ?? instance.serviceName ?? undefined,
      walletLocation: payload.walletLocation,
    },
    instance.dbmsType,
  );

  const vaultName = buildVaultSecretName(id);
  await upsertConnectionSecret(
    vaultName,
    credential,
    `Connection credential for ${instance.instanceName}`,
  );

  const connectionSecretRef = buildVaultConnectionSecretRef(id);
  const updated = await updateDbInstanceSecretRef(id, connectionSecretRef);

  return {
    dbInstanceId: id,
    connectionSecretRef: updated.connectionSecretRef,
    vaultName,
    savedAt: new Date().toISOString(),
  };
};

/**
 * DB 인스턴스 접속 Secret을 Vault에서 삭제합니다.
 */
export const removeDbInstanceConnectionSecret = async (id: string) => {
  const instance = await getDbInstance(id);
  const parsed = parseConnectionSecretRef(instance.connectionSecretRef);

  if (parsed.kind !== "vault") {
    throw badRequest("env: ref 인스턴스는 Vault Secret 삭제 대상이 아닙니다.");
  }

  const deleted = await deleteConnectionSecret(parsed.vaultName);

  if (!deleted) {
    throw notFound("삭제할 접속 Secret을 찾을 수 없습니다.");
  }

  return {
    dbInstanceId: id,
    deleted: true,
    vaultName: parsed.vaultName,
  };
};

