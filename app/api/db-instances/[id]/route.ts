/** 단일 DB 인스턴스 수정·삭제 API입니다. */

import { withApiHandler } from "@/lib/api";
import {
  deleteDbInstance,
  parseDbInstanceInput,
  updateDbInstance,
} from "@/lib/inventory/store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * DB 인스턴스를 수정합니다.
 */
export const PATCH = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async ({ request: apiRequest }) => {
    const payload = await readJsonObject(apiRequest);
    return {
      data: updateDbInstance(id, parseDbInstanceInput(payload)),
    };
  })(request);
};

/**
 * DB 인스턴스를 삭제합니다.
 */
export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(() => {
    deleteDbInstance(id);
    return {
      data: {
        deleted: true,
      },
    };
  })(request);
};
