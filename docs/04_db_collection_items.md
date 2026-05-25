# 통합 DB 모니터링 시스템 DB 수집 항목 정의서

## 1. 문서 개요

### 1.1 목적

본 문서는 MSSQL, Oracle, Azure SQL Database를 대상으로 통합 DB 모니터링 시스템에서 수집해야 할 데이터 항목을 정의한다. 수집 항목은 실시간 모니터링, 성능 이력 분석, SQL 분석, 보안 점검, 알림 및 리포트 기능의 기반 데이터로 활용한다.

### 1.2 수집 원칙

- DBMS별 고유 지표는 유지하되, 통합 대시보드에서는 공통 지표 모델로 정규화한다.
- 실시간 장애 감지에 필요한 항목은 짧은 주기로 수집한다.
- 장기 분석용 항목은 집계 데이터를 함께 저장하여 저장소 부담을 줄인다.
- SQL Text, 계정, 접속 정보 등 민감 데이터는 마스킹과 접근 권한을 적용한다.
- 수집 계정은 최소 권한 원칙을 따른다.

### 1.3 수집 주기 기준

- 실시간 지표: 5초에서 60초
- 세션 및 락 정보: 5초에서 30초
- SQL 성능 집계: 1분에서 5분
- 실행 계획: 변경 감지 시 또는 5분에서 1시간
- 계정 및 권한 정보: 1일 1회 또는 변경 감지 시
- 보안 이벤트: 1분에서 5분 또는 이벤트 기반
- 리포트 집계: 일 단위

## 2. 공통 수집 항목

## 2.1 DB 인스턴스 기본 정보

### 목적

모니터링 대상 DB의 식별과 업무 매핑을 위해 수집 및 관리한다.

### 항목

- DB 인스턴스 ID
- DBMS 유형
- DBMS 버전
- 인스턴스명
- 데이터베이스명 또는 서비스명
- 호스트명
- IP
- 포트
- 운영 구분: 운영, 개발, 검증, DR
- 업무 시스템명
- 업무 중요도
- 담당 부서
- 담당자
- 수집 방식: Agent, Agentless, API
- 수집 활성화 여부
- 최종 수집 일시
- 수집 상태

### 권장 수집 주기

등록 시, 변경 시, 1일 1회

## 2.2 가용성 및 연결 상태

### 목적

DB 접속 가능 여부와 수집 상태를 확인한다.

### 항목

- 접속 가능 여부
- 응답 시간
- 수집 성공 여부
- 수집 오류 메시지
- 마지막 성공 수집 일시
- 마지막 실패 수집 일시
- 연속 실패 횟수
- DB 상태: Online, Offline, Recovering, Suspect 등

### 권장 수집 주기

30초에서 1분

## 2.3 리소스 성능 지표

### 목적

DB 서버 또는 PaaS DB의 기본 리소스 사용 상태를 확인한다.

### 항목

- CPU 사용률
- CPU 사용 시간
- 메모리 사용률
- 사용 가능 메모리
- Buffer Cache 관련 지표
- 디스크 Read IOPS
- 디스크 Write IOPS
- 디스크 Read Throughput
- 디스크 Write Throughput
- 디스크 Latency
- 네트워크 수신량
- 네트워크 송신량
- 스토리지 사용량
- 스토리지 사용률
- 로그 영역 사용량
- 로그 영역 사용률
- Temp 영역 사용량
- Temp 영역 사용률

### 권장 수집 주기

10초에서 1분

## 2.4 세션 및 연결 지표

### 목적

현재 접속 상태와 부하 집중 여부를 확인한다.

### 항목

- 전체 세션 수
- Active 세션 수
- Idle 세션 수
- Waiting 세션 수
- Blocking 세션 수
- 장시간 실행 세션 수
- 사용자별 세션 수
- 프로그램별 세션 수
- 호스트별 세션 수
- 연결 실패 횟수
- 최대 연결 수 대비 사용률

