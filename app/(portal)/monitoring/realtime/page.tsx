/** DB 실시간 현황 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const RealtimeMonitoringPage = () => (
  <MonitoringRealtimeClient
    title="DB 실시간 현황"
    description="수집 실행 후 최신 성능 지표와 수집 상태를 10초마다 갱신합니다."
    variant="realtime"
  />
);

export default RealtimeMonitoringPage;
