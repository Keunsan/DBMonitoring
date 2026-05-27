"use client";

/** 실시간 모니터링 화면에서 Collector 실행과 polling 조회를 제공하는 클라이언트 컴포넌트입니다. */

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { DbResourceCard } from "@/components/features/monitoring/DbResourceCard";
import { ResourceMetricGrid } from "@/components/features/monitoring/ResourceMetricGrid";
import { ResourceOverviewCards } from "@/components/features/monitoring/ResourceOverviewCards";
import { ResourceTopLists } from "@/components/features/monitoring/ResourceTopLists";
import { ResourceTrendChart } from "@/components/features/monitoring/ResourceTrendChart";
import { PageHeader } from "@/components/layout";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResourceSummary } from "@/lib/monitoring/resource-summary";
import type { ApiResponse } from "@/types/api";
import type { AlertEvent, DbInstance } from "@/types/entities";

type MetricItem = {
  id: string;
  metricName: string;
  metricValue: number;
  unit: string | null;
  metricTime: string;
  tags?: Record<string, string>;
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
    resourceSummary: ResourceSummary;
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
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const activeInstanceId = selectedId ?? items[0]?.instance.id;

  const selected = useMemo(() => {
    if (items.length === 0 || !activeInstanceId) {
      return null;
    }
    return items.find((item) => item.instance.id === activeInstanceId) ?? items[0];
  }, [activeInstanceId, items]);

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
              <DashboardResourceView items={items} dashboardStats={dashboardStats} />
            ) : null}
            {variant === "realtime" && selected && activeInstanceId ? (
              <RealtimeResourceView
                item={selected}
                items={items}
                selectedId={activeInstanceId}
                onSelectId={setSelectedId}
              />
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
            ) : null}
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

const DashboardResourceView = ({
  items,
  dashboardStats,
}: {
  items: SummaryItem[];
  dashboardStats: { total: number; ok: number; fail: number; alerts: number };
}) => {
  const resourceItems = items.map((item) => ({
    instance: item.instance,
    resourceSummary: item.summary.resourceSummary,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="전체 DB" value={dashboardStats.total} />
        <StatCard title="수집 정상" value={dashboardStats.ok} />
        <StatCard title="수집 실패" value={dashboardStats.fail} />
        <StatCard title="미확인 알림" value={dashboardStats.alerts} />
      </div>
      <ResourceTopLists items={resourceItems} />
      <section className="space-y-3">
        <h3 className="text-sm font-medium">DB별 서버 리소스 현황</h3>
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <DbResourceCard
              key={item.instance.id}
              instance={item.instance}
              resourceSummary={item.summary.resourceSummary}
              collectStatus={item.summary.lastRun?.status ?? null}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

const RealtimeResourceView = ({
  item,
  items,
  selectedId,
  onSelectId,
}: {
  item: SummaryItem;
  items: SummaryItem[];
  selectedId: string;
  onSelectId: (id: string) => void;
}) => (
  <div className="space-y-6">
    {items.length > 1 ? (
      <div className="max-w-sm">
        <Select value={selectedId} onValueChange={onSelectId}>
          <SelectTrigger>
            <SelectValue placeholder="DB 인스턴스 선택" />
          </SelectTrigger>
          <SelectContent>
            {items.map((entry) => (
              <SelectItem key={entry.instance.id} value={entry.instance.id}>
                {entry.instance.instanceName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null}
    <ResourceOverviewCards
      title={`${item.instance.instanceName} 서버 상태`}
      resource={item.summary.resourceSummary}
    />
    <ResourceTrendChart dbInstanceId={item.instance.id} />
    <Card>
      <CardHeader>
        <CardTitle>세부 리소스 지표</CardTitle>
        <CardDescription>
          최근 수집 시각:{" "}
          {item.summary.latestMetrics[0]?.metricTime
            ? new Date(item.summary.latestMetrics[0].metricTime).toLocaleString("ko-KR")
            : "-"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResourceMetricGrid
          metrics={item.summary.latestMetrics.map((metric) => ({
            id: metric.id,
            tenantId: item.instance.tenantId,
            dbInstanceId: item.instance.id,
            metricTime: metric.metricTime,
            metricName: metric.metricName,
            metricValue: metric.metricValue,
            unit: metric.unit,
            tags: metric.tags ?? {},
          }))}
          resource={item.summary.resourceSummary}
        />
      </CardContent>
    </Card>
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
