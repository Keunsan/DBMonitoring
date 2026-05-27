/** QPS·TPS·세션 집계 지표를 카드 그리드로 표시합니다. */

import { MetricHealthBadge } from "@/components/features/monitoring/MetricHealthBadge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResourceSummary } from "@/lib/monitoring/resource-summary";

type ThroughputSessionCardsProps = {
  resource: ResourceSummary;
};

const formatValue = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "-";
  }

  return Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);
};

const MetricCard = ({
  label,
  value,
  unit,
  metricKey,
}: {
  label: string;
  value: number | null;
  unit: string;
  metricKey: keyof ResourceSummary;
}) => (
  <Card>
    <CardHeader className="pb-1.5">
      <div className="flex items-center justify-between gap-2">
        <CardDescription>{label}</CardDescription>
        <MetricHealthBadge metricKey={metricKey} value={value} />
      </div>
      <CardTitle className="text-xl">
        {formatValue(value)}
        {value !== null ? unit : ""}
      </CardTitle>
    </CardHeader>
  </Card>
);

/**
 * 처리량(QPS/TPS)과 세션 집계 수치를 요약 카드로 렌더링합니다.
 */
export const ThroughputSessionCards = ({ resource }: ThroughputSessionCardsProps) => (
  <section className="space-y-2">
    <h3 className="text-sm font-medium text-muted-foreground">처리량 · 세션</h3>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <MetricCard
        label="QPS (Batch Requests/sec)"
        value={resource.batchRequestsPerSec}
        unit="/s"
        metricKey="batchRequestsPerSec"
      />
      <MetricCard
        label="TPS (Transactions/sec)"
        value={resource.transactionsPerSec}
        unit="/s"
        metricKey="transactionsPerSec"
      />
      <MetricCard
        label="전체 사용자 세션"
        value={resource.sessionTotalCount}
        unit="개"
        metricKey="sessionTotalCount"
      />
      <MetricCard
        label="활성 세션"
        value={resource.sessionActiveCount}
        unit="개"
        metricKey="sessionActiveCount"
      />
      <MetricCard
        label="유휴 세션"
        value={resource.sessionIdleCount}
        unit="개"
        metricKey="sessionIdleCount"
      />
      <MetricCard
        label="SQL 실행 중 세션"
        value={resource.sessionRunningSqlCount}
        unit="개"
        metricKey="sessionRunningSqlCount"
      />
    </div>
  </section>
);
