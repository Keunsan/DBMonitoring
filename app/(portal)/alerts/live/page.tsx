/** 실시간 알림 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const LiveAlertsPage = () => (
  <MonitoringRealtimeClient
    title="실시간 알림"
    description="임계치 정책 평가로 생성된 알림 이벤트를 확인합니다. 메신저 발송은 보류 상태입니다."
    variant="alerts"
  />
);

export default LiveAlertsPage;
