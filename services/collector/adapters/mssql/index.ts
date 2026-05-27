/** MSSQL Agentless 수집 어댑터입니다. */

import sql from "mssql";

import { getErpConnectionFailureMessage, getErpTestDbConfig } from "@/lib/db/erp-test";
import type {
  AvailabilityPayload,
  BlockingPayload,
  CollectorAdapter,
  CollectorContext,
  ConnectionTestResult,
  MetricPayload,
  SessionPayload,
  SqlPerformancePayload,
} from "@/services/collector/types";

type AvailabilityRow = {
  serverName: string | null;
  databaseName: string | null;
  serverTime: Date | string | null;
  version: string | null;
};

type MetricRow = {
  metricName: string;
  metricValue: number;
  unit: string | null;
  objectName: string | null;
  instanceName: string | null;
};

type SessionRow = {
  sessionId: number;
  loginName: string;
  status: string;
  waitType: string | null;
  waitMs: number | null;
  sqlId: string | null;
  hostName: string | null;
  programName: string | null;
  databaseName: string | null;
};

type BlockingRow = {
  blockerSessionId: number;
  blockedSessionId: number;
  lockType: string;
  waitMs: number;
  objectName: string | null;
};

type SqlPerformanceRow = {
  sqlId: string;
  sqlTextMasked: string | null;
  executions: number;
  avgElapsedMs: number;
  totalCpuMs: number;
  totalLogicalReads: number;
  lastExecutionTime: Date | string | null;
};

const now = () => new Date().toISOString();

const maskSqlText = (sqlText: string | null | undefined) =>
  (sqlText ?? "")
    .replace(/'([^']|'')*'/g, "'?'")
    .replace(/\b\d+(\.\d+)?\b/g, "?")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4_000);

const toIsoString = (value: Date | string | null) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
};

const createPool = () => {
  const result = getErpTestDbConfig();

  if (!result.configured) {
    throw new Error(`Missing ERP test DB environment: ${result.missingKeys.join(", ")}`);
  }

  return new sql.ConnectionPool(result.config);
};

const withConnection = async <T>(
  work: (connection: sql.ConnectionPool) => Promise<T>,
) => {
  const pool = createPool();

  try {
    const connection = await pool.connect();
    return await work(connection);
  } finally {
    await pool.close();
  }
};

const assertSupportedSecret = (context: CollectorContext) => {
  if (context.connectionSecretRef !== "env:ERP_TEST_DB") {
    throw new Error(
      "개발 단계 MSSQL Collector는 env:ERP_TEST_DB secret ref만 지원합니다.",
    );
  }
};

/**
 * MSSQL Collector 어댑터 인스턴스를 생성합니다.
 */