### 권장 수집 주기

5초에서 30초

## 2.5 트랜잭션 및 처리량 지표

### 목적

DB 처리량과 트랜잭션 부하를 확인한다.

### 항목

- 초당 트랜잭션 수
- 초당 요청 수
- 초당 Batch Request 수
- Commit 수
- Rollback 수
- Lock 요청 수
- Deadlock 수
- Log Flush 수
- Checkpoint 발생 수

### 권장 수집 주기

10초에서 1분

## 2.6 Wait 지표

### 목적

성능 저하 원인을 대기 이벤트 기준으로 분석한다.

### 항목

- Wait 이름
- Wait 분류
- Wait 발생 횟수
- 총 Wait 시간
- 평균 Wait 시간
- 최대 Wait 시간
- 관련 세션 수
- 관련 SQL ID
- 수집 시각

### 권장 수집 주기

10초에서 1분

## 2.7 SQL 성능 지표

### 목적

리소스를 많이 사용하는 SQL과 성능 저하 SQL을 식별한다.

### 항목

- SQL ID 또는 Query Hash
- SQL Text
- Normalized SQL Text
- DB 인스턴스 ID
- 사용자
- 프로그램
- 실행 횟수
- 평균 수행 시간
- 최대 수행 시간
- 최소 수행 시간
- 총 수행 시간
- CPU 시간
- Logical Read
- Physical Read
- Write 수
- 반환 Row 수
- Wait 시간
- 첫 실행 일시
- 마지막 실행 일시
- 실행 계획 ID
- 성능 Baseline 값
- Baseline 대비 변화율

### 권장 수집 주기

1분에서 5분

### 보안 고려사항

- SQL Text에 개인정보가 포함될 수 있으므로 기본 마스킹을 적용한다.
- Literal 값은 제거하거나 치환하여 저장한다.
- 원문 SQL 조회는 권한 기반으로 제한한다.

## 2.8 실행 계획 지표

### 목적

실행 계획 변경과 성능 영향을 분석한다.

### 항목

- SQL ID
- Plan ID 또는 Plan Hash
- Plan Text 또는 Plan XML
- Operation 목록
- Access Path
- Join Method
- Estimated Cost
- Estimated Rows
- Actual Rows
- 사용 인덱스
- Full Scan 여부
- Sort 발생 여부
- Hash Join 여부
- Spill 발생 여부
- Plan 생성 일시
- Plan 마지막 사용 일시
- Plan별 평균 수행 시간
- Plan별 CPU 및 I/O

### 권장 수집 주기

변경 감지 시, 또는 5분에서 1시간

## 2.9 락 및 Blocking 지표

### 목적

실시간 장애의 주요 원인인 락 경합을 탐지한다.

### 항목

- Blocking 세션 ID
- Blocked 세션 ID
- 락 유형
- 락 모드
- 락 대상 객체
- 대기 시간
- 관련 SQL ID
- 사용자
- 프로그램
- 호스트
- 트랜잭션 시작 시간
- 수집 시각

### 권장 수집 주기

5초에서 30초

## 2.10 교착상태 지표

### 목적

Deadlock 발생 원인과 반복 패턴을 분석한다.

### 항목

- 발생 일시
- DB 인스턴스 ID
- 피해 세션 ID
- 관련 세션 목록
- 관련 SQL 목록
- 관련 객체
- Deadlock Graph 또는 XML
- 사용자
- 프로그램
- 호스트
- 트랜잭션 정보
- 재발 패턴 ID

### 권장 수집 주기

이벤트 기반, 보완적으로 1분

## 2.11 계정 및 권한 지표

### 목적

DB 계정과 권한 상태를 점검한다.

### 항목

- 계정명
- 계정 유형
- 계정 상태
- 생성 일시
- 잠금 여부
- 만료 여부
- 비밀번호 만료 일시
- 최종 로그인 일시
- 장기 미사용 여부
- 부여 권한
- 역할
- 관리자 권한 여부
- 고위험 권한 여부
- 권한 부여자
- 권한 부여 일시

