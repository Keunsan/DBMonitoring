# Azure SQL Collector 어댑터 스텁

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-018: Azure SQL Collector 어댑터** 현재 산출물을 요약합니다.

- Phase: 4 Collector MVP
- 상태: 스텁 완료, Azure Monitor 연동은 후속 확장

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Adapter | `services/collector/adapters/azure-sql/index.ts` | registry 등록 가능한 스텁 어댑터 |

---

## 3. 결정사항

- Azure SQL은 DMV와 Azure Monitor Metrics를 혼합해 구현할 예정입니다.
- 현재는 공통 인터페이스 호환을 위한 스텁만 제공합니다.
- Azure 인증, subscription/resource ID, API rate limit 정책 확정 후 실제 구현합니다.
