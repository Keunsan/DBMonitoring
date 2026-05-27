/** 임계치 정책 관리 페이지입니다. */

import { ThresholdPolicyManagementClient } from "@/components/features/admin/ThresholdPolicyManagementClient";
import { listBusinessSystems, listDbInstances } from "@/lib/inventory/store";
import { listThresholdPolicies } from "@/services/alert";

export const dynamic = "force-dynamic";

const ThresholdPoliciesPage = async () => {
  const [businessSystems, dbInstances] = await Promise.all([
    listBusinessSystems(),
    listDbInstances(),
  ]);

  return (
    <ThresholdPolicyManagementClient
      businessSystems={businessSystems}
      dbInstances={dbInstances}
      initialPolicies={listThresholdPolicies()}
    />
  );
};

export default ThresholdPoliciesPage;
