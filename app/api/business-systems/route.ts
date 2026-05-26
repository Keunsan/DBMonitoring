/** 업무 시스템 마스터 목록 조회와 등록 API입니다. */

import { withApiHandler } from "@/lib/api";
import {
  createBusinessSystem,
  listBusinessSystems,
  parseBusinessSystemInput,
} from "@/lib/inventory/store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 업무 시스템 목록을 반환합니다.
 */
export const GET = withApiHandler(() => ({
  data: listBusinessSystems(),
}));

/**
 * 업무 시스템을 등록합니다.
 */
export const POST = withApiHandler(async ({ request }) => {
  const payload = await readJsonObject(request);
  const businessSystem = createBusinessSystem(parseBusinessSystemInput(payload));

  return {
    data: businessSystem,
    status: 201,
  };
});