### 권장 수집 주기

1일 1회, 변경 감지 시

## 2.12 보안 이벤트 지표

### 목적

비정상 접속과 보안 위험 이벤트를 탐지한다.

### 항목

- 이벤트 일시
- 이벤트 유형
- 계정명
- 접속 IP
- 호스트명
- 프로그램명
- 성공 여부
- 실패 사유
- 실패 횟수
- 접속 위치 또는 네트워크 구분
- 비정상 시간대 여부
- 관리자 권한 사용 여부
- 보안 설정 변경 여부

### 권장 수집 주기

1분에서 5분, 이벤트 기반

## 3. MSSQL 수집 항목

## 3.1 MSSQL 성능 카운터

### 주요 항목

- Batch Requests/sec
- SQL Compilations/sec
- SQL Re-Compilations/sec
- User Connections
- Processes Blocked
- Lock Waits/sec
- Number of Deadlocks/sec
- Page Life Expectancy
- Buffer Cache Hit Ratio
- Lazy Writes/sec
- Checkpoint Pages/sec
- Page Reads/sec
- Page Writes/sec
- Log Flushes/sec
- Log Flush Wait Time
- Transactions/sec
- Temp Tables Creation Rate
- Version Store Size

### 주요 원천 후보

- sys.dm_os_performance_counters
- sys.dm_os_sys_memory
- sys.dm_os_process_memory
- sys.dm_io_virtual_file_stats

## 3.2 MSSQL 세션 및 요청

### 주요 항목

- session_id
- login_name
- host_name
- program_name
- status
- request status
- command
- wait_type
- wait_time
- blocking_session_id
- cpu_time
- logical_reads
- reads
- writes
- total_elapsed_time
- sql_handle
- plan_handle

### 주요 원천 후보

- sys.dm_exec_sessions
- sys.dm_exec_requests
- sys.dm_exec_connections
- sys.dm_exec_sql_text
- sys.dm_exec_query_plan

## 3.3 MSSQL Query Store 및 SQL 이력

### 주요 항목

- query_id
- query_hash
- plan_id
- plan_hash
- execution_type
- count_executions
- avg_duration
- max_duration
- avg_cpu_time
- avg_logical_io_reads
- avg_physical_io_reads
- last_execution_time
- runtime_stats_interval

### 주요 원천 후보

- sys.query_store_query
- sys.query_store_query_text
- sys.query_store_plan
- sys.query_store_runtime_stats
- sys.query_store_runtime_stats_interval

### 비고

Query Store가 비활성화된 DB는 DMV 기반 수집으로 대체하되, SQL 이력 보존 수준이 낮아질 수 있다.

## 3.4 MSSQL 락 및 Deadlock

### 주요 항목

- resource_type
- resource_database_id
- resource_associated_entity_id
- request_mode
- request_status
- request_session_id
- blocking_session_id
- deadlock graph

### 주요 원천 후보

- sys.dm_tran_locks
- sys.dm_os_waiting_tasks
- Extended Events system_health
- Deadlock XML

## 3.5 MSSQL 보안 및 계정

### 주요 항목

- SQL Login
- Windows Login
- Server Role
- Database Role
- Permission
- Disabled 여부
- Password Expiration 여부
- Last Login
- Failed Login

### 주요 원천 후보

- sys.server_principals
- sys.database_principals
- sys.server_role_members
- sys.database_role_members
- sys.server_permissions
- sys.database_permissions
- SQL Server Audit
- Error Log

## 4. Oracle 수집 항목

## 4.1 Oracle 인스턴스 및 리소스

### 주요 항목

- Instance Status
- Host CPU 사용률
- SGA 사용량
- PGA 사용량
- Buffer Cache Hit Ratio
- Library Cache Hit Ratio
- Redo Size
- Logical Reads
- Physical Reads
- DB Time
- DB CPU
- Parse Count
- Execute Count
- User Commits
- User Rollbacks

