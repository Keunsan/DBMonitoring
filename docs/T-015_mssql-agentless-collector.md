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
- 서버 리소스 지표 (표준 metricName 키):
  - CPU: `server.cpu.used_percent` (`sys.dm_os_performance_counters`)
  - 메모리: `server.memory.used_percent`, `server.memory.available_mb`, `server.memory.total_mb` (`sys.dm_os_sys_memory`, `sys.dm_os_process_memory`)
  - 메모리 부가: `server.memory.page_life_expectancy`, `server.memory.grants_pending`
  - Disk I/O: `server.disk.read_iops`, `server.disk.write_iops`, `server.disk.read_latency_ms`, `server.disk.write_latency_ms` (`sys.dm_io_virtual_file_stats`)
  - Storage/Log: `db.storage.data_used_mb`, `db.storage.data_size_mb`, `db.log.used_percent`, `db.log.used_mb` (`sys.database_files`)
  - TempDB: `db.tempdb.used_mb` (`tempdb.sys.database_files`)
  - Throughput: `server.throughput.batch_requests_per_sec`, `server.throughput.transactions_per_sec`, `server.throughput.log_flushes_per_sec`
  - Session: `server.session.user_connections`, `server.session.processes_blocked`
- 기존 raw counter 이름은 `tags.rawName`으로 보존합니다.
- DMV 권한 부족 시 해당 쿼리만 건너뛰고 전체 수집은 계속 진행합니다.
- 세션: 사용자 세션, 상태, wait, SQL hash, host/program
- Blocking: blocker/blocked session, wait, lock type
- Top SQL: DMV 기반 query hash, 실행 횟수, 평균 elapsed, CPU, logical read
- Deadlock: 1차 MVP에서는 빈 배열로 반환하며 후속 Extended Events 연동 대상

---

## 4. 검증

`POST /api/collector/run`으로 `db_erp_test` 수집을 실행했고 다음 결과를 확인했습니다.

- 실행 상태: `OK`
- 지표: 20건 이상 (서버 리소스 지표 포함)
- 세션: 29건
- SQL: 20건
- Blocking: 0건
