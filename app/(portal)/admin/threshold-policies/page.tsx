/** 임계치 정책 관리 페이지입니다. */

import { ThresholdPolicyManagementClient } from "@/components/features/admin/ThresholdPolicyManagementClient";
import { listBusinessSystems, listDbInstances } from "@/lib/inventory/store";
import { listThresholdPolicies } from "@/services/alert";

const ThresholdPoliciesPage = () => (
  <ThresholdPolicyManagementClient
    businessSystems={listBusinessSystems()}
    dbInstances={listDbInstances()}
    initialPolicies={listThresholdPolicies()}
  />
);

export default ThresholdPoliciesPage;
