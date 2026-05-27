"use client";

/** 서버 리소스 지표의 최근 추이를 간단한 라인 차트로 표시합니다. */

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SERVER_METRIC_KEYS } from "@/lib/monitoring/metric-keys";
import type { ApiResponse } from "@/types/api";

type MetricHistoryItem = {
  metricTime: string;
  metricValue: number;
};

type ResourceTrendChartProps = {
  dbInstanceId: string;
  title?: string;
};

const chartConfig = {
  value: {
    label: "값",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const trendMetrics = [
  { key: SERVER_METRIC_KEYS.cpuUsedPercent, label: "CPU %" },
  { key: SERVER_METRIC_KEYS.memoryUsedPercent, label: "메모리 %" },
  { key: SERVER_METRIC_KEYS.batchRequestsPerSec, label: "Batch/sec" },
] as const;

const fetchMetricHistory = async (url: string) => {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiResponse<{ items: MetricHistoryItem[] }>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "지표 이력을 불러오지 못했습니다.");
  }
  return payload.data?.items ?? [];
};

/**
 * 선택 DB의 주요 리소스 지표 추이 차트를 렌더링합니다.
 */
export const ResourceTrendChart = ({
  dbInstanceId,
  title = "리소스 추이",
}: ResourceTrendChartProps) => {
  const [seriesMap, setSeriesMap] = useState<Record<string, MetricHistoryItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const entries = await Promise.all(
          trendMetrics.map(async (metric) => {
            const items = await fetchMetricHistory(
              `/api/monitoring/metrics?dbInstanceId=${encodeURIComponent(dbInstanceId)}&metricName=${encodeURIComponent(metric.key)}&limit=30`,
            );
            return [metric.key, items] as const;
          }),
        );
        if (!cancelled) {
          setSeriesMap(Object.fromEntries(entries));
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "추이 데이터를 불러오지 못했습니다.",
          );
        }
      }
    };

    void load();
    const intervalId = window.setInterval(() => void load(), 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [dbInstanceId]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {trendMetrics.map((metric) => {
        const items = seriesMap[metric.key] ?? [];
        const chartData = items
          .slice()
          .reverse()
          .map((item) => ({
            time: new Date(item.metricTime).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            value: item.metricValue,
          }));

        return (
          <Card key={metric.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{metric.label}</CardTitle>
              <CardDescription>{title}</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">추이 데이터가 없습니다.</p>
              ) : (
                <ChartContainer config={chartConfig} className="h-[180px] w-full">
                  <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} hide />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
