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

## PC를 바꾸기 전 업데이트 요청

기본 요청:

```text
현재 세션을 종료하기 전에 `docs/session-handoff.md`를 최신 작업 인수인계 문서로 업데이트해줘.
다른 PC에서 바로 이어받을 수 있도록 실제 git 상태와 변경 내용을 확인해서 정리해줘.
```

문서 업데이트 후 커밋/푸시까지 맡길 때:

```text
PC를 바꾸려고 해. 현재 작업 상태를 `docs/session-handoff.md`에 인수인계용으로 업데이트하고, 커밋/푸시까지 해줘.
```

## 현재 프로젝트 상태

- Git remote: local `origin` may still point to `https://github.com/Keunsan/prj_dbmonitoring.git`, but GitHub redirects to `https://github.com/Keunsan/dbmonitoring.git`
- Repository root: `dbmonitoring`
- App directory: repository root
- Framework: Next.js `16.2.6`, React `19.2.4`, Tailwind CSS `4`
- 주요 파일: `app/page.tsx`, `app/layout.tsx`, `app/globals.css`, `package.json`
- 현재 앱은 아직 `create-next-app` 기본 scaffold에 가까운 상태이며, `app/page.tsx`도 기본 시작 화면입니다.
- `AGENTS.md`에 따라 Next.js 관련 코드 수정 전에는 필요 시 `node_modules/next/dist/docs/` 문서를 확인합니다.
- 2026-05-26 02:10 KST 기준 Phase 0 작업 커밋은 `e36df02 2605260208_T-004`이며, 이후 PC 이동용 handoff 갱신 커밋이 추가됩니다.

## 현재 결정 사항

- 여러 PC 작업 연속성은 GitHub와 `docs/session-handoff.md`를 기준으로 관리합니다.
- Shared Transcripts는 링크 기반 공유용 보조 수단이며, 기본 동기화 방식으로 사용하지 않습니다.
- Cursor Chat Transfer는 전체 채팅 export/import가 꼭 필요할 때만 사용합니다.
- `docs` 하위 문서는 통합 DB 모니터링 시스템의 제안, 요구사항, 화면 설계, 수집 항목 정의를 담은 개발 기준 문서로 사용합니다.
- **개발 실행 계획**은 [development-plan.md](./development-plan.md)에서 TASK 단위로 관리합니다. AGENT 작업 시 PRD + development-plan을 함께 참조합니다.
- 1차 개발은 문서 기준상 통합 대시보드, DB 실시간 현황, 세션, Blocking, Deadlock, Wait, Top SQL, 실시간 알림, DB 인스턴스 관리, 사용자 및 권한 관리를 MVP 범위로 보는 것이 자연스럽습니다.
- 개발 시에는 시큐어 코딩 원칙을 필수 기준으로 적용하고, `docs/02_requirements_definition.md`의 NFR-004 보안 요구사항을 우선 확인합니다.

## 현재 목표

- Phase 0 기준 정리 완료. **T-001~T-004 완료**.
- T-001: [T-001_mvp-scope.md](./T-001_mvp-scope.md)
- T-002: [T-002_data-model-outline.md](./T-002_data-model-outline.md)
- T-003: [T-003_architecture.md](./T-003_architecture.md)
- T-004: [T-004_security-checklist.md](./T-004_security-checklist.md)
- 다음 작업: **T-005** (프로젝트 폴더 구조 및 공통 모듈 설계)
- 애플리케이션 코드 변경 없음.

## Git 상태 (2026-05-26 02:10 KST)

- 현재 브랜치: `main`
- 원격 저장소: local `origin https://github.com/Keunsan/prj_dbmonitoring.git`, canonical `https://github.com/Keunsan/dbmonitoring.git`
- `git status --short`: PC 이동 전 최종 커밋/푸시 후 clean 상태로 맞춥니다.
- 최근 작업 커밋: `e36df02 2605260208_T-004`

## 이번 세션에서 확인한 내용

- `docs/01_proposal_outline.md`: 사업 배경, 제안 범위, 3단계 구축 로드맵이 정의되어 있다.
- `docs/02_requirements_definition.md`: BR/FR/NFR, 권한 모델, 데이터 보관, 연계 요구사항이 정의되어 있다.
- `docs/03_screen_design_outline.md`: 메뉴 구조, 주요 화면, 대시보드 위젯, 역할별 화면 권한, 우선 구축 화면이 정의되어 있다.
- `docs/04_db_collection_items.md`: MSSQL, Oracle, Azure SQL Database의 공통/DBMS별 수집 항목, 수집 주기, 알림 기준, 정규화 모델, 보관 정책, 1차 우선 수집 항목이 정의되어 있다.

