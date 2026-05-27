/** Oracle 수집 어댑터 (연결 테스트·가용성 1차)입니다. */

import oracledb from "oracledb";

import { withOracleConnection } from "@/lib/db/oracle-connection";
import { getDbConnectionFailureMessage } from "@/lib/secrets/errors";
import type {
  AvailabilityPayload,
  CollectorAdapter,
  CollectorContext,
  ConnectionTestResult,
} from "@/services/collector/types";

const now = () => new Date().toISOString();

/**
 * Oracle Collector 어댑터 인스턴스를 생성합니다.
 */
export const createOracleCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  const unsupported = async (): Promise<never> => {
    throw new Error("Oracle 상세 수집은 후속 단계에서 제공됩니다.");
  };

  return {
    connect: async (): Promise<ConnectionTestResult> => {
      const startedAt = performance.now();

      try {
        await withOracleConnection(context, async (connection) => {
          await connection.execute("SELECT 1 AS ok FROM dual");
        });

        return {
          success: true,
          message: "Oracle 연결 확인에 성공했습니다.",
          latencyMs: Math.round(performance.now() - startedAt),
        };
      } catch (error) {
        return {
          success: false,
          message: getDbConnectionFailureMessage(error),
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    },
    collectAvailability: async (): Promise<AvailabilityPayload> => {
      const startedAt = performance.now();
      const collectTime = now();

      try {
        const row = await withOracleConnection(context, async (connection) => {
          const result = await connection.execute<{
            SERVER_NAME: string;
            DATABASE_NAME: string;
            SERVER_TIME: Date;
            VERSION: string;
          }>(
            `SELECT
              SYS_CONTEXT('USERENV', 'SERVER_HOST') AS server_name,
              SYS_CONTEXT('USERENV', 'DB_NAME') AS database_name,
              SYSTIMESTAMP AS server_time,
              BANNER AS version
             FROM v$version
             WHERE ROWNUM = 1`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT },
          );

          return result.rows?.[0] ?? null;
        });

        return {
          collectTime,
          isReachable: true,
          healthMessage: "Oracle 연결 가능",
          latencyMs: Math.round(performance.now() - startedAt),
          serverName: row?.SERVER_NAME ?? null,
          databaseName: row?.DATABASE_NAME ?? context.databaseName,
          version: row?.VERSION ?? null,
        };
      } catch (error) {
        return {
          collectTime,
          isReachable: false,
          healthMessage: getDbConnectionFailureMessage(error),
          latencyMs: Math.round(performance.now() - startedAt),
          databaseName: context.databaseName,
        };
      }
    },
    collectMetrics: unsupported,
    collectSessions: unsupported,
    collectLocks: unsupported,
    collectDeadlocks: unsupported,
    collectSql: unsupported,
  };
};
