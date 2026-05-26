/** DB 인스턴스 연결 테스트 API입니다. */

import { withApiHandler } from "@/lib/api";
import { testDbInstanceConnection } from "@/lib/inventory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * 등록된 DB 인스턴스의 연결 테스트를 수행합니다.
 */
export const POST = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async () => ({
    data: await testDbInstanceConnection(id),
  }))(request);
};
