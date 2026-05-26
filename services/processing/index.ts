/** 수집 raw payload → 정규화 엔티티 변환 (T-021에서 구현)입니다. */

export type ProcessingResult = {
  accepted: number;
  rejected: number;
};

/**
 * Collector payload 배치를 정규화·저장 큐에 적재합니다 (스텁).
 */
export const processCollectorBatch = async (): Promise<ProcessingResult> => ({
  accepted: 0,
  rejected: 0,
});
