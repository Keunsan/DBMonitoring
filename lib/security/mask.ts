/** 민감 정보 마스킹 유틸입니다 (T-004, T-021 SQL Text 마스킹 연동). */

const MASK = "••••••••";

/**
 * 로그·화면에 노출할 문자열을 마스킹합니다.
 */
export const maskSecret = (value: string | null | undefined): string => {
  if (!value || value.length === 0) {
    return "";
  }
  if (value.length <= 4) {
    return MASK;
  }
  return `${value.slice(0, 2)}${MASK}${value.slice(-2)}`;
};

/**
 * connection_secret_ref 등 참조 키만 로그에 남깁니다.
 */
export const formatSecretRefForLog = (ref: string): string =>
  `secret_ref:${ref.slice(0, 8)}…`;
