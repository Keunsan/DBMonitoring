"use client";

/** 시스템·DB별 임계치 정책을 관리하는 클라이언트 컴포넌트입니다. */

import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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

type ThresholdPolicy = {
  id: string;
  scopeType: "GLOBAL" | "BUSINESS_SYSTEM" | "DB_INSTANCE";
  scopeId: string | null;
  metricKey: string;
  warningThreshold: number;
  criticalThreshold: number;
  comparison: "GTE" | "LTE";
  durationSec: number;
  isActive: boolean;
  description: string;
};

type PolicyForm = {
  scopeType: "GLOBAL" | "BUSINESS_SYSTEM" | "DB_INSTANCE";
  scopeId: string;
  metricKey: string;
  warningThreshold: string;
  criticalThreshold: string;
  comparison: "GTE" | "LTE";
  durationSec: string;
  description: string;
};

type ThresholdPolicyManagementClientProps = {
  businessSystems: BusinessSystem[];
  dbInstances: DbInstance[];
  initialPolicies: ThresholdPolicy[];
};

const metricOptions = [
  ["CONNECTION_FAILURE", "연결/수집 실패"],
  ["USER_CONNECTIONS", "사용자 연결 수"],
  ["ACTIVE_SESSIONS", "Active 세션"],
  ["BLOCKING_SECONDS", "Blocking 대기 시간"],
  ["BLOCKED_SESSIONS", "Blocked 세션 수"],
  ["DEADLOCK_COUNT", "Deadlock 건수"],
  ["PAGE_LIFE_EXPECTANCY", "Page Life Expectancy"],
  ["BATCH_REQUESTS_PER_SEC", "Batch Requests/sec"],
  ["SQL_AVG_ELAPSED_MS", "SQL 평균 수행 시간"],
  ["SQL_CPU_MS", "Top SQL CPU 시간"],
  ["COLLECT_DELAY", "수집 지연"],
] as const;

const defaultForm: PolicyForm = {
  scopeType: "GLOBAL",
  scopeId: "",
  metricKey: "USER_CONNECTIONS",
  warningThreshold: "500",
  criticalThreshold: "800",
  comparison: "GTE",
  durationSec: "300",
  description: "사용자 연결 수",
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

/**
 * 임계치 정책 목록과 등록 폼을 렌더링합니다.
 */
export const ThresholdPolicyManagementClient = ({
  businessSystems,
  dbInstances,
  initialPolicies,
}: ThresholdPolicyManagementClientProps) => {
  const [policies, setPolicies] = useState<ThresholdPolicy[]>(initialPolicies);
  const [form, setForm] = useState<PolicyForm>(defaultForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const payload = await requestJson<{ items: ThresholdPolicy[] }>(
      "/api/threshold-policies",
    );
    setPolicies(payload.items);
  };

  const createPolicy = async () => {
    setMessage(null);
    setError(null);

    try {
      await requestJson("/api/threshold-policies", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          scopeId: form.scopeType === "GLOBAL" ? null : form.scopeId,
          warningThreshold: Number(form.warningThreshold),
          criticalThreshold: Number(form.criticalThreshold),
          durationSec: Number(form.durationSec),
          isActive: true,
        }),
      });
      await refresh();
      setMessage("임계치 정책을 등록했습니다.");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "임계치 정책 등록에 실패했습니다.",
      );
    }
  };

  const deletePolicy = async (id: string) => {
    await requestJson(`/api/threshold-policies/${id}`, { method: "DELETE" });
    await refresh();
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PageHeader
        title="임계치 정책 관리"
        description="기본 정책, 업무 시스템별 정책, DB 인스턴스별 정책을 관리합니다."
        actions={<Button onClick={() => void refresh()}>새로고침</Button>}
      />
      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-4 xl:grid-cols-[400px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>정책 등록</CardTitle>
            <CardDescription>
              우선순위는 DB 인스턴스 &gt; 업무 시스템 &gt; 기본 정책입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <SelectLike
              label="적용 범위"
              value={form.scopeType}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  scopeType: value as PolicyForm["scopeType"],
                  scopeId: "",
                }))
              }
              options={[
                ["GLOBAL", "기본 정책"],
                ["BUSINESS_SYSTEM", "업무 시스템별"],
                ["DB_INSTANCE", "DB 인스턴스별"],
              ]}
            />
            {form.scopeType !== "GLOBAL" ? (
              <SelectLike
                label="적용 대상"
                value={form.scopeId}
                onChange={(value) =>
                  setForm((current) => ({ ...current, scopeId: value }))
                }
                options={
                  form.scopeType === "BUSINESS_SYSTEM"
                    ? businessSystems.map((system) => [system.id, system.name])
                    : dbInstances.map((instance) => [instance.id, instance.instanceName])
                }
              />
            ) : null}
            <SelectLike
              label="지표"
              value={form.metricKey}
              onChange={(value) =>
                setForm((current) => ({ ...current, metricKey: value }))
              }
              options={metricOptions.map(([value, label]) => [value, label])}
            />
            <div className="grid grid-cols-2 gap-2.5">
              <InputField
                label="주의 기준"
                value={form.warningThreshold}
                onChange={(value) =>
                  setForm((current) => ({ ...current, warningThreshold: value }))
                }
              />
              <InputField
                label="심각 기준"
                value={form.criticalThreshold}
                onChange={(value) =>
                  setForm((current) => ({ ...current, criticalThreshold: value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <SelectLike
                label="비교"
                value={form.comparison}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    comparison: value as "GTE" | "LTE",
                  }))
                }
                options={[
                  ["GTE", "이상"],
                  ["LTE", "이하"],
                ]}
              />
              <InputField
                label="지속 시간(초)"
                value={form.durationSec}
                onChange={(value) =>
                  setForm((current) => ({ ...current, durationSec: value }))
                }
              />
            </div>
            <InputField
              label="설명"
              value={form.description}
              onChange={(value) =>
                setForm((current) => ({ ...current, description: value }))
              }
            />
            <Button className="w-full" onClick={() => void createPolicy()}>
              정책 등록
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>정책 목록</CardTitle>
            <CardDescription>기본 추천 정책과 추가 등록 정책입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {policies.length === 0 ? (
              <EmptyState title="등록된 임계치 정책이 없습니다" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>범위</TableHead>
                    <TableHead>지표</TableHead>
                    <TableHead>주의/심각</TableHead>
                    <TableHead>지속</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>{policy.scopeType}</TableCell>
                      <TableCell>{policy.description}</TableCell>
                      <TableCell>
                        {policy.warningThreshold} / {policy.criticalThreshold}{" "}
                        {policy.comparison === "GTE" ? "이상" : "이하"}
                      </TableCell>
                      <TableCell>{policy.durationSec}s</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void deletePolicy(policy.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

const InputField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} />
  </div>
);

const SelectLike = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<readonly [string, string]>;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-1">
    <Label>{label}</Label>
    <NativeSelect
      className="w-full"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <NativeSelectOption value="">선택</NativeSelectOption>
      {options.map(([optionValue, optionLabel]) => (
        <NativeSelectOption key={optionValue} value={optionValue}>
          {optionLabel}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  </div>
);
