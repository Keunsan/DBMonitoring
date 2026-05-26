# API 스켈레톤 및 공통 응답 규약

Last updated: 2026-05-26 KST

## 1. 문서 목적

본 문서는 [development-plan.md](./development-plan.md)의 **T-007: API 스켈레톤 및 공통 응답 규약** 산출물을 요약합니다.

- 선행: [T-005_folder-structure.md](./T-005_folder-structure.md)
- 관련 아키텍처: [T-003_architecture.md](./T-003_architecture.md) §6 1차 API 경계
- 관련 보안: [T-004_security-checklist.md](./T-004_security-checklist.md) §5 T-007 API 규약
- Next.js 참고: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`

---

## 2. 공통 응답 형식

모든 API 응답은 아래 형식을 기본으로 합니다.

```ts
type ApiResponse<T> = {
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    requestId?: string;
    page?: number;
    pageSize?: number;
    total?: number;
    [key: string]: unknown;
  };
};
```

### 성공 응답

```json
{
  "data": {
    "status": "ok"
  },
  "error": null,
  "meta": {
    "requestId": "..."
  }
}
```

### 실패 응답

```json
{
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  },
  "meta": {
    "requestId": "..."
  }
}
```

사용자에게 노출되는 `error.message`는 한글로 작성하며, stack trace, 내부 경로, DB 연결 문자열, 원본 쿼리 등 민감 정보를 포함하지 않습니다.

---

## 3. 구현 파일

| 파일 | 역할 |
|------|------|
| `types/api.ts` | API 응답 타입 |
| `lib/api/response.ts` | `apiSuccess`, `apiFailure`, `jsonSuccess`, `jsonFailure` |
| `lib/api/errors.ts` | `ApiRouteError`, `badRequest`, `notFound`, `serviceUnavailable` |
| `lib/api/handler.ts` | `withApiHandler` 공통 Route Handler 래퍼 |
| `lib/api/pagination.ts` | `page`, `pageSize`, `offset` 파싱 및 meta 생성 |
| `lib/validation/index.ts` | JSON 객체 본문 검증 헬퍼 |
| `app/api/health/route.ts` | Health check API |
| `app/api/dev/erp-test/connection/route.ts` | 개발용 ERP 테스트 DB 연결 확인 API |

---

## 4. Route Handler 규칙

Route Handler는 Next.js App Router 규칙에 맞춰 `app/api/**/route.ts`에 정의합니다.

```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  return {
    data: {
      status: "ok",
    },
  };
});
```

**규칙**

- Route Handler는 `withApiHandler`로 감싸 성공/오류 응답을 표준화합니다.
- 예상 가능한 오류는 `ApiRouteError` 또는 `badRequest`, `notFound`, `serviceUnavailable` 헬퍼로 표현합니다.
- 알 수 없는 오류는 서버 로그에 `requestId`, 오류 이름, 메시지만 기록하고 사용자에게는 일반 한글 메시지를 반환합니다.
- DB 연결, 파일 시스템, 현재 시각 등 런타임 데이터가 있는 API는 `dynamic = "force-dynamic"`을 명시합니다.
- 운영 환경에서 개발용 API는 404로 숨깁니다.

---

## 5. Health API

`GET /api/health`

```json
{
  "data": {
    "status": "ok",
    "service": "dbmonitoring-api",
    "db": "not_configured",
    "timestamp": "2026-05-26T00:00:00.000Z"
  },
  "error": null,
  "meta": {
    "requestId": "..."
  }
}
```

`db` 값은 T-008/T-019에서 Supabase/PostgreSQL 연결이 확정되면 실제 상태로 확장합니다.

---

## 6. 페이징 규약

목록 API는 아래 query parameter를 사용합니다.

| 파라미터 | 기본값 | 최대값 | 설명 |
|----------|--------|--------|------|
| `page` | `1` | - | 1부터 시작하는 페이지 번호 |
| `pageSize` | `20` | `100` | 페이지당 항목 수 |

응답 meta:

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 120
}
```

---

## 7. 보안 기준

- 입력 검증 실패는 400과 한글 오류 메시지로 반환합니다.
- 인증/권한 검증은 T-009/T-010에서 `withApiHandler` 앞뒤로 확장합니다.
- 서버 로그에는 비밀번호, connection string, SQL 원문, token을 남기지 않습니다.
- 개발용 API는 production에서 404로 숨깁니다.
- 예상 가능한 외부 시스템 장애는 상세 원인 대신 사용자가 조치 가능한 메시지로 변환합니다.

---

## 8. 검증 결과

```bash
npm run lint
npm run build
```

두 명령 모두 통과했습니다.

---

## 9. 후속 작업

- T-008: 환경 변수 및 시크릿 관리 체계
- T-009/T-010: SSO, RBAC, 권한 middleware 확장
- T-011~T-027: 각 도메인 API에서 `withApiHandler`, `ApiRouteError`, 페이징 규약 재사용

---

## 10. 변경 이력

| 일자 | 변경 | TASK |
|------|------|------|
| 2026-05-26 | 최초 작성 — API 응답 규약, 공통 에러 핸들러, Health API 요약 | T-007 |
