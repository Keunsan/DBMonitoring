/** Top SQL 분석 화면입니다. */

import { MonitoringRealtimeClient } from "@/components/features/monitoring/MonitoringRealtimeClient";

const TopSqlPage = () => (
  <MonitoringRealtimeClient
    title="Top SQL 분석"
    description="최근 수집된 SQL 성능 집계와 마스킹된 SQL Text를 확인합니다."
    variant="top-sql"
  />
);

export default TopSqlPage;
