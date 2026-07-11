export const BYE_MEMBER_ID = "__BYE__";

export function makePairKey(memberAId: string, memberBId: string): string {
  return [memberAId, memberBId].sort().join("__");
}

export function makeTeamKey(memberIds: string[]): string {
  return [...memberIds].sort().join("__");
}

export function rotateArray<T>(items: T[], shift: number): T[] {
  if (items.length === 0) {
    return [];
  }

  const normalizedShift =
    ((shift % items.length) + items.length) % items.length;

  return [
    ...items.slice(normalizedShift),
    ...items.slice(0, normalizedShift),
  ];
}

export function countSharedMemberIds(
  firstMemberIds: string[],
  secondMemberIds: string[]
): number {
  const secondMemberIdSet = new Set(secondMemberIds);

  return firstMemberIds.filter((memberId) =>
    secondMemberIdSet.has(memberId)
  ).length;
}

export function sameMemberIds(
  firstMemberIds: string[],
  secondMemberIds: string[]
): boolean {
  if (firstMemberIds.length !== secondMemberIds.length) {
    return false;
  }

  const firstSorted = [...firstMemberIds].sort();
  const secondSorted = [...secondMemberIds].sort();

  return firstSorted.every(
    (memberId, index) => memberId === secondSorted[index]
  );
}

export function uniqueMemberIds(memberIds: string[]): string[] {
  return [...new Set(memberIds.filter(Boolean))];
}

export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
