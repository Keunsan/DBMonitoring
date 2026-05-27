/** Phase 3 DB 인스턴스 관리용 개발 메모리 저장소입니다. */

import { ApiRouteError, badRequest, notFound } from "@/lib/api";
import {
  getErpConnectionFailureMessage,
  testErpTestDbConnection,
} from "@/lib/db/erp-test";
import {
  DEFAULT_TENANT_ID,
  type CollectStatus,
  type CollectorType,
  type DbmsType,
  type EnvType,
  type ImportanceLevel,
} from "@/types/domain";
import type { BusinessSystem, DbInstance } from "@/types/entities";

type InventoryState = {
  businessSystems: BusinessSystem[];
  dbInstances: DbInstance[];
};

export type BusinessSystemInput = {
  code: string;
  name: string;
  importance: ImportanceLevel;
  ownerDept?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
};

export type DbInstanceInput = {
  dbmsType: DbmsType;
  instanceName: string;
  host: string;
  port: number;
  serviceName?: string | null;
  databaseName?: string | null;
  businessSystemId: string;
  importance: ImportanceLevel;
  envType: EnvType;
  collectorType: CollectorType;
  collectorId?: string | null;
  collectIntervalSec: number;
  sqlAggregateIntervalSec: number;
  isActive: boolean;
  connectionSecretRef: string;
};

export type CollectionSettingsInput = {
  collectorId?: string | null;
  collectIntervalSec: number;
  sqlAggregateIntervalSec: number;
  isActive: boolean;
};

type GlobalInventoryState = typeof globalThis & {
  __dbMonitoringInventoryState?: InventoryState;
};

const now = () => new Date().toISOString();

