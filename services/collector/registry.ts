/** DBMS 유형에 맞는 Collector 어댑터를 선택하는 registry입니다. */

import { createAzureSqlCollectorAdapter } from "@/services/collector/adapters/azure-sql";
import { createMssqlCollectorAdapter } from "@/services/collector/adapters/mssql";
import { createOracleCollectorAdapter } from "@/services/collector/adapters/oracle";
import type {
  CollectorAdapterFactory,
  CollectorContext,
} from "@/services/collector/types";
import type { DbmsType } from "@/types/domain";

const adapterFactories: Record<DbmsType, CollectorAdapterFactory> = {
  MSSQL: createMssqlCollectorAdapter,
  ORACLE: createOracleCollectorAdapter,
  AZURE_SQL: createAzureSqlCollectorAdapter,
};

/**
 * 등록된 DBMS Collector 어댑터 팩토리 목록을 반환합니다.
 */
export const listCollectorAdapterTypes = () => Object.keys(adapterFactories) as DbmsType[];

/**
 * 수집 컨텍스트에 맞는 Collector 어댑터를 생성합니다.
 */
export const createCollectorAdapter = (context: CollectorContext) =>
  adapterFactories[context.dbmsType](context);
