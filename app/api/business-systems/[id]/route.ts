/** 단일 업무 시스템 수정·삭제 API입니다. */

import { withApiHandler } from "@/lib/api";
import {
  deleteBusinessSystem,
  parseBusinessSystemInput,
  updateBusinessSystem,
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
 * 업무 시스템을 수정합니다.
 */
export const PATCH = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async ({ request: apiRequest }) => {
    const payload = await readJsonObject(apiRequest);
    return {
      data: await updateBusinessSystem(id, parseBusinessSystemInput(payload)),
    };
  })(request);
};

/**
 * 업무 시스템을 삭제합니다.
 */
export const DELETE = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async () => {
    await deleteBusinessSystem(id);
    return {
      data: {
        deleted: true,
      },
    };
  })(request);
};
