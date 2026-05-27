"use client";

/** 실시간 모니터링 화면에서 Collector 실행과 polling 조회를 제공하는 클라이언트 컴포넌트입니다. */

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { PageHeader } from "@/components/layout";
import { EmptyState, StatusBadge } from "@/components/shared";
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
import type { AlertEvent, DbInstance } from "@/types/entities";

type MetricItem = {
  metricName: string;
  metricValue: number;
  unit: string | null;
  metricTime: string;
};

type SessionItem = {
  sessionId: string;
  loginName: string;
  status: string;
  waitType: string | null;
  waitMs: number | null;
  sqlId: string | null;
  hostName: string | null;
  programName: string | null;
};

type SqlItem = {
  sqlId: string;
  sqlTextMasked: string;
  executions: number;
  avgElapsedMs: number;
  totalCpuMs: number;
};

type BlockingItem = {
  blockerSessionId: string;
  blockedSessionId: string;
  lockType: string;
  waitMs: number;
  objectName: string | null;
};

type SummaryItem = {
  instance: DbInstance;
  summary: {
    dbInstanceId: string;
    lastRun: {
      status: "OK" | "FAIL" | "DELAYED";
      finishedAt: string;
      errorMessage: string | null;
    } | null;
    latestMetrics: MetricItem[];
    latestSessions: SessionItem[];
    latestSql: SqlItem[];
    blockingCount: number;
    deadlockCount: number;
  };
};

