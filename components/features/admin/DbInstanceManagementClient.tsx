"use client";

/** DB 인스턴스 관리 화면의 등록·조회·연결 테스트 클라이언트 컴포넌트입니다. */

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/layout";
import { EmptyState, ErrorState, LoadingSkeleton, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiResponse } from "@/types/api";
import type { BusinessSystem, DbInstance } from "@/types/entities";

type InventoryPayload = {
  items: DbInstance[];
  businessSystems: BusinessSystem[];
};

type BusinessSystemForm = {
  code: string;
  name: string;
  importance: string;
  ownerDept: string;
  ownerName: string;
  ownerEmail: string;
};

type DbInstanceForm = {
  dbmsType: string;
  instanceName: string;
  host: string;
  port: string;
  databaseName: string;
  businessSystemId: string;
  importance: string;
  envType: string;
  collectorType: string;
  collectorId: string;
  collectIntervalSec: string;
  sqlAggregateIntervalSec: string;
  isActive: boolean;
  connectionSecretRef: string;
};

type DbInstanceManagementClientProps = {
  initialBusinessSystems: BusinessSystem[];
  initialDbInstances: DbInstance[];
};

const defaultBusinessSystemForm: BusinessSystemForm = {
  code: "",
  name: "",
  importance: "MEDIUM",
  ownerDept: "",
  ownerName: "",
  ownerEmail: "",
};

const defaultDbInstanceForm: DbInstanceForm = {
  dbmsType: "MSSQL",
  instanceName: "",
  host: "",
  port: "1433",
  databaseName: "",
  businessSystemId: "",
  importance: "MEDIUM",
  envType: "DEV",
  collectorType: "AGENTLESS",
  collectorId: "local-dev-collector",
  collectIntervalSec: "30",
  sqlAggregateIntervalSec: "300",
  isActive: true,
  connectionSecretRef: "env:ERP_TEST_DB",
};

const toErrorMessage = async (response: Response) => {
  const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
  return payload?.error?.message ?? "요청 처리 중 오류가 발생했습니다.";
};

const requestJson = async <T,>(url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(await toErrorMessage(response));
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (payload.error) {
    throw new Error(payload.error.message);
  }

  return payload.data as T;
};

