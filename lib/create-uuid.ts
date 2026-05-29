/** Supabase UUID 컬럼용 식별자를 생성합니다. */

/**
 * PostgreSQL uuid 타입에 맞는 식별자를 반환합니다.
 */
export const createUuid = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  const random = () =>
    Math.floor(Math.random() * 0x1_0000)
      .toString(16)
      .padStart(4, "0");

  return `${random()}${random()}-${random()}-4${random().slice(1)}-${random()}-${random()}${random()}${random()}`;
};