### 주요 원천 후보

- V$INSTANCE
- V$SYSSTAT
- V$SGA
- V$PGASTAT
- V$OSSTAT
- V$SYSTEM_EVENT
- V$SYSMETRIC

## 4.2 Oracle 세션

### 주요 항목

- SID
- SERIAL#
- USERNAME
- STATUS
- MACHINE
- PROGRAM
- MODULE
- ACTION
- SQL_ID
- SQL_CHILD_NUMBER
- EVENT
- WAIT_CLASS
- SECONDS_IN_WAIT
- BLOCKING_SESSION
- LOGON_TIME

### 주요 원천 후보

- V$SESSION
- V$PROCESS
- V$SQL
- V$SQLAREA

## 4.3 Oracle Wait 및 ASH

### 주요 항목

- EVENT
- WAIT_CLASS
- TOTAL_WAITS
- TIME_WAITED
- AVERAGE_WAIT
- SQL_ID
- SESSION_ID
- SAMPLE_TIME
- BLOCKING_SESSION

### 주요 원천 후보

- V$SYSTEM_EVENT
- V$SESSION_EVENT
- V$ACTIVE_SESSION_HISTORY
- DBA_HIST_ACTIVE_SESS_HISTORY

### 비고

ASH 및 AWR 기반 수집은 라이선스 정책 확인이 필요하다.

## 4.4 Oracle SQL 및 실행 계획

### 주요 항목

- SQL_ID
- PLAN_HASH_VALUE
- SQL_TEXT
- EXECUTIONS
- ELAPSED_TIME
- CPU_TIME
- BUFFER_GETS
- DISK_READS
- ROWS_PROCESSED
- FIRST_LOAD_TIME
- LAST_ACTIVE_TIME
- CHILD_NUMBER
- OBJECT_OWNER
- OBJECT_NAME
- OPERATION
- OPTIONS

### 주요 원천 후보

- V$SQL
- V$SQLAREA
- V$SQL_PLAN
- DBA_HIST_SQLSTAT
- DBA_HIST_SQLTEXT
- DBA_HIST_SQL_PLAN

## 4.5 Oracle 락 및 Blocking

### 주요 항목

- Blocking Session
- Waiting Session
- Lock Type
- Lock Mode
- Request Mode
- Object Owner
- Object Name
- Wait Time
- Related SQL_ID

### 주요 원천 후보

- V$LOCK
- V$LOCKED_OBJECT
- DBA_OBJECTS
- V$SESSION

## 4.6 Oracle 계정 및 보안

### 주요 항목

- USERNAME
- ACCOUNT_STATUS
- CREATED
- LOCK_DATE
- EXPIRY_DATE
- DEFAULT_TABLESPACE
- TEMPORARY_TABLESPACE
- PROFILE
- Granted Role
- System Privilege
- Object Privilege
- Last Login
- Failed Login

### 주요 원천 후보

- DBA_USERS
- DBA_ROLE_PRIVS
- DBA_SYS_PRIVS
- DBA_TAB_PRIVS
- DBA_PROFILES
- DBA_AUDIT_TRAIL
- UNIFIED_AUDIT_TRAIL

## 5. Azure SQL Database 수집 항목

## 5.1 Azure SQL 리소스 지표

### 주요 항목

- DTU 사용률
- CPU 사용률
- Data IO 사용률
- Log IO 사용률
- Storage 사용량
- Storage 사용률
- Sessions Count
- Workers 사용률
- Deadlock 수
- Connection Failed 수
- Throttling 발생 여부
- Replication Lag

### 주요 원천 후보

- Azure Monitor Metrics
- Azure Resource Graph
- sys.dm_db_resource_stats
- sys.resource_stats

## 5.2 Azure SQL 세션 및 요청

### 주요 항목

