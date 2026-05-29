"use client";

/** SQL 성능 회귀 탐지 및 개선 권고 화면 클라이언트 컴포넌트입니다. */

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
import type { ApiResponse } from "@/types/api";
import type { DbInstance } from "@/types/entities";

type RegressionEvent = {
  id: string;
  sqlId: string;
  metricKey: string;
  baselineValue: number;
  currentValue: number;
  changePercent: number;
  severity: "WARNING" | "CRITICAL";
  recommendation: string;
  detectedAt: string;
  status: string;
  issueCandidate: Record<string, unknown>;
};

type RegressionInsightClientProps = {
  dbInstances: DbInstance[];
  initialDbInstanceId?: string;
};

const requestJson = async <T,>(url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  return payload.data as T;
};

const formatNumber = (value: number) =>
  Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(value);

/**
 * 회귀 후보와 issue candidate 정보를 표시합니다.
 */
export const RegressionInsightClient = ({
  dbInstances,
  initialDbInstanceId,
}: RegressionInsightClientProps) => {
  const [dbInstanceId, setDbInstanceId] = useState(
    initialDbInstanceId ?? dbInstances[0]?.id ?? "",
  );
  const [items, setItems] = useState<RegressionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
      const payload = await requestJson<{ items: RegressionEvent[] }>(
        `/api/analysis/regressions?dbInstanceId=${encodeURIComponent(dbInstanceId)}`,
      );
      setItems(payload.items);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "회귀 이벤트를 불러오지 못했습니다.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [dbInstanceId]);

  const runDetection = async () => {
    if (!dbInstanceId) {
      return;
    }

    setDetecting(true);
    setMessage(null);
    setError(null);

    try {
      const payload = await requestJson<{ detectedCount: number }>(
        "/api/analysis/regressions/detect",
        {
          method: "POST",
          body: JSON.stringify({ dbInstanceId }),
        },
      );
      setMessage(`회귀 탐지를 완료했습니다. 신규 ${payload.detectedCount}건을 저장했습니다.`);
      await refresh();
    } catch (detectError) {
      setError(
        detectError instanceof Error
          ? detectError.message
          : "회귀 탐지 실행 중 오류가 발생했습니다.",
      );
    } finally {
      setDetecting(false);
    }
  };

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
        const payload = await requestJson<{ items: RegressionEvent[] }>(
          `/api/analysis/regressions?dbInstanceId=${encodeURIComponent(dbInstanceId)}`,
        );

        if (!cancelled) {
          setItems(payload.items);
        }
      } catch (refreshError) {
        if (!cancelled) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : "회귀 이벤트를 불러오지 못했습니다.",
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
        title="성능 회귀 탐지"
        description="baseline 대비 악화된 SQL을 탐지하고 개선 권고를 제공합니다."
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
            <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
              새로고침
            </Button>
            <Button onClick={() => void runDetection()} disabled={detecting}>
              {detecting ? "탐지 중..." : "회귀 탐지 실행"}
            </Button>
          </div>
        }
      />

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>회귀 후보</CardTitle>
          <CardDescription>
            T-041 이슈 관리 연동 전까지는 issue candidate로만 노출됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">불러오는 중입니다...</p>
          ) : items.length === 0 ? (
            <EmptyState title="저장된 회귀 이벤트가 없습니다" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>탐지 시각</TableHead>
                  <TableHead>SQL ID</TableHead>
                  <TableHead>지표</TableHead>
                  <TableHead>변화율</TableHead>
                  <TableHead>심각도</TableHead>
                  <TableHead>권고</TableHead>
                  <TableHead>이슈 후보</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.detectedAt}</TableCell>
                    <TableCell>
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={`/analysis/sql/${encodeURIComponent(item.sqlId)}?dbInstanceId=${encodeURIComponent(dbInstanceId)}`}
                      >
                        {item.sqlId}
                      </Link>
                    </TableCell>
                    <TableCell>{item.metricKey}</TableCell>
                    <TableCell>
                      {formatNumber(item.changePercent)}% ({formatNumber(item.baselineValue)} →{" "}
                      {formatNumber(item.currentValue)})
                    </TableCell>
                    <TableCell>{item.severity}</TableCell>
                    <TableCell className="max-w-md text-sm">{item.recommendation}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {String(item.issueCandidate?.title ?? "-")}
                    </TableCell>
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
