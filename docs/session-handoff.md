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
- **T-001~T-007 완료** (Phase 0 + Phase 1 API 스켈레톤)
- 폴더 구조: [T-005_folder-structure.md](./T-005_folder-structure.md)
- 공통 UI 레이아웃: [T-006_common-ui-layout.md](./T-006_common-ui-layout.md)
- API 응답 규약: [T-007_api-contract.md](./T-007_api-contract.md)
- Health API: `GET /api/health` — `{ data, error, meta }` + `requestId` 형식
- 포털 AppShell: `components/layout/*`, `/dashboard` 플레이스홀더

## 현재 목표

- **다음 작업: T-008** (환경 변수 및 시크릿 관리 체계)
- T-008 산출물: `.env.example`, README 환경 설정 절, secret ref 및 로그 마스킹 규칙

## Git 상태 (2026-05-26)

- 브랜치: `main`
- T-007 구현 후 커밋 전 — `git status`로 변경 파일 확인 필요

## 실행한 명령과 결과

- `npm install` — 성공
- `npx eslint "components/layout" "components/shared" "app/(portal)"` — 성공
- `npm run lint` — 성공
- `npm run build` — 성공
- T-007 후 `npm run lint`, `npm run build` — 성공

## 남은 작업과 다음 단계

1. **T-008**: `.env.example`, Supabase/SSO/ERP 테스트 DB 환경 변수 문서화
2. **T-009/T-010**: SSO/RBAC에서 `withApiHandler` 기반 권한 검증 확장
3. 필요 시 현재 T-007 변경사항 커밋

## 주의할 점

- `services/`는 React·클라이언트에서 import 금지
- DB·SSO 미연동 — Health API의 `db`는 `not_configured`
- Oracle/Azure Collector는 스텁(throw)

## 유용한 명령

```bash
npm run dev
npm run build
npm run lint
```