- session_id
- login_name
- host_name
- program_name
- status
- command
- wait_type
- blocking_session_id
- cpu_time
- logical_reads
- reads
- writes
- total_elapsed_time
- sql_handle
- plan_handle

### 주요 원천 후보

- sys.dm_exec_sessions
- sys.dm_exec_requests
- sys.dm_exec_connections
- sys.dm_exec_sql_text
- sys.dm_exec_query_plan

## 5.3 Azure SQL Query Store

### 주요 항목

- query_id
- query_text_id
- plan_id
- runtime_stats_interval_id
- count_executions
- avg_duration
- avg_cpu_time
- avg_logical_io_reads
- avg_physical_io_reads
- avg_log_bytes_used
- last_execution_time

### 주요 원천 후보

- sys.query_store_query
- sys.query_store_query_text
- sys.query_store_plan
- sys.query_store_runtime_stats
- sys.query_store_runtime_stats_interval

## 5.4 Azure SQL 보안 및 설정

### 주요 항목

- 방화벽 규칙
- AAD 관리자 설정
- SQL 계정 목록
- Database Role
- Permission
- Auditing 활성화 여부
- Defender for SQL 활성화 여부
- 취약성 평가 설정 여부
- 로그인 실패 이벤트

### 주요 원천 후보

- Azure Resource Manager API
- Azure Monitor Diagnostic Logs
- sys.database_principals
- sys.database_role_members
- sys.database_permissions
- Auditing Logs

## 6. 알림 생성 기준 항목

## 6.1 성능 알림

### 예시 조건

- CPU 사용률이 5분 이상 85% 초과
- Memory 사용률이 5분 이상 90% 초과
- Disk I/O Latency가 기준치 초과
- Active Session 수가 평소 대비 2배 이상 증가
- Log 사용률이 80% 초과
- Temp 사용률이 80% 초과
- Wait 시간이 기준치 초과
- Long Running Query가 기준 시간 초과

## 6.2 장애 알림

### 예시 조건

- DB 접속 실패
- 수집 연속 실패
- Blocking 지속 시간 기준 초과
- Deadlock 발생
- Connection Failed 급증
- Azure SQL Throttling 발생

## 6.3 SQL 성능 알림

### 예시 조건

- 특정 SQL의 평균 수행 시간이 Baseline 대비 2배 이상 증가
- 특정 SQL의 CPU 사용량이 Baseline 대비 2배 이상 증가
- 실행 계획 변경 후 성능 악화
- Logical Read 또는 Physical Read 급증
- 실행 횟수 급증

## 6.4 보안 알림

### 예시 조건

- 관리자 권한 신규 부여
- 고위험 권한 부여
- 로그인 실패 반복
- 비정상 시간대 접속
- 허용되지 않은 IP 접속
- 장기 미사용 계정 활성화
- Azure SQL 방화벽 규칙 변경
- 감사 설정 비활성화

## 7. 데이터 정규화 모델 제안

## 7.1 공통 식별자

- tenant_id
- db_instance_id
- dbms_type
- business_system_id
- metric_time
- collector_id

## 7.2 성능 지표 공통 모델

- metric_time
- db_instance_id
- metric_category
- metric_name
- metric_value
- metric_unit
- severity
- raw_source

## 7.3 SQL 지표 공통 모델

- collect_time
- db_instance_id
- sql_id
- sql_hash
- normalized_sql
- plan_id
- executions
- avg_elapsed_ms
- max_elapsed_ms
- cpu_ms
- logical_reads
- physical_reads
- writes
- wait_ms
- baseline_elapsed_ms
- regression_rate

## 7.4 세션 지표 공통 모델

- collect_time
- db_instance_id
- session_id
- user_name
- host_name
- program_name
- status
- sql_id
- wait_name
- blocking_session_id
- elapsed_ms
- cpu_ms
- logical_reads

## 7.5 보안 지표 공통 모델

- event_time
- db_instance_id
- event_type
- account_name
- source_ip
- host_name
- privilege_name
- risk_level
- result
- description

