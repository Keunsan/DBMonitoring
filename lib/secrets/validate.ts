/** Connection credential JSON 검증입니다. */

import { badRequest } from "@/lib/api";
import type { DbmsType } from "@/types/domain";

import type { ConnectionCredential } from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requireStringField = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`접속 Secret에 ${key} 값이 필요합니다.`);
  }

  return value.trim();
};

const optionalBoolean = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
  }

  return undefined;
};

const optionalNumber = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Vault/환경 변수에서 읽은 JSON을 ConnectionCredential로 검증합니다.
 */
export const parseConnectionCredential = (
  payload: unknown,
  expectedDbmsType?: DbmsType,
): ConnectionCredential => {
  if (!isRecord(payload)) {
    throw badRequest("접속 Secret JSON 형식이 올바르지 않습니다.");
  }

  const dbmsType = requireStringField(payload, "dbmsType") as DbmsType;

  if (!["MSSQL", "ORACLE", "AZURE_SQL"].includes(dbmsType)) {
    throw badRequest("지원하지 않는 dbmsType 입니다.");
  }

  if (expectedDbmsType && dbmsType !== expectedDbmsType) {
    throw badRequest(
      `접속 Secret의 DBMS(${dbmsType})가 인스턴스 DBMS(${expectedDbmsType})와 일치하지 않습니다.`,
    );
  }

  const username = requireStringField(payload, "username");
  const password = requireStringField(payload, "password");

  const credential: ConnectionCredential = {
    dbmsType,
    username,
    password,
    encrypt: optionalBoolean(payload, "encrypt"),
    trustServerCertificate: optionalBoolean(payload, "trustServerCertificate"),
    connectionTimeoutMs: optionalNumber(payload, "connectionTimeoutMs"),
    requestTimeoutMs: optionalNumber(payload, "requestTimeoutMs"),
    connectString:
      typeof payload.connectString === "string" ? payload.connectString.trim() : undefined,
    serviceName:
      typeof payload.serviceName === "string" ? payload.serviceName.trim() : undefined,
    walletLocation:
      typeof payload.walletLocation === "string" ? payload.walletLocation.trim() : undefined,
  };

  if (dbmsType === "ORACLE") {
    if (!credential.connectString && !credential.serviceName) {
      throw badRequest("Oracle 접속 Secret에는 connectString 또는 serviceName이 필요합니다.");
    }
  }

  return credential;
};

/**
 * API 요청 body에서 credential 입력을 검증합니다.
 */
export const parseConnectionCredentialInput = (
  payload: unknown,
  dbmsType: DbmsType,
): ConnectionCredential => parseConnectionCredential({ ...(payload as object), dbmsType }, dbmsType);