const normalizeDbInstance = (instance: DbInstance): DbInstance => ({
  ...instance,
  lastConnectionTestAt: instance.lastConnectionTestAt ?? null,
  lastConnectionTestStatus: instance.lastConnectionTestStatus ?? null,
});

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const createInitialState = (): InventoryState => {
  const createdAt = now();
  const businessSystemId = "bs_erp";

  return {
    businessSystems: [
      {
        id: businessSystemId,
        tenantId: DEFAULT_TENANT_ID,
        code: "ERP",
        name: "ERP 테스트",
        importance: "HIGH",
        ownerDept: "IT 운영팀",
        ownerName: "운영 담당자",
        ownerEmail: "ops@example.com",
        createdAt,
        updatedAt: createdAt,
      },
    ],
    dbInstances: [
      {
        id: "db_erp_test",
        tenantId: DEFAULT_TENANT_ID,
        dbmsType: "MSSQL",
        instanceName: "ERP 테스트 MSSQL",
        host: "ERP_TEST_DB_HOST",
        port: 1433,
        serviceName: null,
        databaseName: "WONIK_TEST",
        businessSystemId,
        importance: "HIGH",
        envType: "DEV",
        collectorType: "AGENTLESS",
        collectorId: "local-dev-collector",
        collectIntervalSec: 30,
        sqlAggregateIntervalSec: 300,
        isActive: true,
        connectionSecretRef: "env:ERP_TEST_DB",
        lastCollectAt: null,
        lastCollectStatus: null,
        lastConnectionTestAt: null,
        lastConnectionTestStatus: null,
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
};

const getState = (): InventoryState => {
  const globalState = globalThis as GlobalInventoryState;

  if (!globalState.__dbMonitoringInventoryState) {
    globalState.__dbMonitoringInventoryState = createInitialState();
  }

  return globalState.__dbMonitoringInventoryState;
};

const normalizeNullable = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const requireString = (payload: Record<string, unknown>, key: string) => {
  const value = payload[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`${key} 값은 필수입니다.`);
  }

  return value.trim();
};

const parseNumber = (
  payload: Record<string, unknown>,
  key: string,
  fallback: number,
) => {
  const value = payload[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : fallback;

  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoolean = (
  payload: Record<string, unknown>,
  key: string,
  fallback: boolean,
) => {
  const value = payload[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "y", "on"].includes(value.toLowerCase());
  }

  return fallback;
};

const assertOneOf = <T extends string>(
  value: string,
  allowed: readonly T[],
  key: string,
): T => {
  if (!allowed.includes(value as T)) {
    throw badRequest(`${key} 값이 허용 범위에 없습니다.`, {
      allowed,
    });
  }

  return value as T;
};

const validateCollectionIntervals = (
  collectIntervalSec: number,
  sqlAggregateIntervalSec: number,
) => {
  if (collectIntervalSec < 5 || collectIntervalSec > 60) {
    throw badRequest("수집 주기는 5~60초 범위여야 합니다.");
  }

  if (sqlAggregateIntervalSec < 60 || sqlAggregateIntervalSec > 300) {
    throw badRequest("SQL 집계 주기는 60~300초 범위여야 합니다.");
  }
};

export const parseBusinessSystemInput = (
  payload: Record<string, unknown>,
): BusinessSystemInput => ({
  code: requireString(payload, "code").toUpperCase(),
  name: requireString(payload, "name"),
  importance: assertOneOf(
    requireString(payload, "importance"),
    ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    "importance",
  ),
  ownerDept: normalizeNullable(payload.ownerDept),
  ownerName: normalizeNullable(payload.ownerName),
  ownerEmail: normalizeNullable(payload.ownerEmail),
});

export const parseDbInstanceInput = (
  payload: Record<string, unknown>,
): DbInstanceInput => {
  const collectIntervalSec = parseNumber(payload, "collectIntervalSec", 30);
  const sqlAggregateIntervalSec = parseNumber(
    payload,
    "sqlAggregateIntervalSec",
    300,
  );

  validateCollectionIntervals(collectIntervalSec, sqlAggregateIntervalSec);

  return {
    dbmsType: assertOneOf(
      requireString(payload, "dbmsType"),
      ["MSSQL", "ORACLE", "AZURE_SQL"],
      "dbmsType",
    ),
    instanceName: requireString(payload, "instanceName"),
    host: requireString(payload, "host"),
    port: parseNumber(payload, "port", 1433),
    serviceName: normalizeNullable(payload.serviceName),
    databaseName: normalizeNullable(payload.databaseName),
    businessSystemId: requireString(payload, "businessSystemId"),
    importance: assertOneOf(
      requireString(payload, "importance"),
      ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      "importance",
    ),
    envType: assertOneOf(
      requireString(payload, "envType"),
      ["PROD", "DEV", "STG", "DR"],
      "envType",
    ),
    collectorType: assertOneOf(
      requireString(payload, "collectorType"),
      ["AGENT", "AGENTLESS", "API"],
      "collectorType",
    ),
    collectorId: normalizeNullable(payload.collectorId),
    collectIntervalSec,
    sqlAggregateIntervalSec,
    isActive: parseBoolean(payload, "isActive", true),
    connectionSecretRef: requireString(payload, "connectionSecretRef"),
  };
};

export const parseCollectionSettingsInput = (
  payload: Record<string, unknown>,
): CollectionSettingsInput => {
  const collectIntervalSec = parseNumber(payload, "collectIntervalSec", 30);
  const sqlAggregateIntervalSec = parseNumber(
    payload,
    "sqlAggregateIntervalSec",
    300,
  );

  validateCollectionIntervals(collectIntervalSec, sqlAggregateIntervalSec);

  return {
    collectorId: normalizeNullable(payload.collectorId),
    collectIntervalSec,
    sqlAggregateIntervalSec,
    isActive: parseBoolean(payload, "isActive", true),
  };
};

export const listBusinessSystems = () => getState().businessSystems;

export const createBusinessSystem = (input: BusinessSystemInput) => {
  const state = getState();

  if (state.businessSystems.some((system) => system.code === input.code)) {
    throw badRequest("이미 등록된 업무 코드입니다.");
  }

  const createdAt = now();
  const businessSystem: BusinessSystem = {
    id: createId(),
    tenantId: DEFAULT_TENANT_ID,
    ...input,
    ownerDept: input.ownerDept ?? null,
    ownerName: input.ownerName ?? null,
    ownerEmail: input.ownerEmail ?? null,
    createdAt,
    updatedAt: createdAt,
  };

  state.businessSystems.push(businessSystem);
  return businessSystem;
};

export const updateBusinessSystem = (
  id: string,
  input: BusinessSystemInput,
) => {
  const state = getState();
  const index = state.businessSystems.findIndex((system) => system.id === id);

  if (index < 0) {
    throw notFound("업무 시스템을 찾을 수 없습니다.");
  }

  state.businessSystems[index] = {
    ...state.businessSystems[index],
    ...input,
    ownerDept: input.ownerDept ?? null,
    ownerName: input.ownerName ?? null,
    ownerEmail: input.ownerEmail ?? null,
    updatedAt: now(),
  };

  return state.businessSystems[index];
};

export const deleteBusinessSystem = (id: string) => {
  const state = getState();

  if (state.dbInstances.some((instance) => instance.businessSystemId === id)) {
    throw new ApiRouteError({
      code: "BUSINESS_SYSTEM_IN_USE",
      message: "DB 인스턴스가 연결된 업무 시스템은 삭제할 수 없습니다.",
      status: 409,
    });
  }

  const nextSystems = state.businessSystems.filter((system) => system.id !== id);

  if (nextSystems.length === state.businessSystems.length) {
    throw notFound("업무 시스템을 찾을 수 없습니다.");
  }

  state.businessSystems = nextSystems;
};

export const listDbInstances = () =>
  getState().dbInstances.map((instance) => normalizeDbInstance(instance));

export const getDbInstance = (id: string) => {
  const instance = getState().dbInstances.find((item) => item.id === id);

  if (!instance) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }

  return normalizeDbInstance(instance);
};

export const createDbInstance = (input: DbInstanceInput) => {
  const state = getState();

  if (!state.businessSystems.some((system) => system.id === input.businessSystemId)) {
    throw badRequest("업무 시스템을 먼저 등록해주세요.");
  }

  const createdAt = now();
  const instance: DbInstance = {
    id: createId(),
    tenantId: DEFAULT_TENANT_ID,
    ...input,
    serviceName: input.serviceName ?? null,
    databaseName: input.databaseName ?? null,
    collectorId: input.collectorId ?? null,
    lastCollectAt: null,
    lastCollectStatus: null,
    lastConnectionTestAt: null,
    lastConnectionTestStatus: null,
    createdAt,
    updatedAt: createdAt,
  };

  state.dbInstances.push(instance);
  return instance;
};

export const updateDbInstance = (id: string, input: DbInstanceInput) => {
  const state = getState();
  const index = state.dbInstances.findIndex((instance) => instance.id === id);

  if (index < 0) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }

  state.dbInstances[index] = {
    ...state.dbInstances[index],
    ...input,
    serviceName: input.serviceName ?? null,
    databaseName: input.databaseName ?? null,
    collectorId: input.collectorId ?? null,
    updatedAt: now(),
  };

  return state.dbInstances[index];
};

export const deleteDbInstance = (id: string) => {
  const state = getState();
  const nextInstances = state.dbInstances.filter((instance) => instance.id !== id);

  if (nextInstances.length === state.dbInstances.length) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }

  state.dbInstances = nextInstances;
};

