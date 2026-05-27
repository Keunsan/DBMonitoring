/** Azure SQL 수집 어댑터 (mssql 드라이버 기반)입니다. */

import { withMssqlConnection } from "@/lib/db/mssql-connection";
import { getDbConnectionFailureMessage } from "@/lib/secrets/errors";
import type {
  AvailabilityPayload,
  CollectorAdapter,
  CollectorContext,
  ConnectionTestResult,
} from "@/services/collector/types";

const now = () => new Date().toISOString();

type AvailabilityRow = {
  serverName: string | null;
  databaseName: string | null;
  serverTime: Date | string | null;
  version: string | null;
};

const withConnection = <T>(
  context: CollectorContext,
  work: (connection: import("mssql").ConnectionPool) => Promise<T>,
) => withMssqlConnection(context, work);

/**
 * Azure SQL Collector 어댑터 인스턴스를 생성합니다.
 */
export const createAzureSqlCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  const unsupported = async (): Promise<never> => {
    throw new Error("Azure SQL 상세 수집은 후속 단계에서 제공됩니다.");
  };

  return {
    connect: async (): Promise<ConnectionTestResult> => {
      const startedAt = performance.now();

      try {
        await withConnection(context, async (connection) => {
          await connection.request().query("SELECT 1 AS ok;");
        });

        return {
          success: true,
          message: "Azure SQL 연결 확인에 성공했습니다.",
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
        const row = await withConnection(context, async (connection) => {
          const result = await connection.request().query<AvailabilityRow>(`
            SELECT
              CAST(@@SERVERNAME AS nvarchar(256)) AS serverName,
              CAST(DB_NAME() AS nvarchar(256)) AS databaseName,
              SYSDATETIMEOFFSET() AS serverTime,
              CAST(@@VERSION AS nvarchar(max)) AS version;
          `);

          return result.recordset[0] ?? null;
        });

        return {
          collectTime,
          isReachable: true,
          healthMessage: "Azure SQL 연결 가능",
          latencyMs: Math.round(performance.now() - startedAt),
          serverName: row?.serverName ?? null,
          databaseName: row?.databaseName ?? context.databaseName,
          version: row?.version ?? null,
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
