# MSSQL Agentless Collector 구현

Last updated: 2026-05-27 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-015: MSSQL Agentless Collector 구현** 산출물을 요약합니다.

- Phase: 4 Collector MVP
- PRD 매핑: §11.1 MSSQL 1차 우선, 화면 §5.2~5.3

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| Adapter | `services/collector/adapters/mssql/index.ts` | MSSQL DMV 기반 수집 구현 |
| Connection | `lib/db/erp-test.ts` 재사용 | `env:ERP_TEST_DB` 연결 설정 |
| Security | SQL 마스킹 | literal 숫자/문자열 치환 후 저장 |

---

## 3. 수집 항목

- 가용성: 서버명, DB명, 버전, 응답 시간
- 성능 지표: Batch Requests/sec, SQL Compilations/sec, Page life expectancy, User Connections, Processes blocked
- 세션: 사용자 세션, 상태, wait, SQL hash, host/program
- Blocking: blocker/blocked session, wait, lock type
- Top SQL: DMV 기반 query hash, 실행 횟수, 평균 elapsed, CPU, logical read
- Deadlock: 1차 MVP에서는 빈 배열로 반환하며 후속 Extended Events 연동 대상

---

## 4. 검증

`POST /api/collector/run`으로 `db_erp_test` 수집을 실행했고 다음 결과를 확인했습니다.

- 실행 상태: `OK`
- 지표: 8건
- 세션: 29건
- SQL: 20건
- Blocking: 0건
