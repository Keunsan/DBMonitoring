# 환경 변수 및 시크릿 관리 체계

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-008: 환경 변수 및 시크릿 관리 체계** 산출물을 요약합니다.

- 선행: [T-004_security-checklist.md](./T-004_security-checklist.md), [T-005_folder-structure.md](./T-005_folder-structure.md)
- 후속: T-009(SSO), T-011(메타 API), T-015(Collector)
- 산출물: `.env.example`, `lib/env/*`, `lib/security/*`, README 환경 설정 절

---

## 2. 기본 원칙

- 실제 비밀 값은 `.env.local` 또는 배포 환경 Secret Manager에만 둡니다.
- `.env.local`, `.env.production`, `.env.*`는 Git에 커밋하지 않습니다.
- `.env.example`은 키 이름, 기본값, 설명만 포함하고 실제 값을 포함하지 않습니다.
- 운영 DB에는 DB 접속 문자열 또는 비밀번호를 저장하지 않고 `connection_secret_ref`만 저장합니다.
- 로그에는 비밀번호, token, API key, connection string, SQL literal을 남기지 않습니다.

---

## 3. 파일 구성

| 파일 | 역할 |
|------|------|
| `.env.example` | 개발/운영 환경 변수 템플릿 |
| `.gitignore` | `.env*` ignore + `.env.example` 예외 |
| `lib/env/index.ts` | 환경 변수 읽기, 필수 변수 검증, Secret Provider 설정 |
| `lib/security/mask.ts` | secret, host, connection string, 민감 로그 객체 마스킹 |
| `lib/db/index.ts` | 운영 DB 환경 변수 설정 상태 확인 |

---

## 4. 필수/주요 환경 변수

### 4.1 App / Runtime

| 키 | 예시 | 설명 |
|----|------|------|
| `APP_ENV` | `development` | `development`, `test`, `staging`, `production` |
| `NEXT_PUBLIC_APP_NAME` | `통합 DB 모니터링` | 화면 표시용 앱 이름 |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | 외부 접근 URL |
| `LOG_LEVEL` | `info` | 로그 레벨 |

### 4.2 Supabase / 운영 DB

| 키 | 필수 환경 | Secret | 설명 |
|----|-----------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | staging, production | 아니오 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | staging, production | 예 | 브라우저용 Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging, production | 예 | 서버 전용 service role key |
| `DATABASE_URL` | production | 예 | 서버 전용 PostgreSQL 연결 문자열 |

### 4.3 Secret Provider

| 키 | 기본값 | 설명 |
|----|--------|------|
| `SECRET_PROVIDER` | `env_local` | `supabase_vault`, `kms`, `internal_secret_manager`, `env_local` |
| `SECRET_KEY_PREFIX` | `dbmonitoring` | Secret ref prefix |

**결정:** 1차 개발/로컬은 `env_local`, 운영 후보는 Supabase Vault 우선 검토. 최종 결정은 T-012 DB 인스턴스 접속 정보 저장 시 확정합니다.

### 4.4 SSO / Auth

| 키 | Secret | 설명 |
|----|--------|------|
| `SSO_PROVIDER` | 아니오 | `mock`, `oidc`, `saml`, `ad` 등 |
| `SSO_ISSUER_URL` | 아니오 | OIDC/SAML issuer |
| `SSO_CLIENT_ID` | 아니오 | SSO client id |
| `SSO_CLIENT_SECRET` | 예 | SSO client secret |
| `SSO_CALLBACK_URL` | 아니오 | 인증 callback URL |
| `AUTH_SESSION_SECRET` | 예 | 세션 서명/암호화 secret |
| `AUTH_COOKIE_NAME` | 아니오 | 세션 쿠키명 |

### 4.5 ERP 테스트 DB / 개발용

| 키 | Secret | 설명 |
|----|--------|------|
| `ERP_TEST_DB_HOST` | 아니오 | 개발용 ERP 테스트 DB host |
| `ERP_TEST_DB_PORT` | 아니오 | 기본 `1433` |
| `ERP_TEST_DB_NAME` | 아니오 | DB 이름 |
| `ERP_TEST_DB_USER` | 예 | DB 사용자 |
| `ERP_TEST_DB_PASSWORD` | 예 | DB 비밀번호 |
| `ERP_TEST_DB_ENCRYPT` | 아니오 | TLS encrypt |
| `ERP_TEST_DB_TRUST_SERVER_CERTIFICATE` | 아니오 | 개발 인증서 허용 |
| `ERP_TEST_DB_CONNECTION_TIMEOUT_MS` | 아니오 | 연결 timeout |
| `ERP_TEST_DB_REQUEST_TIMEOUT_MS` | 아니오 | query timeout |

개발용 ERP API는 `NODE_ENV=production`에서 404로 숨깁니다.

### 4.6 Collector / Notification

| 키 | Secret | 설명 |
|----|--------|------|
| `COLLECTOR_ID` | 아니오 | Collector 식별자 |
| `COLLECTOR_DEFAULT_INTERVAL_SEC` | 아니오 | 기본 수집 주기 |
| `COLLECTOR_SQL_AGGREGATE_INTERVAL_SEC` | 아니오 | SQL 집계 주기 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_FROM` | 일부 | Email 발송 설정 |
| `SMTP_PASSWORD` | 예 | SMTP 비밀번호 |
| `TEAMS_WEBHOOK_URL` | 예 | Teams webhook |

---

## 5. 로그 마스킹 규칙

`lib/security/mask.ts`에서 아래 헬퍼를 제공합니다.

| 함수 | 용도 |
|------|------|
| `maskSecret` | token, user, password 등 값 일부만 노출 |
| `formatSecretRefForLog` | `connection_secret_ref` 참조 키만 로그에 남김 |
| `maskHost` | host 일부만 노출 |
| `maskConnectionString` | 연결 문자열 user/password 마스킹 |
| `maskSensitiveRecord` | 객체 내 민감 key 값을 일괄 마스킹 |

금지:

- raw `process.env` 객체 로그 출력
- DB connection string 로그 출력
- SSO token / API key / password / SQL literal 출력

---

## 6. 검증 규칙

`lib/env/index.ts`는 실행 환경별 필수 환경 변수 누락 여부를 검증합니다.

```ts
const result = validateRequiredEnv();
if (!result.ok) {
  // result.missingKeys를 사용자에게 안전하게 안내
}
```

현재 기준:

- `development`: 필수 없음, 필요한 기능별로 개별 검증
- `staging`: Supabase URL/publishable key/service role, `AUTH_SESSION_SECRET`
- `production`: staging 필수 + `DATABASE_URL`

---

## 7. 로컬 설정 절차

1. `.env.example`을 참고해 `.env.local`을 생성합니다.
2. 필요한 기능에 해당하는 키만 채웁니다.
3. DB/SSO/API Key 값은 문서나 코드에 복사하지 않습니다.
4. `npm run dev`를 재시작합니다.
5. `/api/health` 또는 개발용 `/api/dev/erp-test/connection`으로 설정 상태를 확인합니다.

---

## 8. 후속 작업

- T-009: SSO Provider별 필수 환경 변수 확정
- T-012: DB 인스턴스 접속 정보의 `connection_secret_ref` 저장/조회 방식 확정
- T-019: Supabase/PostgreSQL 연결 클라이언트와 migration 설정
- T-024: Email/Teams 알림 Secret 사용 방식 확정

---

## 9. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — 환경 변수 템플릿, Secret Provider, 로그 마스킹 규칙 | T-008 |
