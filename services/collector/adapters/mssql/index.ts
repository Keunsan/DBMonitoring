/** MSSQL Agentless 수집 어댑터입니다. */

import sql from "mssql";

import { withMssqlConnection } from "@/lib/db/mssql-connection";
import { SERVER_METRIC_KEYS } from "@/lib/monitoring/metric-keys";
import { getDbConnectionFailureMessage } from "@/lib/secrets/errors";
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

/**
 * MSSQL Collector 어댑터 인스턴스를 생성합니다.
 */
export const createMssqlCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  const withConnection = async <T>(
    work: (connection: sql.ConnectionPool) => Promise<T>,
  ) => withMssqlConnection(context, work);

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
          message: getDbConnectionFailureMessage(error),
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
          healthMessage: getDbConnectionFailureMessage(error),
          latencyMs: Math.round(performance.now() - startedAt),
        };
      }
    },
    collectMetrics: async (): Promise<MetricPayload[]> => {
      const collectTime = now();

      return withConnection(async (connection) => {
        const metrics: MetricPayload[] = [];

        const push = (
          metricName: string,
          metricValue: number,
          unit: string,
          tags: Record<string, string> = {},
        ) => {
          metrics.push({
            collectTime,
            metricName,
            metricValue,
            unit,
            tags,
          });
        };

        const safeQuery = async <T>(label: string, query: () => Promise<T>) => {
          try {
            return await query();
          } catch (error) {
            if (process.env.NODE_ENV === "development") {
              console.warn(`[MSSQL_COLLECT_METRIC_SKIP] ${label}`, error);
            }
            return null;
          }
        };

        const counterRows = await safeQuery("performance_counters", async () => {
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
              'Transactions/sec',
              'Log Flushes/sec',
              'Page life expectancy',
              'User Connections',
              'Processes blocked',
              'Memory Grants Pending',
              'Process % Processor Time',
              '% Processor Time'
            )
          `);
          return result.recordset;
        });

        if (counterRows) {
          const counterMap = new Map(
            counterRows.map((row) => [
              `${row.objectName ?? ""}|${row.instanceName ?? ""}|${row.metricName}`,
              row,
            ]),
          );

          const getCounter = (objectName: string, counterName: string, instance = "") => {
            const key = `${objectName}|${instance}|${counterName}`;
            return counterMap.get(key);
          };

          const cpuProcess = getCounter("Process", "Process % Processor Time", "_Total");
          const cpuTotal = getCounter("Processor", "% Processor Time", "_Total");
          const cpuRow =
            cpuProcess ??
            cpuTotal ??
            counterRows.find(
              (row) =>
                row.metricName === "Process % Processor Time" ||
                row.metricName === "% Processor Time",
            );
          if (cpuRow) {
            push(
              SERVER_METRIC_KEYS.cpuUsedPercent,
              Math.min(100, Math.max(0, cpuRow.metricValue)),
              "percent",
              { rawName: cpuRow.metricName, source: "dm_os_performance_counters" },
            );
          }

          const ple = getCounter("SQLServer:Buffer Manager", "Page life expectancy");
          if (ple) {
            push(SERVER_METRIC_KEYS.pageLifeExpectancy, ple.metricValue, "seconds", {
              rawName: ple.metricName,
            });
          }

          const mgp = getCounter("SQLServer:Memory Manager", "Memory Grants Pending");
          if (mgp) {
            push(SERVER_METRIC_KEYS.memoryGrantsPending, mgp.metricValue, "count", {
              rawName: mgp.metricName,
            });
          }

          const batch = getCounter("SQLServer:SQL Statistics", "Batch Requests/sec");
          if (batch) {
            push(SERVER_METRIC_KEYS.batchRequestsPerSec, batch.metricValue, "per_second", {
              rawName: batch.metricName,
            });
          }

          const txn = getCounter("SQLServer:Databases", "Transactions/sec");
          if (txn) {
            push(SERVER_METRIC_KEYS.transactionsPerSec, txn.metricValue, "per_second", {
              rawName: txn.metricName,
            });
          }

          const logFlush = getCounter("SQLServer:Databases", "Log Flushes/sec");
          if (logFlush) {
            push(SERVER_METRIC_KEYS.logFlushesPerSec, logFlush.metricValue, "per_second", {
              rawName: logFlush.metricName,
            });
          }

          const userConn = getCounter("SQLServer:General Statistics", "User Connections");
          if (userConn) {
            push(SERVER_METRIC_KEYS.userConnections, userConn.metricValue, "count", {
              rawName: userConn.metricName,
            });
          }

          const blocked = getCounter("SQLServer:General Statistics", "Processes blocked");
          if (blocked) {
            push(SERVER_METRIC_KEYS.processesBlocked, blocked.metricValue, "count", {
              rawName: blocked.metricName,
            });
          }
        }

        const memoryRow = await safeQuery("os_memory", async () => {
          const result = await connection.request().query<{
            totalPhysicalMemoryKb: number;
            availablePhysicalMemoryKb: number;
          }>(`
            SELECT
              CAST(total_physical_memory_kb AS float) AS totalPhysicalMemoryKb,
              CAST(available_physical_memory_kb AS float) AS availablePhysicalMemoryKb
            FROM sys.dm_os_sys_memory;
          `);
          return result.recordset[0] ?? null;
        });

        if (memoryRow && memoryRow.totalPhysicalMemoryKb > 0) {
          const totalMb = memoryRow.totalPhysicalMemoryKb / 1024;
          const availMb = memoryRow.availablePhysicalMemoryKb / 1024;
          const usedPercent =
            ((memoryRow.totalPhysicalMemoryKb - memoryRow.availablePhysicalMemoryKb) /
              memoryRow.totalPhysicalMemoryKb) *
            100;
          push(SERVER_METRIC_KEYS.memoryTotalMb, totalMb, "mb", { source: "dm_os_sys_memory" });
          push(SERVER_METRIC_KEYS.memoryAvailableMb, availMb, "mb", {
            source: "dm_os_sys_memory",
          });
          push(SERVER_METRIC_KEYS.memoryUsedPercent, usedPercent, "percent", {
            source: "dm_os_sys_memory",
          });
        }

        const sqlMemoryRow = await safeQuery("process_memory", async () => {
          const result = await connection.request().query<{
            memoryUtilizationPercentage: number;
            physicalMemoryInUseKb: number;
          }>(`
            SELECT
              CAST(memory_utilization_percentage AS float) AS memoryUtilizationPercentage,
              CAST(physical_memory_in_use_kb AS float) AS physicalMemoryInUseKb
            FROM sys.dm_os_process_memory;
          `);
          return result.recordset[0] ?? null;
        });

        if (sqlMemoryRow && metrics.every((m) => m.metricName !== SERVER_METRIC_KEYS.memoryUsedPercent)) {
          push(
            SERVER_METRIC_KEYS.memoryUsedPercent,
            sqlMemoryRow.memoryUtilizationPercentage,
            "percent",
            { source: "dm_os_process_memory" },
          );
        }

        const ioRow = await safeQuery("io_stats", async () => {
          const result = await connection.request().query<{
            numReads: number;
            numWrites: number;
            readStallMs: number;
            writeStallMs: number;
          }>(`
            SELECT
              CAST(SUM(num_of_reads) AS float) AS numReads,
              CAST(SUM(num_of_writes) AS float) AS numWrites,
              CAST(SUM(io_stall_read_ms) AS float) AS readStallMs,
              CAST(SUM(io_stall_write_ms) AS float) AS writeStallMs
            FROM sys.dm_io_virtual_file_stats(DB_ID(), NULL);
          `);
          return result.recordset[0] ?? null;
        });

        if (ioRow) {
          push(SERVER_METRIC_KEYS.diskReadIops, ioRow.numReads, "count", {
            source: "dm_io_virtual_file_stats",
          });
          push(SERVER_METRIC_KEYS.diskWriteIops, ioRow.numWrites, "count", {
            source: "dm_io_virtual_file_stats",
          });
          if (ioRow.numReads > 0) {
            push(
              SERVER_METRIC_KEYS.diskReadLatencyMs,
              ioRow.readStallMs / ioRow.numReads,
              "ms",
              { source: "dm_io_virtual_file_stats" },
            );
          }
          if (ioRow.numWrites > 0) {
            push(
              SERVER_METRIC_KEYS.diskWriteLatencyMs,
              ioRow.writeStallMs / ioRow.numWrites,
              "ms",
              { source: "dm_io_virtual_file_stats" },
            );
          }
        }

        const fileRows = await safeQuery("database_files", async () => {
          const result = await connection.request().query<{
            typeDesc: string;
            sizeMb: number;
            usedMb: number;
          }>(`
            SELECT
              type_desc AS typeDesc,
              CAST(size * 8.0 / 1024 AS float) AS sizeMb,
              CAST(FILEPROPERTY(name, 'SpaceUsed') * 8.0 / 1024 AS float) AS usedMb
            FROM sys.database_files;
          `);
          return result.recordset;
        });

        if (fileRows) {
          let dataSizeMb = 0;
          let dataUsedMb = 0;
          let logSizeMb = 0;
          let logUsedMb = 0;

          for (const file of fileRows) {
            if (file.typeDesc === "ROWS") {
              dataSizeMb += file.sizeMb;
              dataUsedMb += file.usedMb ?? 0;
            }
            if (file.typeDesc === "LOG") {
              logSizeMb += file.sizeMb;
              logUsedMb += file.usedMb ?? 0;
            }
          }

          if (dataSizeMb > 0) {
            push(SERVER_METRIC_KEYS.storageDataSizeMb, dataSizeMb, "mb", {
              source: "sys.database_files",
            });
            push(SERVER_METRIC_KEYS.storageDataUsedMb, dataUsedMb, "mb", {
              source: "sys.database_files",
            });
          }

          if (logSizeMb > 0) {
            push(
              SERVER_METRIC_KEYS.logUsedPercent,
              (logUsedMb / logSizeMb) * 100,
              "percent",
              { source: "sys.database_files" },
            );
            push(SERVER_METRIC_KEYS.logUsedMb, logUsedMb, "mb", {
              source: "sys.database_files",
            });
          }
        }

        const tempdbRow = await safeQuery("tempdb_size", async () => {
          const result = await connection.request().query<{ usedMb: number }>(`
            SELECT
              CAST(SUM(
                COALESCE(FILEPROPERTY(name, 'SpaceUsed'), size) * 8.0 / 1024
              ) AS float) AS usedMb
            FROM tempdb.sys.database_files;
          `);
          return result.recordset[0] ?? null;
        });

        if (tempdbRow && tempdbRow.usedMb !== null && !Number.isNaN(tempdbRow.usedMb)) {
          push(SERVER_METRIC_KEYS.tempdbUsedMb, tempdbRow.usedMb, "mb", {
            source: "tempdb.sys.database_files",
          });
        }

        return metrics;
      });
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
