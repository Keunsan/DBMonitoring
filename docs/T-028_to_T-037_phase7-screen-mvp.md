# Phase 7 화면 MVP

Last updated: 2026-05-27 KST

## 1. 구현 범위

Phase 7의 1차 화면을 내부 테스트용 실시간 조회 방식으로 구현했습니다.

- 통합 현황 대시보드
- DB 실시간 현황
- 실시간 세션
- Blocking
- Deadlock
- Wait 현황
- Top SQL 분석
- DB 인스턴스 관리
- 실시간 알림/알림 이력
- 임계치 정책 관리

## 2. 산출물

- `components/features/monitoring/MonitoringRealtimeClient.tsx`
- `components/features/monitoring/ResourceOverviewCards.tsx`
- `components/features/monitoring/ResourceMetricGrid.tsx`
- `components/features/monitoring/ResourceTrendChart.tsx`
- `components/features/monitoring/ResourceTopLists.tsx`
- `components/features/monitoring/MetricHealthBadge.tsx`
- `components/features/monitoring/DbResourceCard.tsx`
- `lib/monitoring/metric-keys.ts`, `lib/monitoring/resource-summary.ts`
- `app/(portal)/dashboard/page.tsx`
- `app/(portal)/monitoring/*`
- `app/(portal)/analysis/top-sql/page.tsx`
- `app/(portal)/alerts/*`
- `app/(portal)/admin/threshold-policies/page.tsx`

## 3. 대시보드·실시간 리소스 UI

- `/dashboard`: 전체 DB 수·수집 상태·미확인 알림, CPU/Memory/Disk/Log Top 리스트, DB별 리소스 카드
- `/monitoring/realtime`: 선택 DB의 CPU/Memory/Disk/Log/Temp 카드, Recharts 추이 차트, 세부 지표 테이블
- `/api/monitoring/summary` 응답에 `resourceSummary` 포함

## 4. 결정사항

사용자/권한 관리 화면은 Phase 2 보류 결정에 따라 후속으로 유지합니다. 현재 포털은 로그인 없이 접근하는 내부 테스트 모드입니다.
