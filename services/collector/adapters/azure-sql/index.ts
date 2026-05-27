/** Azure SQL 수집 어댑터 (mssql 드라이버 기반)입니다. */

import { withMssqlConnection } from "@/lib/db/mssql-connection";
import { SERVER_METRIC_KEYS } from "@/lib/monitoring/metric-keys";
import { getDbConnectionFailureMessage } from "@/lib/secrets/errors";
import { createMssqlCollectorAdapter } from "@/services/collector/adapters/mssql";
import type {
  AvailabilityPayload,
  BlockingPayload,
  CollectorAdapter,
  CollectorContext,
  ConnectionTestResult,
  DeadlockPayload,
  MetricPayload,
  SessionPayload,
  SqlPerformancePayload,
} from "@/services/collector/types";

const now = () => new Date().toISOString();

type AvailabilityRow = {
  serverName: string | null;
  databaseName: string | null;
  serverTime: Date | string | null;
  version: string | null;
};

type AzureResourceStatsRow = {
  avgCpuPercent: number | null;
  avgDataIoPercent: number | null;
  avgLogWritePercent: number | null;
  avgMemoryUsagePercent: number | null;
  storageInMb: number | null;
};

const withConnection = <T>(
  context: CollectorContext,
  work: (connection: import("mssql").ConnectionPool) => Promise<T>,
) => withMssqlConnection(context, work);

const AZURE_PREFERRED_METRIC_KEYS = new Set<string>([
  SERVER_METRIC_KEYS.cpuUsedPercent,
  SERVER_METRIC_KEYS.memoryUsedPercent,
  SERVER_METRIC_KEYS.azureDataIoUsedPercent,
  SERVER_METRIC_KEYS.azureLogWriteUsedPercent,
  SERVER_METRIC_KEYS.storageDataSizeMb,
]);

const isValidMetricValue = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined && Number.isFinite(value);

const mergeAzurePreferredMetrics = (
  compatibleMetrics: MetricPayload[],
  azureMetrics: MetricPayload[],
): MetricPayload[] => {
  const merged = new Map<string, MetricPayload>();

  for (const metric of compatibleMetrics) {
    if (isValidMetricValue(metric.metricValue)) {
      merged.set(metric.metricName, metric);
    }
  }

  for (const metric of azureMetrics) {
    if (!isValidMetricValue(metric.metricValue)) {
      continue;
    }

    if (AZURE_PREFERRED_METRIC_KEYS.has(metric.metricName) || !merged.has(metric.metricName)) {
      merged.set(metric.metricName, metric);
    }
  }

  return [...merged.values()];
};

const pushMetric = (
  metrics: MetricPayload[],
  collectTime: string,
  metricName: string,
  metricValue: number | null,
  unit: string,
  tags: Record<string, string> = {},
) => {
  if (metricValue === null || !Number.isFinite(metricValue)) {
    return;
  }

  metrics.push({
    collectTime,
    metricName,
    metricValue,
    unit,
    tags,
  });
};

/**
 * Azure SQL Collector 어댑터 인스턴스를 생성합니다.
 */
export const createAzureSqlCollectorAdapter = (
  context: CollectorContext,
): CollectorAdapter => {
  const sqlServerCompatibleAdapter = createMssqlCollectorAdapter(context);

  const collectAzureResourceMetrics = async (
    collectTime: string,
  ): Promise<MetricPayload[]> => {
    const metrics: MetricPayload[] = [];

    try {
      const row = await withConnection(context, async (connection) => {
        const result = await connection.request().query<AzureResourceStatsRow>(`
          SELECT TOP (1)
            CAST(avg_cpu_percent AS float) AS avgCpuPercent,
            CAST(avg_data_io_percent AS float) AS avgDataIoPercent,
            CAST(avg_log_write_percent AS float) AS avgLogWritePercent,
            CAST(avg_memory_usage_percent AS float) AS avgMemoryUsagePercent,
            CAST(storage_in_megabytes AS float) AS storageInMb
          FROM sys.dm_db_resource_stats
          WHERE end_time >= DATEADD(minute, -15, SYSUTCDATETIME())
          ORDER BY end_time DESC;
        `);

        return result.recordset[0] ?? null;
      });

      if (!row) {
        return metrics;
      }

      pushMetric(
        metrics,
        collectTime,
        SERVER_METRIC_KEYS.cpuUsedPercent,
        row.avgCpuPercent,
        "percent",
        { source: "sys.dm_db_resource_stats" },
      );
      pushMetric(
        metrics,
        collectTime,
        SERVER_METRIC_KEYS.memoryUsedPercent,
        row.avgMemoryUsagePercent,
        "percent",
        { source: "sys.dm_db_resource_stats" },
      );
      pushMetric(
        metrics,
        collectTime,
        SERVER_METRIC_KEYS.azureDataIoUsedPercent,
        row.avgDataIoPercent,
        "percent",
        { source: "sys.dm_db_resource_stats", azureMetric: "avg_data_io_percent" },
      );
      pushMetric(
        metrics,
        collectTime,
        SERVER_METRIC_KEYS.azureLogWriteUsedPercent,
        row.avgLogWritePercent,
        "percent",
        { source: "sys.dm_db_resource_stats", azureMetric: "avg_log_write_percent" },
      );
      pushMetric(
        metrics,
        collectTime,
        SERVER_METRIC_KEYS.storageDataSizeMb,
        row.storageInMb,
        "mb",
        { source: "sys.dm_db_resource_stats" },
      );
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[AZURE_SQL_COLLECT_METRIC_SKIP] resource_stats", error);
      }
    }

    return metrics;
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
    collectMetrics: async (): Promise<MetricPayload[]> => {
      const compatibleMetrics = await sqlServerCompatibleAdapter.collectMetrics();
      const collectTime = compatibleMetrics[0]?.collectTime ?? now();
      const azureMetrics = await collectAzureResourceMetrics(collectTime);

      return mergeAzurePreferredMetrics(compatibleMetrics, azureMetrics);
    },
    collectSessions: async (): Promise<SessionPayload[]> =>
      sqlServerCompatibleAdapter.collectSessions(),
    collectLocks: async (): Promise<BlockingPayload[]> =>
      sqlServerCompatibleAdapter.collectLocks(),
    collectDeadlocks: async (): Promise<DeadlockPayload[]> =>
      sqlServerCompatibleAdapter.collectDeadlocks(),
    collectSql: async (): Promise<SqlPerformancePayload[]> =>
      sqlServerCompatibleAdapter.collectSql(),
  };
};
