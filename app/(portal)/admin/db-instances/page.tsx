/** DB 인스턴스 관리 화면입니다. */

import { DbInstanceManagementClient } from "@/components/features/admin/DbInstanceManagementClient";
import { listBusinessSystems, listDbInstances } from "@/lib/inventory/store";

const DbInstancesPage = () => {
  return (
    <DbInstanceManagementClient
      initialBusinessSystems={listBusinessSystems()}
      initialDbInstances={listDbInstances()}
    />
  );
};

export default DbInstancesPage;
