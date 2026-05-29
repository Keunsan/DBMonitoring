/** SQL 성능 회귀 탐지 페이지입니다. */

import { RegressionInsightClient } from "@/components/features/analysis/RegressionInsightClient";
import { listDbInstances } from "@/lib/inventory/store";

export const dynamic = "force-dynamic";

const RegressionsPage = async () => {
  const dbInstances = await listDbInstances();

  return <RegressionInsightClient dbInstances={dbInstances} />;
};

export default RegressionsPage;
