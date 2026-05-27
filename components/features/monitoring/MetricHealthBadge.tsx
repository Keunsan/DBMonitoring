/** 리소스 지표 값에 따른 건강 상태 배지를 표시합니다. */

import { Badge } from "@/components/ui/badge";
import {
  getResourceHealth,
  type ResourceSummary,
} from "@/lib/monitoring/resource-summary";

type MetricHealthBadgeProps = {
  metricKey: keyof ResourceSummary;
  value: number | null;
};

const healthLabel: Record<
  ReturnType<typeof getResourceHealth>,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  normal: { label: "정상", variant: "secondary" },
  caution: { label: "주의", variant: "outline" },
  warning: { label: "경고", variant: "destructive" },
  unknown: { label: "미수집", variant: "outline" },
};

/**
 * 임계치 기준으로 지표 건강 상태를 배지로 렌더링합니다.
 */
export const MetricHealthBadge = ({ metricKey, value }: MetricHealthBadgeProps) => {
  const health = getResourceHealth(metricKey, value);
  const config = healthLabel[health];

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
