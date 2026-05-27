/** DB 인스턴스 수집 설정 조회·수정 API입니다. */

import { withApiHandler } from "@/lib/api";
import {
  getDbInstance,
  parseCollectionSettingsInput,
  updateCollectionSettings,
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
 * DB 인스턴스 수집 설정을 반환합니다.
 */
export const GET = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async () => {
    const instance = await getDbInstance(id);

    return {
      data: {
        collectorId: instance.collectorId,
        collectIntervalSec: instance.collectIntervalSec,
        sqlAggregateIntervalSec: instance.sqlAggregateIntervalSec,
        isActive: instance.isActive,
        lastCollectAt: instance.lastCollectAt,
        lastCollectStatus: instance.lastCollectStatus,
      },
    };
  })(request);
};

/**
 * DB 인스턴스 수집 설정을 수정합니다.
 */
export const PATCH = async (request: Request, { params }: RouteContext) => {
  const { id } = await params;

  return withApiHandler(async ({ request: apiRequest }) => {
    const payload = await readJsonObject(apiRequest);

    return {
      data: await updateCollectionSettings(
        id,
        parseCollectionSettingsInput(payload),
      ),
    };
  })(request);
};
