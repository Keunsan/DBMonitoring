"use client";

/** 실행 계획 변경 분석 화면 클라이언트 컴포넌트입니다. */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlanChangeInsight } from "@/lib/analysis/plan-changes";
import type { ApiResponse } from "@/types/api";
import type { DbInstance } from "@/types/entities";

type PlanChangeClientProps = {
  dbInstances: DbInstance[];
  initialDbInstanceId?: string;
};

const requestJson = async <T,>(url: string) => {
  const response = await fetch(url);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return payload.data as T;
};

const formatNumber = (value: number | null) =>
  value === null ? "-" : Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);

/**
 * plan hash 변경 전후 성능 비교 결과를 표시합니다.
 */
export const PlanChangeClient = ({
  dbInstances,
  initialDbInstanceId,
}: PlanChangeClientProps) => {
  const [dbInstanceId, setDbInstanceId] = useState(
    initialDbInstanceId ?? dbInstances[0]?.id ?? "",
  );
  const [items, setItems] = useState<PlanChangeInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!dbInstanceId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await requestJson<{ items: PlanChangeInsight[] }>(
        `/api/analysis/plan-changes?dbInstanceId=${encodeURIComponent(dbInstanceId)}`,
      );
      setItems(payload.items);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "실행 계획 변경 분석 데이터를 불러오지 못했습니다.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [dbInstanceId]);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      if (!dbInstanceId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload = await requestJson<{ items: PlanChangeInsight[] }>(
          `/api/analysis/plan-changes?dbInstanceId=${encodeURIComponent(dbInstanceId)}`,
        );

        if (!cancelled) {
          setItems(payload.items);
        }
      } catch (refreshError) {
        if (!cancelled) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : "실행 계획 변경 분석 데이터를 불러오지 못했습니다.",
          );
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [dbInstanceId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="실행 계획 변경 분석"
        description="plan hash 변경 전후 평균 수행 시간과 CPU 사용량을 비교합니다."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              value={dbInstanceId}
              onChange={(event) => setDbInstanceId(event.target.value)}
            >
              {dbInstances.map((instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.instanceName}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={() => void refresh()}>
              새로고침
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Plan 변경 인사이트</CardTitle>
          <CardDescription>악화 plan은 상단에 우선 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">불러오는 중입니다...</p>
          ) : items.length === 0 ? (
            <EmptyState title="분석할 plan 변경 데이터가 없습니다" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SQL ID</TableHead>
                  <TableHead>이전 plan</TableHead>
                  <TableHead>현재 plan</TableHead>
                  <TableHead>Elapsed 변화</TableHead>
                  <TableHead>CPU 변화</TableHead>
                  <TableHead>악화</TableHead>
                  <TableHead>권고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={`${item.sqlId}_${item.currentPlanHash}`}>
                    <TableCell>
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={`/analysis/sql/${encodeURIComponent(item.sqlId)}?dbInstanceId=${encodeURIComponent(dbInstanceId)}`}
                      >
                        {item.sqlId}
                      </Link>
                    </TableCell>
                    <TableCell>{item.previousPlanHash ?? "-"}</TableCell>
                    <TableCell>{item.currentPlanHash}</TableCell>
                    <TableCell>{formatNumber(item.elapsedChangePercent)}%</TableCell>
                    <TableCell>{formatNumber(item.cpuChangePercent)}%</TableCell>
                    <TableCell>{item.isDegraded ? "예" : "아니오"}</TableCell>
                    <TableCell className="max-w-md text-sm">{item.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
