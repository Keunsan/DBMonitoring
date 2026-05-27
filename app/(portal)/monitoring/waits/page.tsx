/** Wait 현황 모니터링 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const WaitsMonitoringPage = () => (
  <MonitoringRealtimeClient
    title="Wait 현황"
    description="세션의 wait type과 wait 시간을 기준으로 병목 후보를 확인합니다."
    variant="sessions"
  />
);

export default WaitsMonitoringPage;
