# Session Handoff

Last updated: 2026-05-26 KST

이 문서는 같은 Cursor 계정으로 여러 PC에서 작업을 이어가기 위한 인수인계 문서입니다. Cursor 채팅이 PC 간 자동 동기화된다고 가정하지 말고, GitHub의 코드 상태와 이 문서를 기준으로 이어갑니다.

## 저장소

- GitHub: https://github.com/Keunsan/dbmonitoring.git
- 브랜치: `main`

처음 받을 때:

```bash
git clone https://github.com/Keunsan/dbmonitoring.git
```

이미 클론한 PC에서는 `git pull`만 하면 됩니다.

## 다른 PC에서 이어가기

1. 저장소를 최신 상태로 맞춥니다 (`git clone` 또는 `git pull`).
2. Cursor에서 저장소를 열고 `docs/session-handoff.md`를 확인합니다.
3. 새 채팅에서 아래 문장을 사용합니다.

```text
docs/session-handoff.md 문서를 기준으로 현재 작업을 이어서 진행해줘.
먼저 git status를 확인하고, 이 문서와 실제 repo 상태가 다른 부분이 있으면 알려줘.
그 다음 현재 목표, 남은 작업, 다음에 수정해야 할 파일을 요약해줘.
```

## 현재 프로젝트 상태

- Framework: Next.js `16.2.6`, React `19.2.4`
- Styling/UI: Tailwind CSS `4`, Shadcn/ui
- Lint: ESLint `9` + `eslint-config-next` `16.2.6` (Next/TS 규칙 기반)
- **T-001~T-008 완료**, **T-011~T-013 완료** (Phase 2 보류, Phase 3 선진행)
- 폴더 구조: [T-005_folder-structure.md](./T-005_folder-structure.md)
- 공통 UI 레이아웃: [T-006_common-ui-layout.md](./T-006_common-ui-layout.md)
- API 응답 규약: [T-007_api-contract.md](./T-007_api-contract.md)
- 환경 변수·시크릿: [T-008_environment-secrets.md](./T-008_environment-secrets.md)
- 업무 시스템 마스터: [T-011_business-system-master.md](./T-011_business-system-master.md)
- DB 인스턴스 관리: [T-012_db-instance-management.md](./T-012_db-instance-management.md)
- 수집 설정: [T-013_collection-settings.md](./T-013_collection-settings.md)
- Health API: `GET /api/health` — `{ data, error, meta }` + `requestId` 형식
- 포털 AppShell: `components/layout/*`, `/dashboard`, `/admin/db-instances`

## 현재 목표

- **다음 작업: T-014** (Collector 어댑터 인터페이스 설계)
- Phase 2(T-009~T-010)는 사용자 요청으로 일단 보류

## Git 상태 (2026-05-26)

- 브랜치: `main`
- T-011~T-013 구현 후 커밋 전 — `git status`로 변경 파일 확인 필요

## 실행한 명령과 결과

- `npm install` — 성공
- `npx eslint "components/layout" "components/shared" "app/(portal)"` — 성공
- `npm run lint` — 성공
- `npm run build` — 성공
- T-007 후 `npm run lint`, `npm run build` — 성공
- T-008 후 `npm run lint`, `npm run build` — 성공
- T-011~T-013 후 `npm run lint`, `npm run build` — 성공

## 남은 작업과 다음 단계

1. **T-014**: Collector 어댑터 인터페이스와 registry 정리
2. **T-015**: MSSQL Collector MVP에서 `env:ERP_TEST_DB` 기반 연결 테스트 흐름 재사용
3. Phase 2 재개 시 T-009/T-010 인증·RBAC 연결

## 주의할 점

- `services/`는 React·클라이언트에서 import 금지
- 실제 `.env.local` 값은 문서/로그/커밋에 남기지 않음
- DB·SSO 미연동 — Health API의 `db`는 환경 변수 설정 상태만 표시
- T-011~T-013 API/UI는 개발용 메모리 저장소 기반이며 운영 DB 저장은 T-019에서 확정
- T-010 보류로 DB 관리 API의 역할별 권한 검증은 아직 미적용
- Oracle/Azure Collector는 스텁(throw)

## 유용한 명령

```bash
npm run dev
npm run build
npm run lint
```
