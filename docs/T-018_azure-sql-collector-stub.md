# Azure SQL Collector 어댑터

Last updated: 2026-05-28 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-018: Azure SQL Collector 어댑터** 현재 산출물을 요약합니다.

- Phase: 4 Collector MVP
- 상태: DMV 기반 수집 구현, Azure Monitor 연동은 후속 확장

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Adapter | `services/collector/adapters/azure-sql/index.ts` | MSSQL 호환 DMV 수집 + Azure SQL resource stats 보강 |

---

## 3. 결정사항

- Azure SQL은 TDS/mssql 드라이버 연결과 SQL 인증을 기준으로 수집합니다.
- 세션, Blocking, SQL 성능, DB/테이블 용량은 MSSQL 호환 DMV 경로를 재사용합니다.
- CPU, 메모리, Data IO, Log Write 사용률은 `sys.dm_db_resource_stats`로 보강합니다.
- Azure Monitor, Resource Graph, AAD 인증, subscription/resource ID 기반 API 수집은 후속 확장입니다.
