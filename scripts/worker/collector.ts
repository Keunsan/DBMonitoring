/**
 * Collector Worker 진입점 (T-016).
 * 실행: npx tsx scripts/worker/collector.ts (tsx 설치 후) 또는 package.json script 추가
 */

import { listSchedulerStatuses, runCollectorOnce } from "@/services/collector";

/** Collector를 한 번 실행하고 실행 상태 요약을 출력합니다. */
const main = async () => {
  const results = await runCollectorOnce();
  const statuses = await listSchedulerStatuses();

  console.info(
    "[collector-worker] 수집 완료:",
    results.length,
    "건 / 스케줄 대상:",
    statuses.length,
    "건",
  );
};

main().catch((err: unknown) => {
  console.error("[collector-worker] 오류:", err);
  process.exit(1);
});
