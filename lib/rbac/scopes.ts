/** RBAC DB 인스턴스 scope 검증 스텁 (T-010에서 구현)입니다. */

import type { DbInstanceId } from "@/types/domain";

export type UserDbScope = {
  userId: string;
  dbInstanceIds: DbInstanceId[];
};

/**
 * 요청된 인스턴스 ID가 사용자 scope에 포함되는지 확인합니다.
 */
export const isDbInstanceAllowed = (
  scope: UserDbScope,
  dbInstanceId: DbInstanceId,
): boolean => scope.dbInstanceIds.includes(dbInstanceId);

/**
 * scope에 맞게 인스턴스 ID 목록을 필터링합니다.
 */
export const filterDbInstanceIds = (
  scope: UserDbScope,
  requestedIds: DbInstanceId[] | undefined,
): DbInstanceId[] => {
  if (!requestedIds || requestedIds.length === 0) {
    return scope.dbInstanceIds;
  }
  return requestedIds.filter((id) => isDbInstanceAllowed(scope, id));
};
