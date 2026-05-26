"use client";

/** 오류 상황에서 원인 안내와 재시도 액션을 표시하는 공통 컴포넌트입니다. */

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

/**
 * 사용자에게 노출 가능한 한글 오류 메시지와 선택적 재시도 버튼을 렌더링합니다.
 */
export const ErrorState = ({
  title = "요청을 처리하지 못했습니다",
  description = "잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.",
  retryLabel = "다시 시도",
  onRetry,
  className,
}: ErrorStateProps) => {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      {onRetry ? (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
};
