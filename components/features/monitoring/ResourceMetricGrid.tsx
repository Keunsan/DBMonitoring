/** 수집된 서버 리소스 세부 지표를 그리드 테이블로 표시합니다. */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricHealthBadge } from "@/components/features/monitoring/MetricHealthBadge";
import { SERVER_METRIC_KEYS } from "@/lib/monitoring/metric-keys";
import {
  buildResourceSummary,
  type ResourceSummary,
} from "@/lib/monitoring/resource-summary";
import type { MetricHistoryRecord } from "@/services/storage/types";

type ResourceMetricGridProps = {
  metrics: MetricHistoryRecord[];
  resource?: ResourceSummary;
};

const metricLabels: Record<string, string> = {
  [SERVER_METRIC_KEYS.cpuUsedPercent]: "CPU 사용률",
  [SERVER_METRIC_KEYS.memoryUsedPercent]: "메모리 사용률",
  [SERVER_METRIC_KEYS.memoryAvailableMb]: "가용 메모리",
  [SERVER_METRIC_KEYS.memoryTotalMb]: "전체 메모리",
  [SERVER_METRIC_KEYS.pageLifeExpectancy]: "Page Life Expectancy",
  [SERVER_METRIC_KEYS.memoryGrantsPending]: "Memory Grants Pending",
  [SERVER_METRIC_KEYS.diskReadIops]: "디스크 읽기 IOPS",
  [SERVER_METRIC_KEYS.diskWriteIops]: "디스크 쓰기 IOPS",
  [SERVER_METRIC_KEYS.diskReadLatencyMs]: "디스크 읽기 지연",
  [SERVER_METRIC_KEYS.diskWriteLatencyMs]: "디스크 쓰기 지연",
  [SERVER_METRIC_KEYS.azureDataIoUsedPercent]: "Azure Data IO 사용률",
  [SERVER_METRIC_KEYS.azureLogWriteUsedPercent]: "Azure Log Write 사용률",
  [SERVER_METRIC_KEYS.storageDataUsedMb]: "데이터 사용량",
  [SERVER_METRIC_KEYS.storageDataSizeMb]: "데이터 파일 크기",
  [SERVER_METRIC_KEYS.logUsedPercent]: "로그 사용률",
  [SERVER_METRIC_KEYS.logUsedMb]: "로그 사용량",
  [SERVER_METRIC_KEYS.tempdbUsedMb]: "TempDB 사용량",
  [SERVER_METRIC_KEYS.batchRequestsPerSec]: "QPS (Batch Requests/sec)",
  [SERVER_METRIC_KEYS.transactionsPerSec]: "TPS (Transactions/sec)",
  [SERVER_METRIC_KEYS.userConnections]: "User Connections",
  [SERVER_METRIC_KEYS.processesBlocked]: "Processes Blocked",
  [SERVER_METRIC_KEYS.sessionTotalCount]: "전체 사용자 세션",
  [SERVER_METRIC_KEYS.sessionActiveCount]: "활성 세션",
  [SERVER_METRIC_KEYS.sessionIdleCount]: "유휴 세션",
  [SERVER_METRIC_KEYS.sessionRunningSqlCount]: "SQL 실행 중 세션",
};

const isTaggedDetailMetric = (metric: MetricHistoryRecord) =>
  Boolean(metric.tags.filegroupName || metric.tags.fileName || metric.tags.tableKey);

const resourceKeyByMetric: Partial<Record<string, keyof ResourceSummary>> = {
  [SERVER_METRIC_KEYS.cpuUsedPercent]: "cpuUsedPercent",
  [SERVER_METRIC_KEYS.memoryUsedPercent]: "memoryUsedPercent",
  [SERVER_METRIC_KEYS.pageLifeExpectancy]: "pageLifeExpectancy",
  [SERVER_METRIC_KEYS.memoryGrantsPending]: "memoryGrantsPending",
  [SERVER_METRIC_KEYS.diskReadLatencyMs]: "diskReadLatencyMs",
  [SERVER_METRIC_KEYS.diskWriteLatencyMs]: "diskWriteLatencyMs",
  [SERVER_METRIC_KEYS.logUsedPercent]: "logUsedPercent",
  [SERVER_METRIC_KEYS.processesBlocked]: "processesBlocked",
};

const formatNumber = (value: number, unit: string | null) => {
  const formatted = Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value);

  if (!unit) return formatted;
  if (unit === "percent") return `${formatted}%`;
  if (unit === "ms") return `${formatted} ms`;
  if (unit === "mb") return `${formatted} MB`;
  if (unit === "per_second") return `${formatted}/s`;
  return `${formatted} (${unit})`;
};

/**
 * 최신 metric 스냅샷의 세부 지표 목록을 테이블로 렌더링합니다.
 */
export const ResourceMetricGrid = ({ metrics, resource }: ResourceMetricGridProps) => {
  const summary = resource ?? buildResourceSummary(metrics);
  const scalarMetrics = metrics.filter((metric) => !isTaggedDetailMetric(metric));
  const sorted = [...scalarMetrics].sort((a, b) =>
    (metricLabels[a.metricName] ?? a.metricName).localeCompare(
      metricLabels[b.metricName] ?? b.metricName,
      "ko",
    ),
  );

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        수집된 서버 리소스 지표가 없습니다. Collector 실행 후 다시 확인해주세요.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>지표</TableHead>
          <TableHead>값</TableHead>
          <TableHead>단위</TableHead>
          <TableHead>상태</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((metric) => {
          const healthKey = resourceKeyByMetric[metric.metricName];
          return (
            <TableRow key={metric.id}>
              <TableCell>
                {metricLabels[metric.metricName] ?? metric.metricName}
              </TableCell>
              <TableCell>{formatNumber(metric.metricValue, metric.unit)}</TableCell>
              <TableCell>{metric.unit ?? "-"}</TableCell>
              <TableCell>
                {healthKey ? (
                  <MetricHealthBadge
                    metricKey={healthKey}
                    value={summary[healthKey]}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
