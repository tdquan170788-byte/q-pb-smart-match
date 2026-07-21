export function normalizePair(
  firstMemberId: string,
  secondMemberId: string
): [string, string] {
  return firstMemberId.localeCompare(secondMemberId) <= 0
    ? [firstMemberId, secondMemberId]
    : [secondMemberId, firstMemberId];
}

export function createPairKey(
  firstMemberId: string,
  secondMemberId: string
): string {
  const [memberAId, memberBId] = normalizePair(
    firstMemberId,
    secondMemberId
  );

  return `${memberAId}__${memberBId}`;
}
