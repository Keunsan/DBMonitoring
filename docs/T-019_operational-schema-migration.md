# 운영 DB 스키마 및 마이그레이션

Last updated: 2026-05-28 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-019: 운영 DB 스키마 및 마이그레이션** 산출물을 요약합니다.

- Phase: 5 저장·정규화
- PRD 매핑: §8 데이터 모델

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Migration | `supabase/migrations/202605270001_phase5_core.sql` | 운영/시계열 핵심 테이블 DDL |
| Migration | `supabase/migrations/202605281200_operational_storage_phase8.sql` | session 확장 컬럼, `sql_plan_snapshot`, `sql_regression_event`, 인덱스 |
| Storage | `services/storage/store.ts` | Supabase 우선 facade (미설정 시 memory fallback) |
| Storage | `services/storage/supabase-store.ts` | 운영 DB 저장/조회 |
| API | `app/api/monitoring/*` | 실행 이력·지표·세션·SQL 조회 |

---

## 3. 테이블 초안

- `business_system`
- `db_instance`
- `collection_run`
- `metric_history`
- `session_snapshot`
- `blocking_snapshot`
- `sql_performance`
- `deadlock_event`
- `sql_plan_snapshot` (Phase 8)
- `sql_regression_event` (Phase 8)

---

## 4. 결정사항

- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` 설정 시 수집 결과는 Supabase에 저장됩니다.
- RLS는 Phase 2 인증/RBAC 재개 전까지 service role 서버 접근 기준으로 운영합니다.
- Supabase 미설정 환경에서는 `services/storage/memory-store.ts` fallback을 유지합니다.
- 운영 전 retention/cleanup job은 필수 후속 작업입니다.
