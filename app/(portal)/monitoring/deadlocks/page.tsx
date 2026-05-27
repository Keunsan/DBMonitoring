/** Deadlock 모니터링 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const DeadlocksMonitoringPage = () => (
  <MonitoringRealtimeClient
    title="교착상태"
    description="Deadlock 이벤트 수집 현황을 확인합니다. 실제 Extended Events 연동은 후속 확장 대상입니다."
    variant="deadlocks"
  />
);

export default DeadlocksMonitoringPage;
