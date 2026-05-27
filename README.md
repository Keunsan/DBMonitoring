# 통합 DB 모니터링 시스템

MSSQL·Oracle·Azure SQL 등 이기종 DB 환경의 통합 모니터링, 성능 분석, 알림을 위한 Next.js 16 기반 웹 애플리케이션입니다.

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, Recharts
- 백엔드·운영 DB: Supabase(PostgreSQL) 우선 (T-008~)
- 수집: `services/collector` Worker 모듈 (T-015~)

## 문서

| 문서 | 설명 |
|------|------|
| [docs/PRD.md](./docs/PRD.md) | 제품 요구사항 |
| [docs/development-plan.md](./docs/development-plan.md) | TASK별 개발 계획·진행 상태 |
| [docs/T-005_folder-structure.md](./docs/T-005_folder-structure.md) | 폴더·모듈 구조 (T-005) |
| [docs/T-008_environment-secrets.md](./docs/T-008_environment-secrets.md) | 환경 변수·시크릿 관리 (T-008) |
| [docs/T-011_business-system-master.md](./docs/T-011_business-system-master.md) | 업무 시스템 마스터 (T-011) |
| [docs/T-012_db-instance-management.md](./docs/T-012_db-instance-management.md) | DB 인스턴스 관리 (T-012) |
| [docs/T-013_collection-settings.md](./docs/T-013_collection-settings.md) | 수집 설정 (T-013) |
| [docs/session-handoff.md](./docs/session-handoff.md) | PC 간 작업 인수인계 |

## 폴더 구조 요약

```text
app/           # 페이지·API Route Handlers
components/    # ui, layout, shared, features
lib/           # api, auth, db, rbac, security, validation, audit
types/         # 도메인·API 공유 타입
services/      # collector, processing, alert
scripts/       # worker·마이그레이션
docs/          # 설계 문서
```

상세 규칙은 [docs/T-005_folder-structure.md](./docs/T-005_folder-structure.md)를 참고하세요.

## 시작하기

```bash
npm install
cp .env.example .env.local
npm run dev
```

- 개발 서버: [http://localhost:3000](http://localhost:3000)
- Health API: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- 포털 대시보드(플레이스홀더): [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- DB 인스턴스 관리: [http://localhost:3000/admin/db-instances](http://localhost:3000/admin/db-instances)

## 환경 설정

환경 변수 템플릿은 `.env.example`을 기준으로 관리합니다. 실제 secret 값은 `.env.local` 또는 배포 환경의 Secret Manager에만 설정하고 Git에 커밋하지 않습니다.

주요 환경 변수:

| 영역 | 주요 키 |
|------|---------|
| App | `APP_ENV`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `LOG_LEVEL` |
| Supabase/DB | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` |
| Secret | `SECRET_PROVIDER`, `SECRET_KEY_PREFIX` |
| SSO/Auth | `SSO_PROVIDER`, `SSO_ISSUER_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `AUTH_SESSION_SECRET` |
| ERP 테스트 DB | `ERP_TEST_DB_HOST`, `ERP_TEST_DB_NAME`, `ERP_TEST_DB_USER`, `ERP_TEST_DB_PASSWORD` |
| Collector/알림 | `COLLECTOR_ID`, `SMTP_HOST`, `SMTP_PASSWORD`, `TEAMS_WEBHOOK_URL` |

상세 기준은 [docs/T-008_environment-secrets.md](./docs/T-008_environment-secrets.md)를 참고하세요.

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 코딩 규칙

- `.cursor/rules/project-rules.mdc`, `AGENTS.md` 참고
- 컴포넌트: PascalCase 파일, 화살표 함수, 한글 JSDoc
- Next.js API 변경 시 `node_modules/next/dist/docs/` 확인

## 현재 진행

Phase 2는 일시 보류하고 Phase 3 DB 인스턴스 관리(T-011~T-013)를 선진행했습니다. 다음 권장 작업은 T-014(Collector 어댑터 인터페이스)입니다. 진행률은 `docs/development-plan.md` §4.2를 확인하세요.
