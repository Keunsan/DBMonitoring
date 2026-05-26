/** 임계치 평가·알림 이벤트 생성 스텁 (T-023에서 구현)입니다. */

export type AlertEvaluationResult = {
  eventsCreated: number;
  suppressed: number;
};

/**
 * 최신 지표에 대해 알림 정책을 평가합니다 (스텁).
 */
export const evaluateAlertPolicies = async (): Promise<AlertEvaluationResult> => ({
  eventsCreated: 0,
  suppressed: 0,
});
