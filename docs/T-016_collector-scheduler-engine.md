# Collector 스케줄러 및 실행 엔진

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-016: Collector 스케줄러 및 실행 엔진** 산출물을 요약합니다.

- Phase: 4 Collector MVP
- 후속: T-019, T-023

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Engine | `services/collector/scheduler/index.ts` | 단일/전체 인스턴스 수동 실행 |
| API | `app/api/collector/run/route.ts` | Collector 즉시 실행 |
| API | `app/api/collector/status/route.ts` | 실행 상태 조회 |
| Worker | `scripts/worker/collector.ts` | CLI worker 진입점 |

---

## 3. 실행 정책

- `isActive=true`인 DB 인스턴스만 전체 실행 대상입니다.
- 동일 인스턴스 중복 실행은 `isRunning`으로 차단합니다.
- 실행 성공 시 `lastCollectStatus=OK`, 실패 시 `FAIL`로 갱신합니다.
- 실행 결과는 Phase 5 메모리 저장소에 정규화되어 적재됩니다.

---

## 4. 남은 확장

- 현재는 수동 실행 엔진입니다.
- 실제 interval 반복 실행, 분산 락, BullMQ 연동은 운영 배포 구조 확정 후 확장합니다.
