/** MSSQL/Azure SQL ConnectionPool 헬퍼입니다. */

import sql from "mssql";

import { buildMssqlPoolConfig } from "@/lib/db/connection-config";
import { resolveConnectionSecret } from "@/lib/secrets/resolver";
import type { CollectorContext } from "@/services/collector/types";

/**
 * 인스턴스 context와 secret ref로 MSSQL 연결을 열고 작업을 수행합니다.
 */
export const withMssqlConnection = async <T>(
  context: CollectorContext,
  work: (connection: sql.ConnectionPool) => Promise<T>,
): Promise<T> => {
  const { credential } = await resolveConnectionSecret(
    context.connectionSecretRef,
    context.dbmsType,
  );

  const pool = new sql.ConnectionPool(buildMssqlPoolConfig(context, credential));

  try {
    const connection = await pool.connect();
    return await work(connection);
  } finally {
    await pool.close();
  }
};
