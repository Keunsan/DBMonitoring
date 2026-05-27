/** 인스턴스 메타데이터와 credential로 DBMS별 연결 설정을 생성합니다. */

import type { config as SqlConfig } from "mssql";

import type { ConnectionCredential } from "@/lib/secrets/types";
import type { CollectorContext } from "@/services/collector/types";

const DEFAULT_PORT_MSSQL = 1433;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

/**
 * MSSQL/Azure SQL용 mssql ConnectionPool 설정을 생성합니다.
 */
export const buildMssqlPoolConfig = (
  context: CollectorContext,
  credential: ConnectionCredential,
): SqlConfig => {
  const encrypt = credential.encrypt ?? true;
  const trustServerCertificate = credential.trustServerCertificate ?? true;

  return {
    server: context.host,
    port: context.port || DEFAULT_PORT_MSSQL,
    database: context.databaseName ?? undefined,
    user: credential.username,
    password: credential.password,
    connectionTimeout:
      credential.connectionTimeoutMs ?? DEFAULT_CONNECTION_TIMEOUT_MS,
    requestTimeout: credential.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
    options: {
      encrypt,
      trustServerCertificate,
    },
    pool: {
      max: 1,
      min: 0,
    },
  };
};

/**
 * Oracle connectString을 생성합니다.
 */
export const buildOracleConnectString = (
  context: CollectorContext,
  credential: ConnectionCredential,
): string => {
  if (credential.connectString && credential.connectString.length > 0) {
    return credential.connectString;
  }

  const service = credential.serviceName ?? context.serviceName;

  if (service && service.length > 0) {
    return `${context.host}:${context.port}/${service}`;
  }

  if (context.databaseName) {
    return `${context.host}:${context.port}/${context.databaseName}`;
  }

  return `${context.host}:${context.port}`;
};
