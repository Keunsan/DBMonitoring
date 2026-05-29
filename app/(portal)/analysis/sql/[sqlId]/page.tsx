/** SQL 상세 분석 페이지입니다. */

import { SqlDetailClient } from "@/components/features/analysis/SqlDetailClient";
import { listDbInstances } from "@/lib/inventory/store";

export const dynamic = "force-dynamic";

type SqlDetailPageProps = {
  params: Promise<{
    sqlId: string;
  }>;
  searchParams: Promise<{
    dbInstanceId?: string;
  }>;
};

const SqlDetailPage = async ({ params, searchParams }: SqlDetailPageProps) => {
  const [{ sqlId }, query] = await Promise.all([params, searchParams]);
  const dbInstances = await listDbInstances();

  return (
    <SqlDetailClient
      dbInstances={dbInstances}
      sqlId={decodeURIComponent(sqlId)}
      initialDbInstanceId={query.dbInstanceId}
    />
  );
};

export default SqlDetailPage;
