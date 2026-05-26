/** 통합 현황 대시보드 플레이스홀더 (T-028에서 구현)입니다. */

import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState, LoadingSkeleton, StatusBadge } from "@/components/shared";

const DashboardPage = () => {
  return (
    <main className="flex flex-1 flex-col">
      <PageHeader
        title="통합 현황"
        description="전체 DB 상태와 주요 알림을 확인하는 MVP 대시보드 골격입니다."
        actions={<Button size="sm">수동 새로고침</Button>}
      />
      <div className="grid gap-4 p-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>DB 상태 요약</CardTitle>
            <CardDescription>상태 배지 컴포넌트 예시</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <StatusBadge kind="health" value="NORMAL" />
            <StatusBadge kind="health" value="CAUTION" />
            <StatusBadge kind="health" value="WARNING" />
            <StatusBadge kind="health" value="OUTAGE" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>수집 상태</CardTitle>
            <CardDescription>Collector 상태 표시 예시</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <StatusBadge kind="collect" value="OK" />
            <StatusBadge kind="collect" value="DELAYED" />
            <StatusBadge kind="collect" value="FAIL" />
          </CardContent>
        </Card>
        <LoadingSkeleton rows={3} />
      </div>
      <div className="px-6 pb-6">
        <EmptyState
          title="대시보드 데이터 수집 전입니다"
          description="DB 인스턴스 등록과 Collector 설정이 완료되면 이 영역에 실시간 상태가 표시됩니다."
        />
      </div>
    </main>
  );
};

export default DashboardPage;