## 권장 개발 순서

1. 메타/관리 기반: DB 인스턴스, 업무 시스템, 담당자, 수집 설정, 사용자/RBAC 모델을 먼저 정의한다.
2. Collector MVP: 우선 MSSQL Agentless 수집부터 시작하고, `docs/04_db_collection_items.md`의 1차 우선 수집 항목을 기준으로 연결 상태, 세션, Wait, Blocking, Deadlock, Top SQL을 수집한다.
3. 저장/정규화: `tenant_id`, `db_instance_id`, `dbms_type`, `business_system_id`, `metric_time` 기반의 공통 모델을 설계한다.
4. 이벤트/알림: 성능, 장애, SQL, 보안 알림 기준을 임계치 정책으로 구현하고 중복 억제 정책을 포함한다.
5. 웹 1차 화면: 통합 현황 대시보드, DB 실시간 현황, 실시간 세션, Blocking, Wait, Top SQL, 실시간 알림 화면부터 구현한다.
6. 이후 Oracle/Azure SQL 어댑터, SQL 상세/Plan 변경/이슈/리포트, 보안/계정/권한 모니터링 순서로 확장한다.

## 실행한 명령과 결과

- `git status --short`: 출력 없음, working tree clean.
- `git branch --show-current`: `main`.
- `git remote -v`: local `origin https://github.com/Keunsan/prj_dbmonitoring.git`.
- `git log -3 --oneline`: 최근 커밋은 `bdf00bb Update session handoff for PC transfer`, `e36df02 2605260208_T-004`, `0bb5124 test`.
- `git push origin main`: 성공. GitHub가 새 위치 `https://github.com/Keunsan/dbmonitoring.git`를 안내함.

## 남은 작업과 다음 단계

- 다음 작업은 [development-plan.md](./development-plan.md)의 **T-005: 프로젝트 폴더 구조 및 공통 모듈 설계**입니다.
- T-005에서는 `app/`, `components/`, `lib/`, `hooks/`, `types/`, Collector/Worker 후보 구조와 공통 보안·RBAC·검증 모듈 경계를 설계합니다.
- API 목록, DB 스키마 또는 DDL, Collector 인터페이스를 문서화하거나 바로 코드로 시작한다.
- Next.js 코드 수정 전에는 `AGENTS.md` 지침에 따라 필요 시 Next.js 16 문서를 확인한다.
- 인증, 권한, DB 접속, SQL 조회, 수집 설정, 알림 정책, 관리자 기능을 구현할 때는 서버 측 검증, 권한 확인, 감사 로그, 민감 정보 마스킹을 함께 설계한다.
- 실제 구현을 시작하면 `npm run lint`, 필요 시 `npm run build`를 실행하고 결과를 이 문서에 갱신한다.

## 주의할 점 또는 blocker

- 현재 저장소는 Next.js 기본 scaffold에 가까워 문서 대비 구현 격차가 크다.
- DB 접속 정보 저장, SQL Text 마스킹, 권한 기반 접근 제어, 보관 정책은 초기 설계에서 빠뜨리면 나중에 수정 범위가 커진다.
- SQL 문자열 결합, 클라이언트 숨김 처리에 의존한 권한 통제, 로그 내 비밀 정보 출력, 상세 오류 노출은 금지해야 한다.
- Oracle ASH/AWR 사용은 라이선스 검토가 필요하다.
- Azure SQL 수집은 Azure Monitor/Resource Graph 권한과 API 호출 제한을 별도로 고려해야 한다.
- 현재 세션에서는 테스트나 빌드를 실행하지 않았다.

## 업데이트할 핵심 항목

PC를 바꾸기 전 이 문서에 아래 내용을 최신화합니다.

- 현재 목표
- 이번 세션에서 변경한 파일
- 중요한 결정 사항
- 실행한 명령/테스트 결과
- 남은 작업과 다음 단계
- 주의할 점 또는 blocker

## 유용한 명령

저장소 루트에서:

```bash
npm run dev
npm run build
npm run lint
```

Git 작업:

```bash
git status
git pull
git add docs/session-handoff.md
git commit -m "Update session handoff"
git push
```