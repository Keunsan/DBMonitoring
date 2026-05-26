/** DB·수집 상태를 표시하는 공통 배지 컴포넌트입니다. */

import { Badge } from "@/components/ui/badge";
import type { CollectStatus, DbHealth } from "@/types/domain";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  kind: "health" | "collect";
  value: DbHealth | CollectStatus;
  className?: string;
};

const HEALTH_LABELS: Record<DbHealth, string> = {
  NORMAL: "정상",
  CAUTION: "주의",
  WARNING: "경고",
  OUTAGE: "장애",
};

const COLLECT_LABELS: Record<CollectStatus, string> = {
  OK: "수집 정상",
  FAIL: "수집 실패",
  DELAYED: "수집 지연",
};

const STATUS_STYLES: Record<DbHealth | CollectStatus, string> = {
  NORMAL: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CAUTION: "border-amber-200 bg-amber-50 text-amber-700",
  WARNING: "border-orange-200 bg-orange-50 text-orange-700",
  OUTAGE: "border-red-200 bg-red-50 text-red-700",
  OK: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAIL: "border-red-200 bg-red-50 text-red-700",
  DELAYED: "border-amber-200 bg-amber-50 text-amber-700",
};

/**
 * 상태 값에 맞는 한글 라벨 배지를 렌더링합니다.
 */
export const StatusBadge = ({ kind, value, className }: StatusBadgeProps) => {
  const label =
    kind === "health"
      ? HEALTH_LABELS[value as DbHealth]
      : COLLECT_LABELS[value as CollectStatus];

  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[value], className)}>
      {label}
    </Badge>
  );
};
