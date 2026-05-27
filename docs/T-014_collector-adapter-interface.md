# Collector 어댑터 인터페이스 설계

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-014: Collector 어댑터 인터페이스 설계** 산출물을 요약합니다.

- Phase: 4 Collector MVP
- 후속: T-015, T-017, T-018

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Interface | `services/collector/types.ts` | `ICollectorAdapter`, payload, 실행 결과 타입 |
| Registry | `services/collector/registry.ts` | DBMS별 어댑터 팩토리 선택 |
| Entry | `services/collector/index.ts` | Collector public export |

---

## 3. 어댑터 계약

`ICollectorAdapter`는 다음 메서드를 제공합니다.

- `connect`
- `collectAvailability`
- `collectMetrics`
- `collectSessions`
- `collectLocks`
- `collectDeadlocks`
- `collectSql`

각 DBMS 어댑터는 공통 payload 타입으로 데이터를 반환하고, 저장·정규화 단계는 DBMS 차이를 모르는 구조로 동작합니다.

---

## 4. 결정사항

- 1차 구현은 `services/collector`에 배치했습니다.
- MSSQL은 실제 구현, Oracle/Azure SQL은 스텁 어댑터를 반환합니다.
- 개발 단계 secret 참조는 `env:ERP_TEST_DB`를 우선 지원합니다.
