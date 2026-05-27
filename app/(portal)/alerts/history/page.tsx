/** 알림 이력 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const AlertHistoryPage = () => (
  <MonitoringRealtimeClient
    title="알림 이력"
    description="생성된 알림 이벤트 이력을 확인합니다."
    variant="alerts"
  />
);

export default AlertHistoryPage;
