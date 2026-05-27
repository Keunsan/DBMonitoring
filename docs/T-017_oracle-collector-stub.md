# Oracle Collector 어댑터 스텁

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-017: Oracle Collector 어댑터** 현재 산출물을 요약합니다.

- Phase: 4 Collector MVP
- 상태: 스텁 완료, 실제 Oracle 연결은 후속 확장

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Adapter | `services/collector/adapters/oracle/index.ts` | registry 등록 가능한 스텁 어댑터 |

---

## 3. 결정사항

- Oracle 드라이버와 테스트 DB가 준비되기 전까지 실제 수집은 수행하지 않습니다.
- `connect`, `collectMetrics`, `collectSessions` 등 공통 메서드는 모두 명시적 미지원 오류를 반환합니다.
- ASH/AWR 기반 항목은 라이선스 검토 후 구현 여부를 결정합니다.
