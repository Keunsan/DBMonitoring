/** 통합 현황 대시보드 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const DashboardPage = () => {
  return (
    <MonitoringRealtimeClient
      title="통합 현황"
      description="전체 DB 수집 상태, 주요 지표, 미확인 알림을 실시간으로 확인합니다."
      variant="dashboard"
    />
  );
};

export default DashboardPage;
