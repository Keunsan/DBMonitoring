/** DB 인스턴스 목록 조회와 등록 API입니다. */

import { withApiHandler } from "@/lib/api";
import {
  createDbInstance,
  listBusinessSystems,
  listDbInstances,
  parseDbInstanceInput,
} from "@/lib/inventory/store";
import { readJsonObject } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DB 인스턴스 목록과 업무 시스템 참조 데이터를 반환합니다.
 */
export const GET = withApiHandler(() => ({
  data: {
    items: listDbInstances(),
    businessSystems: listBusinessSystems(),
  },
}));

/**
 * DB 인스턴스를 등록합니다.
 */
export const POST = withApiHandler(async ({ request }) => {
  const payload = await readJsonObject(request);
  const instance = createDbInstance(parseDbInstanceInput(payload));

  return {
    data: instance,
    status: 201,
  };
});
