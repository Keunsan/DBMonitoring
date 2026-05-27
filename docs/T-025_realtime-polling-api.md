# 실시간 조회 API

Last updated: 2026-05-27 KST

## 1. 구현 범위

- WebSocket/SSE 대신 10초 polling 기반 실시간 조회
- Collector 수동 실행 후 최신 메모리 데이터를 조회
- DB별 최신 지표, 세션, SQL, Blocking, Deadlock 요약 제공

## 2. 산출물

- `app/api/monitoring/summary/route.ts`
- `app/api/monitoring/blocking/route.ts`
- `app/api/monitoring/deadlocks/route.ts`
- 기존 `metrics`, `sessions`, `sql`, `runs` 조회 API

## 3. 결정사항

운영 DB 영구 저장은 보류하고, 내부 테스트 중에는 실시간 수집·조회 결과를 화면에 표시합니다.
