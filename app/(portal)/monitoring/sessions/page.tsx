/** 실시간 세션 모니터링 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const SessionsMonitoringPage = () => (
  <MonitoringRealtimeClient
    title="실시간 세션"
    description="최근 수집된 사용자 세션, Wait, 실행 SQL 정보를 확인합니다."
    variant="sessions"
  />
);

export default SessionsMonitoringPage;
