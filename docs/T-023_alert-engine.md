# Alert Engine — 이벤트 생성·중복 억제

Last updated: 2026-05-27 KST

## 1. 구현 범위

- 최신 수집 데이터에 임계치 정책 적용
- severity(`WARN`, `CRITICAL`) 산정
- 알림 이벤트 생성
- 동일 DB/지표/severity 기준 중복 억제
- 알림 목록 조회와 확인 처리 API

## 2. 산출물

- `services/alert/index.ts`
- `app/api/alerts/route.ts`
- `app/api/alerts/evaluate/route.ts`
- `app/api/alerts/[id]/ack/route.ts`

## 3. 결정사항

메신저 발송 API 연동은 사용자 결정에 따라 보류합니다. 현재는 포털 내 알림 이벤트 생성·조회까지만 처리합니다.
