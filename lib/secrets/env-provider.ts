/** env: ref 기반 로컬/개발 Secret Provider입니다. */

import { getOptionalEnv } from "@/lib/env";
import type { DbmsType } from "@/types/domain";

import { connectionSecretError } from "./errors";
import { parseConnectionCredential } from "./validate";
import type { ConnectionCredential } from "./types";

const parseBooleanEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "y"].includes(value.trim().toLowerCase());
};

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const envKey = (envName: string, suffix: string) => {
  const normalized = envName.replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
  return `${normalized}_${suffix}`;
};

/**
 * env:ERP_TEST_DB 등 고정 env 묶음에서 credential을 읽습니다.
 */
export const resolveEnvConnectionSecret = (
  envName: string,
  expectedDbmsType?: DbmsType,
): ConnectionCredential => {
  if (envName === "ERP_TEST_DB") {
    const host = getOptionalEnv("ERP_TEST_DB_HOST");
    const database = getOptionalEnv("ERP_TEST_DB_NAME");
    const username = getOptionalEnv("ERP_TEST_DB_USER");
    const password = getOptionalEnv("ERP_TEST_DB_PASSWORD");

    const missing = [
      !host ? "ERP_TEST_DB_HOST" : null,
      !database ? "ERP_TEST_DB_NAME" : null,
      !username ? "ERP_TEST_DB_USER" : null,
      !password ? "ERP_TEST_DB_PASSWORD" : null,
    ].filter(Boolean) as string[];

    if (missing.length > 0) {
      throw connectionSecretError(
        "DB_CONNECTION_SECRET_NOT_FOUND",
        `접속 Secret 환경 변수가 설정되지 않았습니다: ${missing.join(", ")}`,
        400,
        undefined,
        { missingKeys: missing },
      );
    }

    const credential: ConnectionCredential = {
      dbmsType: expectedDbmsType ?? "MSSQL",
      username: username as string,
      password: password as string,
      encrypt: parseBooleanEnv(process.env.ERP_TEST_DB_ENCRYPT, true),
      trustServerCertificate: parseBooleanEnv(
        process.env.ERP_TEST_DB_TRUST_SERVER_CERTIFICATE,
        true,
      ),
      connectionTimeoutMs: parseNumberEnv(
        process.env.ERP_TEST_DB_CONNECTION_TIMEOUT_MS,
        5_000,
      ),
      requestTimeoutMs: parseNumberEnv(process.env.ERP_TEST_DB_REQUEST_TIMEOUT_MS, 10_000),
    };

    return parseConnectionCredential(credential, expectedDbmsType);
  }

  const username = getOptionalEnv(envKey(envName, "USER"));
  const password = getOptionalEnv(envKey(envName, "PASSWORD"));

  if (!username || !password) {
    throw connectionSecretError(
      "DB_CONNECTION_SECRET_NOT_FOUND",
      `접속 Secret 환경 변수가 설정되지 않았습니다: ${envKey(envName, "USER")}, ${envKey(envName, "PASSWORD")}`,
      400,
      undefined,
      { envName },
    );
  }

  const payload: ConnectionCredential = {
    dbmsType: expectedDbmsType ?? "MSSQL",
    username,
    password,
    encrypt: parseBooleanEnv(getOptionalEnv(envKey(envName, "ENCRYPT")), true),
    trustServerCertificate: parseBooleanEnv(
      getOptionalEnv(envKey(envName, "TRUST_SERVER_CERTIFICATE")),
      true,
    ),
    connectionTimeoutMs: parseNumberEnv(
      getOptionalEnv(envKey(envName, "CONNECTION_TIMEOUT_MS")),
      5_000,
    ),
    requestTimeoutMs: parseNumberEnv(
      getOptionalEnv(envKey(envName, "REQUEST_TIMEOUT_MS")),
      10_000,
    ),
    connectString: getOptionalEnv(envKey(envName, "CONNECT_STRING")),
    serviceName: getOptionalEnv(envKey(envName, "SERVICE_NAME")),
  };

  return parseConnectionCredential(payload, expectedDbmsType);
};
