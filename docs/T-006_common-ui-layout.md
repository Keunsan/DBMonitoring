# 공통 UI 레이아웃 및 디자인 시스템 요약

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-006: 공통 UI 레이아웃 및 디자인 시스템** 산출물을 요약합니다.

- 선행: [T-005_folder-structure.md](./T-005_folder-structure.md)
- 관련 화면 기준: [03_screen_design_outline.md](./03_screen_design_outline.md) §2 메뉴 구조
- 후속: T-028~T-037 Phase 7 화면 구현

---

## 2. 구현 범위

T-006에서는 운영 포털 화면들이 공통으로 사용할 레이아웃, 메뉴, 상태 UI를 구성했습니다.

| 영역 | 산출물 | 설명 |
|------|--------|------|
| AppShell | `components/layout/AppShell.tsx` | Sidebar, Header, 본문 영역을 묶는 포털 레이아웃 |
| Sidebar | `components/layout/AppSidebar.tsx` | 화면 구성안 기반 MVP 메뉴 렌더링 |
| Header | `components/layout/AppHeader.tsx` | 사이드바 토글, 검색 진입점, 알림, 사용자 메뉴 |
| PageHeader | `components/layout/PageHeader.tsx` | 페이지 제목, 설명, 액션 영역 공통화 |
| EmptyState | `components/shared/EmptyState.tsx` | 빈 데이터 상태 한글 안내 |
| ErrorState | `components/shared/ErrorState.tsx` | 오류 상태 한글 안내 및 재시도 액션 |
| LoadingSkeleton | `components/shared/LoadingSkeleton.tsx` | 카드·목록 로딩 상태 |
| StatusBadge | `components/shared/StatusBadge.tsx` | DB 상태 및 수집 상태 한글 배지 |
| Portal Layout | `app/(portal)/layout.tsx` | AppShell 적용 |
| Dashboard Placeholder | `app/(portal)/dashboard/page.tsx` | 공통 컴포넌트 렌더링 확인용 골격 |

---

## 3. 레이아웃 구조

```text
app/(portal)/layout.tsx
└── AppShell
    ├── TooltipProvider
    └── SidebarProvider
        ├── AppSidebar
        └── SidebarInset
            ├── AppHeader
            └── page content
```

`TooltipProvider`는 `components/ui/sidebar.tsx`의 메뉴 tooltip 사용을 위해 AppShell 최상단에 배치했습니다.

---

## 4. 메뉴 구성

사이드바는 `lib/constants/routes.ts`의 `PORTAL_NAV_GROUPS`를 기준으로 렌더링합니다.

| 메뉴 그룹 | MVP 항목 |
|-----------|----------|
| 대시보드 | 통합 현황 |
| 실시간 모니터링 | DB 실시간 현황, 실시간 세션, 락 및 Blocking, 교착상태, Wait 현황 |
| 성능 분석 | Top SQL 분석 |
| 알림 및 이슈 | 실시간 알림, 알림 이력 |
| 시스템 관리 | DB 인스턴스 관리, 사용자 관리, 역할 및 권한 |

MVP 범위가 아닌 항목은 비활성 상태와 `후속` 배지로 구분합니다.

---

## 5. 상태 UI 규칙

| 상태 | 컴포넌트 | 사용자 안내 기준 |
|------|----------|------------------|
| 로딩 | `LoadingSkeleton` | 데이터 로딩 중 즉시 시각 피드백 제공 |
| 빈 상태 | `EmptyState` | 데이터가 없는 이유와 다음 행동을 한글로 안내 |
| 오류 | `ErrorState` | 원인을 과도하게 노출하지 않고 재시도 경로 제공 |
| 상태 값 | `StatusBadge` | DB 상태, 수집 상태를 색상과 한글 라벨로 표시 |

---

## 6. 호환성 정리

T-006 검증 과정에서 기존 shadcn/ui scaffold와 현재 스택 간 호환 문제를 함께 정리했습니다.

| 파일 | 조치 | 이유 |
|------|------|------|
| `hooks/use-mobile.ts` | `useSyncExternalStore` 기반 media query 구독 | React 19 `react-hooks/set-state-in-effect` 규칙 대응 |
| `components/ui/carousel.tsx` | Embla 상태를 `useSyncExternalStore`로 구독 | effect 내부 동기 setState 제거 |
| `components/ui/calendar.tsx` | `table` → `month_grid` | `react-day-picker@10` ClassNames API 대응 |
| `components/layout/AppShell.tsx` | `TooltipProvider` 추가 | Sidebar tooltip 런타임 요구사항 충족 |

---

## 7. 검증 결과

```bash
npm run lint
npm run build
```

두 명령 모두 통과했습니다.

Next.js 관련 문서는 현재 설치된 패키지에서 `node_modules/next/dist/docs/` 경로가 존재함을 확인했습니다.

---

## 8. 후속 작업

- T-007: API 스켈레톤 및 공통 응답 규약
- T-028~T-037: Phase 7 화면에서 AppShell, PageHeader, EmptyState, ErrorState, LoadingSkeleton, StatusBadge 재사용
- 실제 인증/권한 연동 후 Sidebar 메뉴 노출 범위를 RBAC scope와 연결

---

## 9. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — T-006 공통 레이아웃·상태 UI 산출물 요약 | T-006 |
