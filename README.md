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
npm run dev
```

- 개발 서버: [http://localhost:3000](http://localhost:3000)
- Health API: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- 포털 대시보드(플레이스홀더): [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

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

Phase 1 기반 설계 — T-006(공통 UI 레이아웃) 완료 후 T-007(API 스켈레톤) 착수 예정. 진행률은 `docs/development-plan.md` §4.2를 확인하세요.
