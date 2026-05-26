/** SSO·세션 모듈 진입점 (T-009에서 구현)입니다. */

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  roleCodes: string[];
};