type MonitoringRealtimeClientProps = {
  title: string;
  description: string;
  variant: "dashboard" | "realtime" | "sessions" | "blocking" | "deadlocks" | "waits" | "top-sql" | "alerts";
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

const getMetric = (item: SummaryItem, name: string) =>
  item.summary.latestMetrics.find((metric) => metric.metricName === name)?.metricValue ?? 0;

/**
 * 최신 수집 요약과 알림을 주기적으로 조회합니다.
 */
export const MonitoringRealtimeClient = ({
  title,
  description,
  variant,
}: MonitoringRealtimeClientProps) => {
  const [items, setItems] = useState<SummaryItem[]>([]);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const selected = items[0] ?? null;

  const refresh = async () => {
    const [summaryPayload, alertPayload] = await Promise.all([
      requestJson<{ items: SummaryItem[] }>("/api/monitoring/summary"),
      requestJson<{ items: AlertEvent[] }>("/api/alerts"),
    ]);

    setItems(summaryPayload.items);
    setAlerts(alertPayload.items);
  };

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      try {
        await refresh();
        if (!cancelled) {
          setError(null);
        }
      } catch (refreshError) {
        if (!cancelled) {
          setError(
            refreshError instanceof Error
              ? refreshError.message
              : "실시간 데이터를 조회하지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void tick();
    const intervalId = window.setInterval(() => void tick(), 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const runCollector = async () => {
    setRunning(true);
    setMessage(null);
    setError(null);

    try {
      await requestJson("/api/collector/run", {
        method: "POST",
        body: JSON.stringify({}),
      });
      await requestJson("/api/alerts/evaluate", { method: "POST" });
      await refresh();
      setMessage("Collector 실행과 임계치 평가가 완료되었습니다.");
    } catch (runError) {
      setError(
        runError instanceof Error ? runError.message : "Collector 실행에 실패했습니다.",
      );
    } finally {
      setRunning(false);
    }
  };

  const dashboardStats = useMemo(() => {
    const ok = items.filter((item) => item.summary.lastRun?.status === "OK").length;
    const fail = items.filter((item) => item.summary.lastRun?.status === "FAIL").length;

    return {
      total: items.length,
      ok,
      fail,
      alerts: alerts.filter((alert) => alert.status === "NEW").length,
    };
  }, [alerts, items]);

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={() => void runCollector()} disabled={running}>
            {running ? "수집 중" : "실시간 수집 실행"}
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {loading ? (
          <EmptyState title="실시간 데이터를 불러오는 중입니다" />
        ) : items.length === 0 ? (
          <EmptyState
            title="등록된 DB 인스턴스가 없습니다"
            description="시스템 관리에서 DB 인스턴스를 등록한 뒤 수집을 실행해주세요."
          />
        ) : (
          <>
            {variant === "dashboard" ? (
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="전체 DB" value={dashboardStats.total} />
                <StatCard title="수집 정상" value={dashboardStats.ok} />
                <StatCard title="수집 실패" value={dashboardStats.fail} />
                <StatCard title="미확인 알림" value={dashboardStats.alerts} />
              </div>
            ) : null}
            {variant === "alerts" ? (
              <AlertsTable alerts={alerts} />
            ) : variant === "sessions" ? (
              <SessionsTable sessions={selected?.summary.latestSessions ?? []} />
            ) : variant === "blocking" ? (
              <BlockingTable items={[]} count={selected?.summary.blockingCount ?? 0} />
            ) : variant === "deadlocks" ? (
              <DeadlockCard count={selected?.summary.deadlockCount ?? 0} />
            ) : variant === "top-sql" ? (
              <SqlTable sql={selected?.summary.latestSql ?? []} />
            ) : (
              <RealtimeCards items={items} />
            )}
          </>
        )}
      </div>
    </main>
  );
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-3xl">{formatNumber(value)}</CardTitle>
    </CardHeader>
  </Card>
);

const RealtimeCards = ({ items }: { items: SummaryItem[] }) => (
  <div className="grid gap-4 xl:grid-cols-2">
    {items.map((item) => (
      <Card key={item.instance.id}>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{item.instance.instanceName}</CardTitle>
              <CardDescription>
                {item.instance.dbmsType} / {item.instance.databaseName ?? "-"}
              </CardDescription>
            </div>
            {item.summary.lastRun ? (
              <StatusBadge kind="collect" value={item.summary.lastRun.status} />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <MetricBox
            label="User Connections"
            value={getMetric(item, "User Connections")}
          />
          <MetricBox
            label="Batch Requests/sec"
            value={getMetric(item, "Batch Requests/sec")}
          />
          <MetricBox
            label="PLE"
            value={getMetric(item, "Page life expectancy")}
          />
        </CardContent>
      </Card>
    ))}
  </div>
);

const MetricBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border bg-muted/30 p-3">
    <div className="text-muted-foreground text-xs">{label}</div>
    <div className="mt-1 text-lg font-semibold">{formatNumber(value)}</div>
  </div>
);

const SessionsTable = ({ sessions }: { sessions: SessionItem[] }) => (
  <DataTable title="실시간 세션" empty="수집된 세션이 없습니다.">
    {sessions.map((session) => (
      <TableRow key={`${session.sessionId}-${session.sqlId}`}>
        <TableCell>{session.sessionId}</TableCell>
        <TableCell>{session.loginName}</TableCell>
        <TableCell>{session.status}</TableCell>
        <TableCell>{session.waitType ?? "-"}</TableCell>
        <TableCell>{session.waitMs ?? 0}</TableCell>
        <TableCell className="max-w-48 truncate">{session.programName ?? "-"}</TableCell>
      </TableRow>
    ))}
  </DataTable>
);

const SqlTable = ({ sql }: { sql: SqlItem[] }) => (
  <DataTable title="Top SQL" empty="수집된 SQL 성능 데이터가 없습니다.">
    {sql.map((item) => (
      <TableRow key={item.sqlId}>
        <TableCell className="max-w-48 truncate">{item.sqlId}</TableCell>
        <TableCell>{formatNumber(item.executions)}</TableCell>
        <TableCell>{formatNumber(item.avgElapsedMs)}ms</TableCell>
        <TableCell>{formatNumber(item.totalCpuMs)}ms</TableCell>
        <TableCell className="max-w-xl truncate">{item.sqlTextMasked}</TableCell>
      </TableRow>
    ))}
  </DataTable>
);

const BlockingTable = ({
  items,
  count,
}: {
  items: BlockingItem[];
  count: number;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Blocking 현황</CardTitle>
      <CardDescription>현재 수집된 Blocking 건수: {count}건</CardDescription>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <EmptyState title="현재 Blocking 데이터가 없습니다" />
      ) : null}
    </CardContent>
  </Card>
);

const DeadlockCard = ({ count }: { count: number }) => (
  <Card>
    <CardHeader>
      <CardTitle>Deadlock 현황</CardTitle>
      <CardDescription>최근 수집된 Deadlock 이벤트 수입니다.</CardDescription>
    </CardHeader>
    <CardContent className="text-3xl font-semibold">{count}건</CardContent>
  </Card>
);

const AlertsTable = ({ alerts }: { alerts: AlertEvent[] }) => (
  <DataTable title="실시간 알림" empty="생성된 알림이 없습니다.">
    {alerts.map((alert) => (
      <TableRow key={alert.id}>
        <TableCell>{alert.severity}</TableCell>
        <TableCell>{alert.category}</TableCell>
        <TableCell>{alert.title}</TableCell>
        <TableCell className="max-w-xl truncate">{alert.message}</TableCell>
        <TableCell>{alert.status}</TableCell>
      </TableRow>
    ))}
  </DataTable>
);

const DataTable = ({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>구분</TableHead>
            <TableHead>값 1</TableHead>
            <TableHead>값 2</TableHead>
            <TableHead>값 3</TableHead>
            <TableHead>상세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
      </Table>
      {children ? null : <EmptyState title={empty} />}
    </CardContent>
  </Card>
);
