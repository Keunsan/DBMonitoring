/** 실행 계획 변경 분석 페이지입니다. */

import { PlanChangeClient } from "@/components/features/analysis/PlanChangeClient";
import { listDbInstances } from "@/lib/inventory/store";

export const dynamic = "force-dynamic";

const PlanChangesPage = async () => {
  const dbInstances = await listDbInstances();

  return <PlanChangeClient dbInstances={dbInstances} />;
};

export default PlanChangesPage;
