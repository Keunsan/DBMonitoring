# 프로젝트 폴더 구조

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [T-003_architecture.md](./T-003_architecture.md), [T-002_data-model-outline.md](./T-002_data-model-outline.md), [T-004_security-checklist.md](./T-004_security-checklist.md)를 반영한 **저장소 디렉터리 규칙**과 **모듈 경계**를 정의합니다.

- 관련 TASK: [development-plan.md](./development-plan.md) **T-005**
- 후속: T-006(레이아웃), T-007(API 규약), T-008(환경 변수)

---

## 2. 최상위 구조

```text
dbmonitoring/
├── app/                    # Next.js App Router (페이지·API)
├── components/             # React UI (ui / layout / features)
├── hooks/                  # 클라이언트 커스텀 훅
├── lib/                    # 서버·클라이언트 공용 유틸 (보안·RBAC·API 등)
├── types/                  # 도메인·API 공유 TypeScript 타입
├── services/               # Collector / Processing / Alert (Worker 분리 가능)
├── scripts/                # Worker·배치·운영 스크립트
├── docs/                   # 설계·계획 문서
└── public/                 # 정적 자산
```

**경로 별칭:** `@/*` → 저장소 루트 (`tsconfig.json`)

---

## 3. `app/` — 라우팅

| 경로 | 용도 |
|------|------|
| `app/layout.tsx` | 루트 HTML·글로벌 스타일 |
| `app/page.tsx` | 임시 랜딩 (T-006 이후 `(portal)`로 이동 예정) |
| `app/(portal)/` | 인증 후 운영 포털 Route Group (레이아웃·메뉴는 T-006) |
| `app/(portal)/dashboard/` | 통합 현황 (T-028) |
| `app/(portal)/monitoring/` | 실시간 모니터링 화면 (T-029~) |
| `app/(portal)/admin/` | DB·사용자·알림 정책 관리 (T-035~) |
| `app/api/` | Route Handlers — REST API (T-007) |
| `app/api/health/` | Health check (T-007) |

**규칙**

- URL은 kebab-case (`/monitoring/sessions`).
- 페이지 컴포넌트 파일명은 `page.tsx`, 레이아웃은 `layout.tsx`.
- API는 `app/api/<resource>/route.ts` 또는 `app/api/<resource>/[id]/route.ts`.

---

## 4. `components/` — UI

| 경로 | 용도 |
|------|------|
| `components/ui/` | shadcn/ui 원자 컴포넌트 (수정 최소화) |
| `components/layout/` | AppShell, Sidebar, Header, PageHeader (T-006) |
| `components/shared/` | EmptyState, ErrorState, LoadingSkeleton, StatusBadge |
| `components/features/` | 화면별 조합 컴포넌트 (`dashboard/`, `monitoring/` 등) |

**네이밍**

- 파일명: **PascalCase** (`DatabaseStatusCard.tsx`)
- export: **화살표 함수** + named export
- 파일 상단: 한글 한 문장 개요 주석 + 주요 export에 JSDoc

---

## 5. `lib/` — 공통 모듈

| 경로 | 용도 | 보안(T-004) |
|------|------|-------------|
| `lib/utils.ts` | cn 등 UI 유틸 (기존) | — |
| `lib/constants/` | 메뉴·라우트·역할 상수 | — |
| `lib/api/` | API 응답 형식, Route Handler 헬퍼 | 오류 메시지 한글화 |
| `lib/validation/` | Zod 스키마·입력 검증 | SQL injection 방지 |
| `lib/security/` | 마스킹, secret ref | NFR-004 |
| `lib/rbac/` | 역할·DB scope 검증 | 서버 측 필수 |
| `lib/audit/` | 감사 로그 기록 | 고위험 작업 |
| `lib/auth/` | SSO·세션 (T-009) | — |
| `lib/db/` | Supabase/PostgreSQL 클라이언트 (T-008, T-019) | — |

