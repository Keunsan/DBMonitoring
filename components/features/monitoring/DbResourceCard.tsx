/** DB 인스턴스별 서버 리소스 요약 카드를 표시합니다. */

import { ResourceOverviewCards } from "@/components/features/monitoring/ResourceOverviewCards";
import { StatusBadge } from "@/components/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ResourceSummary } from "@/lib/monitoring/resource-summary";
import type { DbInstance } from "@/types/entities";

type DbResourceCardProps = {
  instance: DbInstance;
  resourceSummary: ResourceSummary;
  collectStatus: "OK" | "FAIL" | "DELAYED" | null;
};

/**
 * 대시보드 DB 목록에서 인스턴스별 리소스 상태를 카드로 렌더링합니다.
 */
export const DbResourceCard = ({
  instance,
  resourceSummary,
  collectStatus,
}: DbResourceCardProps) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle>{instance.instanceName}</CardTitle>
          <CardDescription>
            {instance.dbmsType} / {instance.databaseName ?? "-"}
          </CardDescription>
        </div>
        {collectStatus ? <StatusBadge kind="collect" value={collectStatus} /> : null}
      </div>
    </CardHeader>
    <CardContent>
      <ResourceOverviewCards resource={resourceSummary} compact />
    </CardContent>
  </Card>
);
