/** DB 인스턴스 관리 화면입니다. */

import { DbInstanceManagementClient } from "@/components/features/admin/DbInstanceManagementClient";
import { listBusinessSystems, listDbInstances } from "@/lib/inventory/store";

export const dynamic = "force-dynamic";

const DbInstancesPage = async () => {
  const [businessSystems, dbInstances] = await Promise.all([
    listBusinessSystems(),
    listDbInstances(),
  ]);

  return (
    <DbInstanceManagementClient
      initialBusinessSystems={businessSystems}
      initialDbInstances={dbInstances}
    />
  );
};

export default DbInstancesPage;