export const createMssqlCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  assertSupportedSecret(context);

  return {
    connect: async (): Promise<ConnectionTestResult> => {
      const startedAt = performance.now();

      try {
        await withConnection(async (connection) => {
          await connection.request().query("SELECT 1 AS ok;");
        });

        return {
          success: true,
          message: "MSSQL 연결 확인에 성공했습니다.",
          latencyMs: Math.round(performance.now() - startedAt),
        };
      } catch (error) {
        return {
          success: false,
          message: getErpConnectionFailureMessage(error),
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    },
    collectAvailability: async (): Promise<AvailabilityPayload> => {
      const startedAt = performance.now();
      const collectTime = now();

      try {
        const row = await withConnection(async (connection) => {
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
          healthMessage: "MSSQL 연결 가능",
          latencyMs: Math.round(performance.now() - startedAt),
          serverName: row?.serverName ?? null,
          databaseName: row?.databaseName ?? context.databaseName,
          version: row?.version ?? null,
        };
      } catch (error) {
        return {
          collectTime,
          isReachable: false,
          healthMessage: getErpConnectionFailureMessage(error),
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    },
    collectMetrics: async (): Promise<MetricPayload[]> => {
      const collectTime = now();
      const rows = await withConnection(async (connection) => {
        const result = await connection.request().query<MetricRow>(`
          SELECT
            RTRIM(counter_name) AS metricName,
            CAST(cntr_value AS float) AS metricValue,
            CASE
              WHEN counter_name LIKE '%/sec' THEN 'per_second'
              WHEN counter_name LIKE '%ratio%' THEN 'ratio'
              ELSE 'count'
            END AS unit,
            RTRIM(object_name) AS objectName,
            NULLIF(RTRIM(instance_name), '') AS instanceName
          FROM sys.dm_os_performance_counters
          WHERE counter_name IN (
            'Batch Requests/sec',
            'SQL Compilations/sec',
            'SQL Re-Compilations/sec',
            'Page life expectancy',
            'User Connections',
            'Processes blocked'
          );
        `);

        return result.recordset;
      });

      return rows.map((row) => ({
        collectTime,
        metricName: row.metricName,
        metricValue: Number(row.metricValue) || 0,
        unit: row.unit ?? "value",
        tags: {
          objectName: row.objectName ?? "",
          instanceName: row.instanceName ?? "",
        },
      }));
    },
    collectSessions: async (): Promise<SessionPayload[]> => {
      const collectTime = now();
      const rows = await withConnection(async (connection) => {
        const result = await connection.request().query<SessionRow>(`
          SELECT TOP (50)
            s.session_id AS sessionId,
            s.login_name AS loginName,
            s.status,
            r.wait_type AS waitType,
            r.wait_time AS waitMs,
            CONVERT(varchar(64), r.query_hash, 2) AS sqlId,
            s.host_name AS hostName,
            s.program_name AS programName,
            DB_NAME(COALESCE(r.database_id, s.database_id)) AS databaseName
          FROM sys.dm_exec_sessions s
          LEFT JOIN sys.dm_exec_requests r
            ON s.session_id = r.session_id
          WHERE s.is_user_process = 1
          ORDER BY COALESCE(r.cpu_time, 0) DESC, s.session_id;
        `);

        return result.recordset;
      });

      return rows.map((row) => ({
        collectTime,
        sessionId: String(row.sessionId),
        loginName: row.loginName,
        status: row.status,
        waitType: row.waitType,
        waitMs: row.waitMs,
        sqlId: row.sqlId,
        hostName: row.hostName,
        programName: row.programName,
        databaseName: row.databaseName,
      }));
    },
    collectLocks: async (): Promise<BlockingPayload[]> => {
      const collectTime = now();
      const rows = await withConnection(async (connection) => {
        const result = await connection.request().query<BlockingRow>(`
          SELECT TOP (50)
            r.blocking_session_id AS blockerSessionId,
            r.session_id AS blockedSessionId,
            COALESCE(tl.resource_type, 'REQUEST') AS lockType,
            r.wait_time AS waitMs,
            OBJECT_NAME(p.object_id, r.database_id) AS objectName
          FROM sys.dm_exec_requests r
          LEFT JOIN sys.dm_tran_locks tl
            ON r.session_id = tl.request_session_id
          LEFT JOIN sys.partitions p
            ON tl.resource_associated_entity_id = p.hobt_id
          WHERE r.blocking_session_id <> 0
          ORDER BY r.wait_time DESC;
        `);

        return result.recordset;
      });

      return rows.map((row) => ({
        collectTime,
        blockerSessionId: String(row.blockerSessionId),
        blockedSessionId: String(row.blockedSessionId),
        lockType: row.lockType,
        waitMs: row.waitMs,
        objectName: row.objectName,
      }));
    },
    collectDeadlocks: async () => [],
    collectSql: async (): Promise<SqlPerformancePayload[]> => {
      const collectTime = now();
      const rows = await withConnection(async (connection) => {
        const result = await connection.request().query<SqlPerformanceRow>(`
          SELECT TOP (20)
            CONVERT(varchar(64), qs.query_hash, 2) AS sqlId,
            SUBSTRING(
              st.text,
              (qs.statement_start_offset / 2) + 1,
              CASE qs.statement_end_offset
                WHEN -1 THEN DATALENGTH(st.text)
                ELSE (qs.statement_end_offset - qs.statement_start_offset) / 2 + 1
              END
            ) AS sqlTextMasked,
            qs.execution_count AS executions,
            CAST((qs.total_elapsed_time / NULLIF(qs.execution_count, 0)) / 1000.0 AS float) AS avgElapsedMs,
            CAST(qs.total_worker_time / 1000.0 AS float) AS totalCpuMs,
            CAST(qs.total_logical_reads AS float) AS totalLogicalReads,
            qs.last_execution_time AS lastExecutionTime
          FROM sys.dm_exec_query_stats qs
          CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) st
          ORDER BY qs.total_worker_time DESC;
        `);

        return result.recordset;
      });

      return rows.map((row) => ({
        collectTime,
        sqlId: row.sqlId,
        sqlTextMasked: maskSqlText(row.sqlTextMasked),
        executions: Number(row.executions) || 0,
        avgElapsedMs: Number(row.avgElapsedMs) || 0,
        totalCpuMs: Number(row.totalCpuMs) || 0,
        totalLogicalReads: Number(row.totalLogicalReads) || 0,
        lastExecutionTime: toIsoString(row.lastExecutionTime),
      }));
    },
  };
};
