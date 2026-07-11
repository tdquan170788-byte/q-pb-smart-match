import type { GeneratedRound, ScheduledMatch } from "@/types";

function hasUniqueMemberIds(memberIds: string[]): boolean {
  return new Set(memberIds).size === memberIds.length;
}

export function isValidTeam(
  memberIds: string[],
  expectedMemberCount = 2
): boolean {
  if (memberIds.length !== expectedMemberCount) {
    return false;
  }

  if (memberIds.some((memberId) => !memberId.trim())) {
    return false;
  }

  return hasUniqueMemberIds(memberIds);
}

export function isValidScheduledMatch(match: ScheduledMatch): boolean {
  if (!Number.isInteger(match.round) || match.round <= 0) {
    return false;
  }

  if (!Number.isInteger(match.court) || match.court <= 0) {
    return false;
  }

  if (!isValidTeam(match.teamAMemberIds)) {
    return false;
  }

  if (!isValidTeam(match.teamBMemberIds)) {
    return false;
  }

  const allPlayingMemberIds = [
    ...match.teamAMemberIds,
    ...match.teamBMemberIds,
  ];

  return hasUniqueMemberIds(allPlayingMemberIds);
}

export function isValidGeneratedRound(round: GeneratedRound): boolean {
  if (!Number.isInteger(round.round) || round.round <= 0) {
    return false;
  }

  if (!Array.isArray(round.matches)) {
    return false;
  }

  if (!Array.isArray(round.restingMemberIds)) {
    return false;
  }

  if (!hasUniqueMemberIds(round.restingMemberIds)) {
    return false;
  }

  const usedCourtNumbers = new Set<number>();
  const playingMemberIds: string[] = [];

  for (const match of round.matches) {
    if (!isValidScheduledMatch(match)) {
      return false;
    }

    if (match.round !== round.round) {
      return false;
    }

    if (usedCourtNumbers.has(match.court)) {
      return false;
    }

    usedCourtNumbers.add(match.court);

    playingMemberIds.push(
      ...match.teamAMemberIds,
      ...match.teamBMemberIds
    );
  }

  if (!hasUniqueMemberIds(playingMemberIds)) {
    return false;
  }

  const restingMemberIdSet = new Set(round.restingMemberIds);

  return playingMemberIds.every(
    (memberId) => !restingMemberIdSet.has(memberId)
  );
}

export function usesOnlyAllowedMembers(
  round: GeneratedRound,
  allowedMemberIds: string[]
): boolean {
  const allowedMemberIdSet = new Set(allowedMemberIds);

  const roundMemberIds = [
    ...round.matches.flatMap((match) => [
      ...match.teamAMemberIds,
      ...match.teamBMemberIds,
    ]),
    ...round.restingMemberIds,
  ];

  return roundMemberIds.every((memberId) =>
    allowedMemberIdSet.has(memberId)
  );
}

export function includesEveryMemberExactlyOnce(
  round: GeneratedRound,
  expectedMemberIds: string[]
): boolean {
  const roundMemberIds = [
    ...round.matches.flatMap((match) => [
      ...match.teamAMemberIds,
      ...match.teamBMemberIds,
    ]),
    ...round.restingMemberIds,
  ];

  if (roundMemberIds.length !== expectedMemberIds.length) {
    return false;
  }

  if (!hasUniqueMemberIds(roundMemberIds)) {
    return false;
  }

  const expectedMemberIdSet = new Set(expectedMemberIds);

  return roundMemberIds.every((memberId) =>
    expectedMemberIdSet.has(memberId)
  );
}
