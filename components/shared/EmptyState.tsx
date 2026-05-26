/** 데이터가 없을 때 안내와 후속 액션을 표시하는 공통 컴포넌트입니다. */

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * 목록·대시보드 위젯에서 데이터가 없는 상태를 한글 메시지로 안내합니다.
 */
export const EmptyState = ({
  title = "표시할 데이터가 없습니다",
  description = "조건을 변경하거나 데이터 수집 설정을 확인해 주세요.",
  action,
  className,
}: EmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-background p-8 text-center",
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
        <Inbox className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
};
