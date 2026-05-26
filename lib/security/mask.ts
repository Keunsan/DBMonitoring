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

/**
 * host 값을 운영 로그에 남길 때 일부만 노출합니다.
 */
export const maskHost = (host: string | null | undefined): string => {
  if (!host) {
    return "";
  }

  const [firstPart, ...rest] = host.split(".");

  if (rest.length === 0) {
    return maskSecret(host);
  }

  return `${maskSecret(firstPart)}.${rest.map(() => "***").join(".")}`;
};

/**
 * 연결 문자열의 사용자명·비밀번호 구간을 마스킹합니다.
 */
export const maskConnectionString = (connectionString: string): string => {
  return connectionString.replace(
    /([a-z][a-z0-9+.-]*:\/\/)([^:@/]+)(:([^@/]*))?@/i,
    (_match, protocol: string, user: string) =>
      `${protocol}${maskSecret(user)}:${MASK}@`,
  );
};

/**
 * 로그 객체에서 민감 키 값을 일괄 마스킹합니다.
 */
export const maskSensitiveRecord = (
  record: Record<string, unknown>,
): Record<string, unknown> => {
  const sensitiveKeyPattern =
    /(password|secret|token|key|connection|string|credential)/i;

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (!sensitiveKeyPattern.test(key)) {
        return [key, value];
      }

      return [key, typeof value === "string" ? maskSecret(value) : MASK];
    }),
  );
};
