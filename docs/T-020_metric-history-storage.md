# 시계열 저장소(METRIC_HISTORY) 설계

Last updated: 2026-05-28 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-020: 시계열 저장소(METRIC_HISTORY) 설계** 산출물을 요약합니다.

- Phase: 5 저장·정규화
- PRD 매핑: §8 METRIC_HISTORY, §11 보관 정책

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Type | `services/storage/types.ts` | `MetricHistoryRecord` 정의 |
| Normalize | `services/storage/normalize.ts` | Collector metric payload 정규화 |
| Store | `services/storage/store.ts` | Supabase/memory facade |
| Store | `services/storage/supabase-store.ts` | `metric_history` batch insert/조회 |
| API | `app/api/monitoring/metrics/route.ts` | 지표 이력 조회 |

---

## 3. 조회 조건

`GET /api/monitoring/metrics`

- `dbInstanceId`: 선택
- `metricName`: 선택
- `limit`: 기본 200, 최대 1000

---

## 4. 남은 확장

- TimescaleDB hypertable 또는 PostgreSQL 파티션 적용
- 보관 기간별 rollup job
- 수집 주기별 downsampling
