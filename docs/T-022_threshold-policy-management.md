# 임계치 정책 관리

Last updated: 2026-05-27 KST

## 1. 구현 범위

- 기본 추천 임계치 정책 제공
- 업무 시스템별/DB 인스턴스별 override 구조
- 정책 우선순위: `DB_INSTANCE > BUSINESS_SYSTEM > GLOBAL`
- 정책 목록/등록/삭제 API
- 시스템 관리 > 임계치 정책 관리 화면

## 2. 산출물

- `services/alert/index.ts`
- `app/api/threshold-policies/*`
- `components/features/admin/ThresholdPolicyManagementClient.tsx`
- `app/(portal)/admin/threshold-policies/page.tsx`

## 3. 결정사항

SSO/RBAC는 보류하고 로그인 없는 내부 테스트 모드로 동작합니다. 정책 저장은 현재 메모리 기반입니다.
