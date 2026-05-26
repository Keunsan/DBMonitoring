# DB 인스턴스 등록·수정·연결 테스트

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-012: DB 인스턴스 등록·수정·연결 테스트** 산출물을 요약합니다.

- Phase: 3 DB 인스턴스 관리
- PRD 매핑: FR-002, PRD §8.1 DB_INSTANCE
- 후속: T-013, T-015, T-028

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| API | `app/api/db-instances/route.ts` | DB 인스턴스 목록 조회, 등록 |
| API | `app/api/db-instances/[id]/route.ts` | DB 인스턴스 수정, 삭제 |
| API | `app/api/db-instances/[id]/test-connection/route.ts` | 등록 인스턴스 연결 테스트 |
| Store | `lib/inventory/store.ts` | DB_INSTANCE 개발용 메모리 저장소 |
| UI | `components/features/admin/DbInstanceManagementClient.tsx` | DB 인스턴스 등록 폼, 목록, 연결 테스트 버튼 |

---

## 3. DB 인스턴스 필드

| 필드 | 설명 |
|------|------|
| `dbmsType` | `MSSQL`, `ORACLE`, `AZURE_SQL` |
| `instanceName` | 표시용 인스턴스명 |
| `host`, `port` | 접속 대상 |
| `databaseName` | DB 이름 |
| `businessSystemId` | 업무 시스템 매핑 |
| `importance` | 중요도 |
| `envType` | `PROD`, `DEV`, `STG`, `DR` |
| `collectorType` | `AGENT`, `AGENTLESS`, `API` |
| `connectionSecretRef` | 실제 비밀번호 대신 secret 참조 |

---

## 4. 연결 테스트 정책

현재 개발 단계에서는 `MSSQL` + `connectionSecretRef = "env:ERP_TEST_DB"` 조합만 실제 연결 테스트를 수행합니다.

- 성공 시 `lastConnectionTestStatus = OK`
- 실패 시 `lastConnectionTestStatus = FAIL`
- 수집 상태(`lastCollectStatus`)는 실제 수집기 실행 시 갱신
- 사용자 메시지는 한글로 반환
- 실제 비밀번호와 connection string은 응답/로그에 노출하지 않음

Oracle/Azure SQL 연결 테스트는 T-017/T-018에서 어댑터가 준비된 뒤 확장합니다.

---

## 5. 보안 기준

- API 요청에는 비밀번호를 받지 않고 `connectionSecretRef`만 받습니다.
- 실제 DB 접속 정보는 `.env.local` 또는 Secret Provider에 둡니다.
- T-012의 운영 저장 방식은 T-008 결정에 따라 `env_local` 개발 모드에서 시작하고, 운영은 Supabase Vault 우선 검토 후 확정합니다.

---

## 6. 검증

```bash
npm run lint
npm run build
```

두 명령 모두 통과했습니다.

---

## 7. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — DB 인스턴스 API/UI와 MSSQL 연결 테스트 골격 | T-012 |
