/** DB 접속 Secret JSON 스키마 및 참조 타입입니다. */

import type { DbmsType } from "@/types/domain";

/** MSSQL / Azure SQL 공통 인증 필드 */
export type SqlServerCredential = {
  username: string;
  password: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  connectionTimeoutMs?: number;
  requestTimeoutMs?: number;
};

/** Oracle 인증 필드 */
export type OracleCredential = {
  username: string;
  password: string;
  connectString?: string;
  serviceName?: string;
  walletLocation?: string;
};

/** Vault/환경 변수에 저장되는 통합 credential JSON */
export type ConnectionCredential = {
  dbmsType: DbmsType;
  username: string;
  password: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
  connectionTimeoutMs?: number;
  requestTimeoutMs?: number;
  connectString?: string;
  serviceName?: string;
  walletLocation?: string;
};

export type ConnectionSecretRefKind = "vault" | "env";

export type ParsedConnectionSecretRef =
  | { kind: "vault"; vaultName: string; raw: string }
  | { kind: "env"; envName: string; raw: string };

export type ResolvedConnectionSecret = {
  ref: ParsedConnectionSecretRef;
  credential: ConnectionCredential;
};
