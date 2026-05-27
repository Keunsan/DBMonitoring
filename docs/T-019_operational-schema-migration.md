# 운영 DB 스키마 및 마이그레이션

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-019: 운영 DB 스키마 및 마이그레이션** 산출물을 요약합니다.

- Phase: 5 저장·정규화
- PRD 매핑: §8 데이터 모델

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Migration | `supabase/migrations/202605270001_phase5_core.sql` | 운영/시계열 핵심 테이블 DDL |
| Storage | `services/storage/store.ts` | 개발용 메모리 저장소 |
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

---

## 4. 결정사항

- 실제 Supabase 적용 전 RLS와 RBAC는 Phase 2 재개 시 함께 확정합니다.
- 현재 앱 런타임은 메모리 저장소를 사용하며, 마이그레이션은 운영 DB 전환용 초안입니다.
