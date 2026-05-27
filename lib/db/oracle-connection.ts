/** Oracle 연결 헬퍼입니다. */

import oracledb from "oracledb";

import { buildOracleConnectString } from "@/lib/db/connection-config";
import { resolveConnectionSecret } from "@/lib/secrets/resolver";
import type { CollectorContext } from "@/services/collector/types";

/**
 * 인스턴스 context와 secret ref로 Oracle 연결을 열고 작업을 수행합니다.
 */
export const withOracleConnection = async <T>(
  context: CollectorContext,
  work: (connection: oracledb.Connection) => Promise<T>,
): Promise<T> => {
  const { credential } = await resolveConnectionSecret(
    context.connectionSecretRef,
    context.dbmsType,
  );

  const connectString = buildOracleConnectString(context, credential);

  const connection = await oracledb.getConnection({
    user: credential.username,
    password: credential.password,
    connectString,
  });

  try {
    return await work(connection);
  } finally {
    await connection.close();
  }
};
