/** 등록 전 DB 인스턴스 입력값으로 실제 연결을 검증하는 서비스입니다. */

import sql from "mssql";
import oracledb from "oracledb";

import { badRequest } from "@/lib/api";
import { buildMssqlPoolConfig, buildOracleConnectString } from "@/lib/db/connection-config";
import { maskHost } from "@/lib/security/mask";
import { getDbConnectionFailureMessage, toConnectionTestApiError } from "@/lib/secrets/errors";
import { parseConnectionCredentialInput } from "@/lib/secrets/validate";
import type { CollectorContext } from "@/services/collector/types";

import { parseDbInstanceInput } from "./store";

const now = () => new Date().toISOString();

type PrecreateConnectionTestInput = {
  instance: Record<string, unknown>;
  credential: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toPrecreateConnectionTestInput = (
  payload: Record<string, unknown>,
): PrecreateConnectionTestInput => {
  if (!isRecord(payload.instance)) {
    throw badRequest("DB 인스턴스 입력값이 필요합니다.");
  }

  if (!isRecord(payload.credential)) {
    throw badRequest("DB 접속 계정 입력값이 필요합니다.");
  }

  return {
    instance: payload.instance,
    credential: payload.credential,
  };
};

/**
 * 아직 저장하지 않은 DB 인스턴스 입력값과 접속 계정으로 연결을 테스트합니다.
 */
export const testPrecreateDbInstanceConnection = async (
  payload: Record<string, unknown>,
) => {
  const input = toPrecreateConnectionTestInput(payload);
  const instance = parseDbInstanceInput(input.instance);
  const credential = parseConnectionCredentialInput(input.credential, instance.dbmsType);
  const context: CollectorContext = {
    dbInstanceId: "precreate-test",
    dbmsType: instance.dbmsType,
    connectionSecretRef: "precreate:transient",
    instanceName: instance.instanceName,
    host: instance.host,
    port: instance.port,
    serviceName: instance.serviceName ?? credential.serviceName ?? null,
    databaseName: instance.databaseName ?? null,
    envType: instance.envType,
  };
  const startedAt = performance.now();

  try {
    if (instance.dbmsType === "ORACLE") {
      const connection = await oracledb.getConnection({
        user: credential.username,
        password: credential.password,
        connectString: buildOracleConnectString(context, credential),
      });

      try {
        await connection.execute("SELECT 1 AS ok FROM dual");
      } finally {
        await connection.close();
      }
    } else {
      const pool = new sql.ConnectionPool(buildMssqlPoolConfig(context, credential));

      try {
        const connection = await pool.connect();
        await connection.request().query("SELECT 1 AS ok;");
      } finally {
        await pool.close();
      }
    }

    return {
      status: "connected",
      dbmsType: instance.dbmsType,
      host: maskHost(instance.host),
      port: instance.port,
      databaseName: instance.databaseName,
      latencyMs: Math.round(performance.now() - startedAt),
      message: `${instance.dbmsType} 연결 확인에 성공했습니다.`,
      checkedAt: now(),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[PRECREATE_DB_CONNECTION_TEST_FAILED]", {
        dbmsType: instance.dbmsType,
        host: maskHost(instance.host),
        message: getDbConnectionFailureMessage(error),
      });
    }

    throw toConnectionTestApiError(error);
  }
};
