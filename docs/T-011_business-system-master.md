# 업무 시스템·담당자 마스터 API/UI

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-011: 업무 시스템·담당자 마스터 API/UI** 산출물을 요약합니다.

- Phase: 3 DB 인스턴스 관리
- PRD 매핑: FR-002, 화면 구성안 §3.21
- 후속: T-012 DB 인스턴스 등록·수정·연결 테스트

---

## 2. 구현 범위

| 영역 | 산출물 | 설명 |
|------|--------|------|
| API | `app/api/business-systems/route.ts` | 업무 시스템 목록 조회, 등록 |
| API | `app/api/business-systems/[id]/route.ts` | 업무 시스템 수정, 삭제 |
| Store | `lib/inventory/store.ts` | 개발용 메모리 저장소와 입력 검증 |
| UI | `components/features/admin/DbInstanceManagementClient.tsx` | 업무 시스템 등록 폼 |
| Page | `app/(portal)/admin/db-instances/page.tsx` | 시스템 관리 > DB 인스턴스 관리 화면 |

---

## 3. 데이터 항목

| 필드 | 설명 |
|------|------|
| `code` | 업무 시스템 코드, 대문자 정규화 |
| `name` | 업무 시스템명 |
| `importance` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `ownerDept` | 담당 부서 |
| `ownerName` | 담당자 |
| `ownerEmail` | 담당자 이메일 |

---

## 4. API 규약

### `GET /api/business-systems`

업무 시스템 목록을 `{ data, error, meta }` 형식으로 반환합니다.

### `POST /api/business-systems`

업무 시스템을 등록합니다. 중복 `code`는 `400 BAD_REQUEST`로 처리합니다.

### `PATCH /api/business-systems/{id}`

업무 시스템 정보를 수정합니다.

### `DELETE /api/business-systems/{id}`

업무 시스템을 삭제합니다. DB 인스턴스가 연결된 업무 시스템은 삭제하지 않고 `409 BUSINESS_SYSTEM_IN_USE`를 반환합니다.

---

## 5. 보류된 Phase 2 영향

T-010 RBAC가 보류되어 현재 API는 인증/권한 차등을 적용하지 않았습니다. Route Handler는 T-007의 `withApiHandler` 규약을 사용하므로 T-010 재개 시 서버 측 권한 검증을 추가할 수 있습니다.

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
| 2026-05-26 | 최초 작성 — 업무 시스템 API/UI 골격 | T-011 |