export const updateCollectionSettings = (
  id: string,
  input: CollectionSettingsInput,
) => {
  const instance = getState().dbInstances.find((item) => item.id === id);

  if (!instance) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }

  Object.assign(instance, {
    collectorId: input.collectorId ?? null,
    collectIntervalSec: input.collectIntervalSec,
    sqlAggregateIntervalSec: input.sqlAggregateIntervalSec,
    isActive: input.isActive,
    updatedAt: now(),
  });

  return instance;
};

export const updateCollectStatus = (id: string, status: CollectStatus) => {
  const instance = getState().dbInstances.find((item) => item.id === id);

  if (!instance) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }

  instance.lastCollectStatus = status;
  instance.lastCollectAt = now();
  instance.updatedAt = now();
  return instance;
};

const updateConnectionTestStatus = (id: string, status: CollectStatus) => {
  const instance = getState().dbInstances.find((item) => item.id === id);

  if (!instance) {
    throw notFound("DB 인스턴스를 찾을 수 없습니다.");
  }
  instance.lastConnectionTestStatus = status;
  instance.lastConnectionTestAt = now();
  instance.updatedAt = now();
  return instance;
};

export const testDbInstanceConnection = async (id: string) => {
  const instance = getDbInstance(id);

  if (instance.dbmsType !== "MSSQL") {
    updateConnectionTestStatus(id, "FAIL");
    throw new ApiRouteError({
      code: "DB_CONNECTION_TEST_UNSUPPORTED",
      message: "현재 연결 테스트는 MSSQL 인스턴스만 지원합니다.",
      status: 400,
    });
  }

  if (instance.connectionSecretRef !== "env:ERP_TEST_DB") {
    updateConnectionTestStatus(id, "FAIL");
    throw new ApiRouteError({
      code: "DB_CONNECTION_SECRET_UNSUPPORTED",
      message:
        "개발 단계에서는 env:ERP_TEST_DB secret ref를 사용하는 MSSQL 연결만 테스트할 수 있습니다.",
      status: 400,
    });
  }

  try {
    const result = await testErpTestDbConnection();
    updateConnectionTestStatus(id, "OK");

    return {
      status: "connected",
      target: result.target,
      info: result.info,
      checkedAt: now(),
    };
  } catch (error) {
    updateConnectionTestStatus(id, "FAIL");
    throw new ApiRouteError({
      code: "DB_CONNECTION_TEST_FAILED",
      message: getErpConnectionFailureMessage(error),
      status: 502,
      cause: error,
    });
  }
};