**경계:** `lib/`는 UI에 의존하지 않습니다. `components/`에서 `lib/`를 import합니다.

---

## 6. `types/` — 공유 타입

| 파일 | 내용 |
|------|------|
| `types/domain.ts` | enum, 공통 식별자 (T-002 §8) |
| `types/entities.ts` | 운영·시계열 엔티티 인터페이스 |
| `types/api.ts` | `{ data, error, meta }` 응답 타입 |
| `types/index.ts` | re-export |

Collector 전용 payload는 `services/collector/types.ts`에 두고, 정규화 후 엔티티는 `types/entities.ts`와 맞춥니다.

---

## 7. `services/` — 백엔드 모듈 (Worker 분리 가능)

```text
services/
├── collector/
│   ├── adapters/
│   │   ├── mssql/          # 1차 구현 (T-015)
│   │   ├── oracle/         # 스텁 (T-014)
│   │   └── azure-sql/      # 스텁 (T-014)
│   ├── scheduler/          # 수집 스케줄 (T-016)
│   ├── types.ts            # CollectorAdapter 인터페이스
│   └── index.ts
├── processing/             # raw → 정규화 (T-021)
└── alert/                  # 임계치·이벤트 (T-023)
```

**실행:** `scripts/worker/collector.ts`에서 `services/collector`를 import해 별도 프로세스로 기동합니다 (T-016).

**규칙:** `services/*`는 React·Next.js `app/`에 import하지 않습니다. API Route는 `lib/` 또는 thin wrapper를 통해 호출합니다.

---

## 8. `hooks/` — 클라이언트 훅

| 예시 | 용도 |
|------|------|
| `hooks/use-mobile.ts` | 반응형 (기존) |
| `hooks/use-polling.ts` | 실시간 갱신 (T-025) |
| `hooks/use-db-scope.ts` | RBAC 기반 인스턴스 필터 (T-010) |

파일명: `use-<기능>.ts`, camelCase export.

---

## 9. `scripts/` — 운영 스크립트

| 경로 | 용도 |
|------|------|
| `scripts/worker/collector.ts` | Collector Worker 진입점 |
| `scripts/migrate/` | DB 마이그레이션 (T-019, 후속) |

---

## 10. Import 규칙

```text
app/(portal)/*  →  components/*, hooks/*, lib/*, types/*
app/api/*       →  lib/*, types/*, services/* (thin)
services/*      →  types/*, lib/security, lib/db (서버 전용)
components/*    →  components/ui, lib/utils, types/* (도메인 타입만)
```

**금지**

- `services/` → `components/` 또는 `app/` (역방향)
- `components/ui/` → `services/` 또는 `lib/db`
- 클라이언트 컴포넌트에서 `lib/db`, `services/` 직접 import

---

## 11. 코딩 규칙 요약

| 항목 | 규칙 |
|------|------|
| 컴포넌트 파일 | PascalCase.tsx |
| 훅·유틸 파일 | kebab-case 또는 camelCase (`use-mobile.ts`, `response.ts`) |
| 함수·컴포넌트 | 화살표 함수 |
| 주석 | 한글 개요 + 공개 API JSDoc |
| 사용자 메시지 | 한글 (오류·빈 상태·로딩) |
| 비밀 정보 | 코드·문서·로그에 금지, `connection_secret_ref`만 |

---

## 12. Phase별 추가 예정 경로

| Phase | 추가 경로 |
|-------|-----------|
| T-006 | `components/layout/*`, `app/(portal)/layout.tsx` |
| T-007 | `app/api/health/route.ts`, `lib/api/*` |
| T-008 | `.env.example`, `lib/db/supabase.ts` |
| T-009 | `app/api/auth/*`, `lib/auth/*` |
| T-015 | `services/collector/adapters/mssql/*` |
| T-019 | `supabase/migrations/` 또는 `scripts/migrate/` |

---

## 13. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — 디렉터리·모듈 경계·네이밍 규칙 | T-005 |
