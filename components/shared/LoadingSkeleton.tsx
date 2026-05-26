/** 화면·카드 로딩 중 사용할 공통 스켈레톤 컴포넌트입니다. */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
};

/**
 * 대시보드 카드와 목록 영역에서 일관된 로딩 상태를 표시합니다.
 */
export const LoadingSkeleton = ({
  rows = 4,
  className,
}: LoadingSkeletonProps) => {
  return (
    <div className={cn("space-y-3 rounded-xl border bg-background p-4", className)}>
      <Skeleton className="h-5 w-36" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
};
