/** Blocking 모니터링 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const BlockingMonitoringPage = () => (
  <MonitoringRealtimeClient
    title="락 및 Blocking"
    description="수집된 Blocking 건수와 후속 상세 분석의 기준 데이터를 확인합니다."
    variant="blocking"
  />
);

export default BlockingMonitoringPage;
