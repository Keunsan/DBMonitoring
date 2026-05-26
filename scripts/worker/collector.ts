/**
 * Collector Worker 진입점 (T-016).
 * 실행: npx tsx scripts/worker/collector.ts (tsx 설치 후) 또는 package.json script 추가
 */

import { listSchedulerStatuses } from "@/services/collector";

const main = async () => {
  const statuses = listSchedulerStatuses();
  console.info(
    "[collector-worker] 시작 — 스케줄 대상:",
    statuses.length,
    "건 (T-016에서 구현)",
  );
};

main().catch((err: unknown) => {
  console.error("[collector-worker] 오류:", err);
  process.exit(1);
});
