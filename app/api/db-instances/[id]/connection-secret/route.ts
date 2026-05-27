/** DB 인스턴스 접속 Secret 등록·삭제 API입니다. */

import { badRequest, withApiHandler } from "@/lib/api";
import {
  removeDbInstanceConnectionSecret,
  saveDbInstanceConnectionSecret,
  type ConnectionSecretInput,
} from "@/lib/inventory/connection-secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const parseSecretPayload = async (request: Request): Promise<ConnectionSecretInput> => {
  const payload = (await request.json()) as Record<string, unknown>;

  if (typeof payload.username !== "string" || payload.username.trim().length === 0) {
    throw badRequest("username 값은 필수입니다.");
  }

  if (typeof payload.password !== "string" || payload.password.trim().length === 0) {
    throw badRequest("password 값은 필수입니다.");
  }

  return {
    username: payload.username.trim(),
    password: payload.password,
    encrypt: typeof payload.encrypt === "boolean" ? payload.encrypt : undefined,
    trustServerCertificate:
      typeof payload.trustServerCertificate === "boolean"
        ? payload.trustServerCertificate
        : undefined,
    connectionTimeoutMs:
      typeof payload.connectionTimeoutMs === "number"
        ? payload.connectionTimeoutMs
        : undefined,
    requestTimeoutMs:
      typeof payload.requestTimeoutMs === "number" ? payload.requestTimeoutMs : undefined,
    connectString:
      typeof payload.connectString === "string" ? payload.connectString.trim() : undefined,
    serviceName: typeof payload.serviceName === "string" ? payload.serviceName.trim() : undefined,
    walletLocation:
      typeof payload.walletLocation === "string" ? payload.walletLocation.trim() : undefined,
  };
};

/**
 * Vault에 접속 Secret을 저장하고 connection_secret_ref를 갱신합니다.
 */
export const POST = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async () => {
    const secretPayload = await parseSecretPayload(request);

    return {
      data: await saveDbInstanceConnectionSecret(id, secretPayload),
    };
  })(request);
};

/**
 * Vault에서 접속 Secret을 삭제합니다.
 */
export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async () => ({
    data: await removeDbInstanceConnectionSecret(id),
  }))(request);
};
