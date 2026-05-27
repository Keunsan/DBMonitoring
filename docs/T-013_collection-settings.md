# 수집 설정 및 Collector 할당 정책

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-013: 수집 설정 및 Collector 할당 정책** 산출물을 요약합니다.

- Phase: 3 DB 인스턴스 관리
- PRD 매핑: PRD §14 수집 정책
- 후속: T-015, T-016

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| API | `app/api/db-instances/[id]/collection-settings/route.ts` | 수집 설정 조회·수정 |
| Store | `lib/inventory/store.ts` | 수집 주기, SQL 집계 주기, 활성화 상태 저장 |
| UI | `components/features/admin/DbInstanceManagementClient.tsx` | 수집 활성화 토글, Collector ID/주기 표시 |

---

## 3. 수집 설정 필드

| 필드 | 범위 | 설명 |
|------|------|------|
| `collectorId` | 문자열 또는 null | 할당 Collector ID |
| `collectIntervalSec` | 5~60 | 실시간 지표 수집 주기 |
| `sqlAggregateIntervalSec` | 10~300 | Top SQL 집계 주기 |
| `isActive` | boolean | 수집 활성화 여부 |
| `lastCollectAt` | ISO timestamp/null | 마지막 수집/테스트 시각 |
| `lastCollectStatus` | `OK`, `FAIL`, `DELAYED`/null | 마지막 수집/테스트 상태 |

---

## 4. API 규약

### `GET /api/db-instances/{id}/collection-settings`

인스턴스별 수집 설정과 마지막 수집 상태를 반환합니다.

### `PATCH /api/db-instances/{id}/collection-settings`

수집 설정을 수정합니다.

검증:

- `collectIntervalSec`: 5~60초
- `sqlAggregateIntervalSec`: 10~300초
- 존재하지 않는 인스턴스: 404

---

## 5. Collector 반영 범위

현재 단계에서는 설정을 개발용 메모리 저장소에 반영하고 화면/API에서 즉시 확인할 수 있게 했습니다. 실제 Worker scheduler 반영은 T-016에서 `services/collector/scheduler`와 연결합니다.

---

## 6. 검증

```bash
npm run lint
npm run build
```

두 명령 모두 통과했습니다.

---

## 7. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — 수집 설정 API/UI 골격 | T-013 |