const SelectField = ({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) => {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * 업무 시스템과 DB 인스턴스 등록, 수집 설정, 연결 테스트를 제공합니다.
 */
export const DbInstanceManagementClient = ({
  initialBusinessSystems,
  initialDbInstances,
}: DbInstanceManagementClientProps) => {
  const [businessSystems, setBusinessSystems] = useState<BusinessSystem[]>(
    initialBusinessSystems,
  );
  const [dbInstances, setDbInstances] = useState<DbInstance[]>(initialDbInstances);
  const [businessForm, setBusinessForm] = useState(defaultBusinessSystemForm);
  const [dbForm, setDbForm] = useState(defaultDbInstanceForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const businessSystemOptions = useMemo(
    () =>
      businessSystems.map((system) => ({
        label: `${system.name} (${system.code})`,
        value: system.id,
      })),
    [businessSystems],
  );

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = await requestJson<InventoryPayload>("/api/db-instances");
      setBusinessSystems(payload.businessSystems);
      setDbInstances(payload.items);
      setDbForm((current) => ({
        ...current,
        businessSystemId: current.businessSystemId || payload.businessSystems[0]?.id || "",
      }));
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "DB 인스턴스 목록을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitBusinessSystem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await requestJson<BusinessSystem>("/api/business-systems", {
        method: "POST",
        body: JSON.stringify(businessForm),
      });
      setBusinessForm(defaultBusinessSystemForm);
      setMessage("업무 시스템을 등록했습니다.");
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "업무 시스템 등록에 실패했습니다.",
      );
    }
  };

  const submitDbInstance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      await requestJson<DbInstance>("/api/db-instances", {
        method: "POST",
        body: JSON.stringify({
          ...dbForm,
          port: Number(dbForm.port),
          collectIntervalSec: Number(dbForm.collectIntervalSec),
          sqlAggregateIntervalSec: Number(dbForm.sqlAggregateIntervalSec),
        }),
      });
      setDbForm((current) => ({
        ...defaultDbInstanceForm,
        businessSystemId: current.businessSystemId,
      }));
      setMessage("DB 인스턴스를 등록했습니다.");
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "DB 인스턴스 등록에 실패했습니다.",
      );
    }
  };

  const updateCollectionSettings = async (instance: DbInstance) => {
    setMessage(null);
    setError(null);

    try {
      await requestJson<DbInstance>(
        `/api/db-instances/${instance.id}/collection-settings`,
        {
          method: "PATCH",
          body: JSON.stringify({
            collectorId: instance.collectorId,
            collectIntervalSec: instance.collectIntervalSec,
            sqlAggregateIntervalSec: instance.sqlAggregateIntervalSec,
            isActive: !instance.isActive,
          }),
        },
      );
      setMessage("수집 활성화 상태를 변경했습니다.");
      await refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "수집 설정 변경에 실패했습니다.",
      );
    }
  };

  const testConnection = async (instanceId: string) => {
    setTestingId(instanceId);
    setMessage(null);
    setError(null);

    try {
      await requestJson(`/api/db-instances/${instanceId}/test-connection`, {
        method: "POST",
      });
      setMessage("DB 연결 테스트에 성공했습니다.");
      await refresh();
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "DB 연결 테스트에 실패했습니다.",
      );
      await refresh();
    } finally {
      setTestingId(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="DB 인스턴스 관리"
        description="업무 시스템, DB 인스턴스, 수집 설정과 연결 테스트를 관리합니다."
        actions={<Button onClick={() => void refresh()}>새로고침</Button>}
      />
      <div className="space-y-4 p-6">
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        {error ? (
          <ErrorState
            title="요청 처리 실패"
            description={error}
            onRetry={() => void refresh()}
          />
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>업무 시스템 등록</CardTitle>
              <CardDescription>
                DB 인스턴스를 업무 시스템과 담당자 기준으로 묶습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitBusinessSystem}>
                <div className="space-y-1.5">
                  <Label htmlFor="business-code">업무 코드</Label>
                  <Input
                    id="business-code"
                    value={businessForm.code}
                    onChange={(event) =>
                      setBusinessForm((current) => ({
                        ...current,
                        code: event.target.value,
                      }))
                    }
                    placeholder="ERP"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="business-name">업무명</Label>
                  <Input
                    id="business-name"
                    value={businessForm.name}
                    onChange={(event) =>
                      setBusinessForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="ERP 테스트"
                  />
                </div>
                <SelectField
                  id="business-importance"
                  label="중요도"
                  value={businessForm.importance}
                  onChange={(importance) =>
                    setBusinessForm((current) => ({ ...current, importance }))
                  }
                  options={[
                    { label: "낮음", value: "LOW" },
                    { label: "보통", value: "MEDIUM" },
                    { label: "높음", value: "HIGH" },
                    { label: "중요", value: "CRITICAL" },
                  ]}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="owner-dept">담당 부서</Label>
                  <Input
                    id="owner-dept"
                    value={businessForm.ownerDept}
                    onChange={(event) =>
                      setBusinessForm((current) => ({
                        ...current,
                        ownerDept: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-name">담당자</Label>
                  <Input
                    id="owner-name"
                    value={businessForm.ownerName}
                    onChange={(event) =>
                      setBusinessForm((current) => ({
                        ...current,
                        ownerName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="owner-email">담당자 이메일</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={businessForm.ownerEmail}
                    onChange={(event) =>
                      setBusinessForm((current) => ({
                        ...current,
                        ownerEmail: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit">업무 시스템 등록</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>DB 인스턴스 등록</CardTitle>
              <CardDescription>
                접속 정보는 secret ref만 저장하고 실제 비밀번호는 저장하지 않습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-2" onSubmit={submitDbInstance}>
                <SelectField
                  id="db-business-system"
                  label="업무 시스템"
                  value={dbForm.businessSystemId}
                  onChange={(businessSystemId) =>
                    setDbForm((current) => ({ ...current, businessSystemId }))
                  }
                  options={businessSystemOptions}
                />
                <SelectField
                  id="db-dbms"
                  label="DBMS"
                  value={dbForm.dbmsType}
                  onChange={(dbmsType) => setDbForm((current) => ({ ...current, dbmsType }))}
                  options={[
                    { label: "MSSQL", value: "MSSQL" },
                    { label: "Oracle", value: "ORACLE" },
                    { label: "Azure SQL", value: "AZURE_SQL" },
                  ]}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="instance-name">인스턴스명</Label>
                  <Input
                    id="instance-name"
                    value={dbForm.instanceName}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        instanceName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="db-host">Host</Label>
                  <Input
                    id="db-host"
                    value={dbForm.host}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        host: event.target.value,
                      }))
                    }
                    placeholder="ERP_TEST_DB_HOST"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="db-port">Port</Label>
                  <Input
                    id="db-port"
                    type="number"
                    value={dbForm.port}
                    onChange={(event) =>
                      setDbForm((current) => ({ ...current, port: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="db-name">Database</Label>
                  <Input
                    id="db-name"
                    value={dbForm.databaseName}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        databaseName: event.target.value,
                      }))
                    }
                  />
                </div>
                <SelectField
                  id="db-env"
                  label="환경"
                  value={dbForm.envType}
                  onChange={(envType) => setDbForm((current) => ({ ...current, envType }))}
                  options={[
                    { label: "운영", value: "PROD" },
                    { label: "개발", value: "DEV" },
                    { label: "스테이징", value: "STG" },
                    { label: "DR", value: "DR" },
                  ]}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="secret-ref">Secret Ref</Label>
                  <Input
                    id="secret-ref"
                    value={dbForm.connectionSecretRef}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        connectionSecretRef: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="collector-id">Collector ID</Label>
                  <Input
                    id="collector-id"
                    value={dbForm.collectorId}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        collectorId: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="collect-interval">수집 주기(초)</Label>
                  <Input
                    id="collect-interval"
                    type="number"
                    min={5}
                    max={60}
                    value={dbForm.collectIntervalSec}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        collectIntervalSec: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sql-interval">SQL 집계 주기(초)</Label>
                  <Input
                    id="sql-interval"
                    type="number"
                    min={60}
                    max={300}
                    value={dbForm.sqlAggregateIntervalSec}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        sqlAggregateIntervalSec: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="is-active"
                    type="checkbox"
                    checked={dbForm.isActive}
                    onChange={(event) =>
                      setDbForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  <Label htmlFor="is-active">수집 활성화</Label>
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={!dbForm.businessSystemId}>
                    DB 인스턴스 등록
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>DB 인스턴스 목록</CardTitle>
            <CardDescription>
              등록된 인스턴스의 연결 상태와 수집 설정을 확인합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton rows={5} />
            ) : dbInstances.length === 0 ? (
              <EmptyState
                title="등록된 DB 인스턴스가 없습니다"
                description="업무 시스템 등록 후 DB 인스턴스를 추가해주세요."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>인스턴스</TableHead>
                    <TableHead>DBMS</TableHead>
                    <TableHead>업무 시스템</TableHead>
                    <TableHead>수집</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dbInstances.map((instance) => {
                    const system = businessSystems.find(
                      (item) => item.id === instance.businessSystemId,
                    );

                    return (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <div className="font-medium">{instance.instanceName}</div>
                          <div className="text-muted-foreground text-xs">
                            {instance.host}:{instance.port} /{" "}
                            {instance.databaseName ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell>{instance.dbmsType}</TableCell>
                        <TableCell>{system?.name ?? "-"}</TableCell>
                        <TableCell>
                          <div>{instance.collectIntervalSec}s</div>
                          <div className="text-muted-foreground text-xs">
                            SQL {instance.sqlAggregateIntervalSec}s /{" "}
                            {instance.collectorId ?? "미할당"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {instance.lastConnectionTestStatus ? (
                            <StatusBadge
                              kind="connection"
                              value={instance.lastConnectionTestStatus}
                            />
                          ) : instance.lastCollectStatus ? (
                            <StatusBadge
                              kind="collect"
                              value={instance.lastCollectStatus}
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">미확인</span>
                          )}
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void updateCollectionSettings(instance)}
                          >
                            {instance.isActive ? "수집 중지" : "수집 활성화"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void testConnection(instance.id)}
                            disabled={testingId === instance.id}
                          >
                            {testingId === instance.id ? "확인 중" : "연결 테스트"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
