/** 사내 ERP 테스트 DB 연결 확인을 위한 서버 전용 유틸입니다. */

import sql, { type config as SqlConfig } from "mssql";

import { maskSecret } from "@/lib/security";

export type ErpTestDbSafeTarget = {
  host: string;
  port: number;
  database: string;
  user: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
};

export type ErpTestDbConnectionInfo = {
  serverName: string | null;
  databaseName: string | null;
  serverTime: string | Date | null;
  version: string | null;
};

type ErpTestDbConfigResult =
  | {
      configured: true;
      config: SqlConfig;
      safeTarget: ErpTestDbSafeTarget;
    }
  | {
      configured: false;
      missingKeys: string[];
    };

type ErpTestConnectionRow = {
  serverName: string | null;
  databaseName: string | null;
  serverTime: string | Date | null;
  version: string | null;
};

const DEFAULT_PORT = 1433;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;

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

const getRequiredEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : undefined;
};

/**
 * ERP 테스트 DB 연결 설정을 환경 변수에서 읽습니다.
 */
export const getErpTestDbConfig = (): ErpTestDbConfigResult => {
  const requiredKeys = [
    "ERP_TEST_DB_HOST",
    "ERP_TEST_DB_NAME",
    "ERP_TEST_DB_USER",
    "ERP_TEST_DB_PASSWORD",
  ];
  const missingKeys = requiredKeys.filter((key) => !getRequiredEnv(key));

  if (missingKeys.length > 0) {
    return {
      configured: false,
      missingKeys,
    };
  }

  const host = getRequiredEnv("ERP_TEST_DB_HOST") as string;
  const database = getRequiredEnv("ERP_TEST_DB_NAME") as string;
  const user = getRequiredEnv("ERP_TEST_DB_USER") as string;
  const password = getRequiredEnv("ERP_TEST_DB_PASSWORD") as string;
  const port = parseNumberEnv(process.env.ERP_TEST_DB_PORT, DEFAULT_PORT);
  const encrypt = parseBooleanEnv(process.env.ERP_TEST_DB_ENCRYPT, false);
  const trustServerCertificate = parseBooleanEnv(
    process.env.ERP_TEST_DB_TRUST_SERVER_CERTIFICATE,
    true,
  );

  return {
    configured: true,
    config: {
      server: host,
      port,
      database,
      user,
      password,
      connectionTimeout: parseNumberEnv(
        process.env.ERP_TEST_DB_CONNECTION_TIMEOUT_MS,
        DEFAULT_CONNECTION_TIMEOUT_MS,
      ),
      requestTimeout: parseNumberEnv(
        process.env.ERP_TEST_DB_REQUEST_TIMEOUT_MS,
        DEFAULT_REQUEST_TIMEOUT_MS,
      ),
      options: {
        encrypt,
        trustServerCertificate,
      },
      pool: {
        max: 1,
        min: 0,
      },
    },
    safeTarget: {
      host,
      port,
      database,
      user: maskSecret(user),
      encrypt,
      trustServerCertificate,
    },
  };
};

/**
 * ERP 테스트 DB에 접속해 기본 서버 정보를 조회합니다.
 */
export const testErpTestDbConnection = async (): Promise<{
  target: ErpTestDbSafeTarget;
  info: ErpTestDbConnectionInfo;
}> => {
  const result = getErpTestDbConfig();

  if (!result.configured) {
    throw new Error(`Missing ERP test DB environment: ${result.missingKeys.join(", ")}`);
  }

  const pool = new sql.ConnectionPool(result.config);

  try {
    const connection = await pool.connect();
    const queryResult = await connection.request().query<ErpTestConnectionRow>(`
      SELECT
        CAST(@@SERVERNAME AS nvarchar(256)) AS serverName,
        CAST(DB_NAME() AS nvarchar(256)) AS databaseName,
        SYSDATETIMEOFFSET() AS serverTime,
        CAST(@@VERSION AS nvarchar(max)) AS version;
    `);

    return {
      target: result.safeTarget,
      info: queryResult.recordset[0] ?? {
        serverName: null,
        databaseName: null,
        serverTime: null,
        version: null,
      },
    };
  } finally {
    await pool.close();
  }
};
