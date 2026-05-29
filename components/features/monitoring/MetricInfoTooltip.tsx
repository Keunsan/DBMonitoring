"use client";

/** 모니터링 지표명에 정의·계산식·해석 툴팁을 붙이는 컴포넌트입니다. */

import type { ReactNode } from "react";
import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMetricTooltipContent } from "@/lib/monitoring/metric-tooltips";
import type { ResourceSummary } from "@/lib/monitoring/resource-summary";
import { cn } from "@/lib/utils";

type MetricInfoTooltipProps = {
  tooltipKey: keyof ResourceSummary | string;
  children: ReactNode;
  className?: string;
};

/**
 * 지표 라벨 hover/focus 시 정의·계산식·해석을 보여줍니다.
 */
export const MetricInfoTooltip = ({
  tooltipKey,
  children,
  className,
}: MetricInfoTooltipProps) => {
  const content = getMetricTooltipContent(tooltipKey);

  if (!content) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-help items-center gap-1 underline decoration-dotted underline-offset-4",
              className,
            )}
          >
            {children}
            <Info className="size-3.5 opacity-70" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={8}
          className="max-w-80 flex-col items-start gap-2 bg-popover p-3 text-left text-popover-foreground shadow-md"
        >
          <div>
            <p className="font-semibold">정의</p>
            <p className="mt-0.5 leading-relaxed">{content.definition}</p>
          </div>
          <div>
            <p className="font-semibold">계산식</p>
            <p className="mt-0.5 leading-relaxed">{content.formula}</p>
          </div>
          <div>
            <p className="font-semibold">해석</p>
            <p className="mt-0.5 leading-relaxed">{content.interpretation}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