## 8. 보관 정책 제안

### 8.1 원천 데이터

- 초 단위 성능 데이터: 7일에서 30일
- 실시간 세션 스냅샷: 7일에서 30일
- 락 및 Blocking 스냅샷: 30일
- Deadlock 이벤트: 1년 이상

### 8.2 집계 데이터

- 1분 집계: 3개월
- 5분 집계: 6개월
- 1시간 집계: 1년 이상
- 일 단위 집계: 3년 이상 또는 내부 정책 기준

### 8.3 분석 데이터

- SQL 성능 이력: 6개월에서 1년
- 실행 계획 이력: 1년 이상
- 알림 이력: 1년 이상
- 이슈 이력: 1년 이상
- 보안 및 권한 이력: 내부 감사 정책 기준

## 9. 수집 방식 고려사항

### 9.1 Agent 방식

장점:

- OS 리소스와 DB 지표를 함께 수집하기 쉽다.
- 초 단위 고빈도 수집에 유리하다.
- 네트워크 단절 시 임시 버퍼링이 가능하다.

고려사항:

- 서버 설치 및 운영 관리가 필요하다.
- 보안 정책상 설치 승인이 필요할 수 있다.

### 9.2 Agentless 방식

장점:

- DB 서버에 별도 프로그램 설치가 필요 없다.
- 초기 도입이 상대적으로 간단하다.

고려사항:

- 수집 계정 권한 설계가 중요하다.
- OS 레벨 지표 수집에 제한이 있을 수 있다.
- 네트워크 품질에 영향을 받는다.

### 9.3 API 방식

장점:

- Azure SQL 등 PaaS 환경의 관리 지표 수집에 적합하다.
- 클라우드 리소스 설정과 보안 상태까지 함께 확인할 수 있다.

고려사항:

- API 호출 제한과 비용을 고려해야 한다.
- Azure 권한과 구독 범위 설정이 필요하다.

## 10. 수집 권한 고려사항

### MSSQL

- DMV 조회 권한
- Query Store 조회 권한
- 성능 카운터 조회 권한
- 보안 및 계정 정보 조회 권한
- Extended Events 또는 Audit 조회 권한

### Oracle

- V$ View 조회 권한
- DBA View 조회 권한
- ASH/AWR 사용 시 라이선스 검토
- Audit Trail 조회 권한
- 실행 계획 조회 권한

### Azure SQL Database

- Database DMV 조회 권한
- Query Store 조회 권한
- Azure Monitor Reader 권한
- Resource Graph Reader 권한
- Diagnostic Logs 조회 권한
- 보안 설정 조회 권한

## 11. 1차 구축 우선 수집 항목

### 공통

- DB 연결 상태
- CPU, 메모리, I/O, 스토리지
- 세션 수, Active Session
- Wait
- Blocking
- Deadlock
- Long Running Query
- Top SQL
- 알림 이벤트

### MSSQL

- sys.dm_exec_requests
- sys.dm_exec_sessions
- sys.dm_os_waiting_tasks
- sys.dm_tran_locks
- Query Store 주요 집계
- Deadlock XML

### Oracle

- V$SESSION
- V$SQL
- V$SQLAREA
- V$SYSTEM_EVENT
- V$LOCK
- V$LOCKED_OBJECT

### Azure SQL Database

- Azure Monitor Metrics
- sys.dm_db_resource_stats
- sys.dm_exec_requests
- Query Store
- Auditing Logs

## 12. 향후 고도화 수집 항목

- 실행 계획 상세 Operation 비교
- 인덱스 사용률
- 통계 정보 변경 이력
- 테이블 및 인덱스 Fragmentation
- 용량 증가 예측 데이터
- 업무 배포 이력 연계 데이터
- 애플리케이션 APM Trace 연계 데이터
- CMDB 업무 영향도 데이터
- 보안 취약성 평가 결과
- AI 기반 장애 요약 학습 데이터
