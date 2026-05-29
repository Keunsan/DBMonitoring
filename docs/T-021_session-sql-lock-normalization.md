# SESSION/SQL/LOCK 정규화 적재

Last updated: 2026-05-28 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-021: SESSION/SQL/LOCK 정규화 적재** 산출물을 요약합니다.

- Phase: 5 저장·정규화
- PRD 매핑: SESSION_SNAPSHOT, SQL_PERFORMANCE

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Normalize | `services/storage/normalize.ts` | Collector 결과를 공통 레코드로 변환 |
| Store | `services/storage/store.ts` | 세션, Blocking, SQL 성능, Plan, Deadlock facade |
| Store | `services/storage/supabase-store.ts` | 운영 DB batch insert/조회 |
| API | `app/api/monitoring/sessions/route.ts` | 세션 스냅샷 조회 |
| API | `app/api/monitoring/sql/route.ts` | SQL 성능 조회 |
| API | `app/api/monitoring/runs/route.ts` | Collector 실행 이력 조회 |

---

## 3. 정규화 기준

- 모든 레코드에 `tenantId`, `dbInstanceId`, 수집 시각을 포함합니다.
- SQL Text는 literal 숫자/문자열을 치환한 `sqlTextMasked`만 저장합니다.
- DBMS별 원천 필드는 공통 필드로 변환하고, 후속 raw 저장소는 별도 확장 대상으로 둡니다.

---

## 4. 검증

MSSQL Collector 실행 후 다음 저장 결과를 확인했습니다.

- `collection_run`: 1건
- `metric_history`: 8건
- `session_snapshot`: 29건
- `sql_performance`: 20건
