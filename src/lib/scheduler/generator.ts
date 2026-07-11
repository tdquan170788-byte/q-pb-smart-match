import { BYE_MEMBER_ID } from "./helpers";

export type MemberTeam = [string, string];

export function generateAllTeams(memberIds: string[]): MemberTeam[] {
  const teams: MemberTeam[] = [];

  for (let firstIndex = 0; firstIndex < memberIds.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < memberIds.length;
      secondIndex += 1
    ) {
      teams.push([
        memberIds[firstIndex],
        memberIds[secondIndex],
      ]);
    }
  }

  return teams;
}

export function generateRoundRobinPairs(
  memberIds: string[]
): MemberTeam[][] {
  if (memberIds.length < 2) {
    return [];
  }

  const rotatingMemberIds = [...memberIds];

  if (rotatingMemberIds.length % 2 === 1) {
    rotatingMemberIds.push(BYE_MEMBER_ID);
  }

  const totalMemberSlots = rotatingMemberIds.length;
  const pairCountPerRound = totalMemberSlots / 2;

  const rounds: MemberTeam[][] = [];
  let currentMemberIds = [...rotatingMemberIds];

  for (
    let roundIndex = 0;
    roundIndex < totalMemberSlots - 1;
    roundIndex += 1
  ) {
    const roundPairs: MemberTeam[] = [];

    for (
      let pairIndex = 0;
      pairIndex < pairCountPerRound;
      pairIndex += 1
    ) {
      const firstMemberId = currentMemberIds[pairIndex];
      const secondMemberId =
        currentMemberIds[totalMemberSlots - 1 - pairIndex];

      if (
        firstMemberId !== BYE_MEMBER_ID &&
        secondMemberId !== BYE_MEMBER_ID
      ) {
        roundPairs.push([
          firstMemberId,
          secondMemberId,
        ]);
      }
    }

    rounds.push(roundPairs);

    const fixedMemberId = currentMemberIds[0];
    const rotatingPart = currentMemberIds.slice(1);
    const lastMemberId = rotatingPart.pop();

    if (lastMemberId) {
      rotatingPart.unshift(lastMemberId);
    }

    currentMemberIds = [
      fixedMemberId,
      ...rotatingPart,
    ];
  }

  return rounds;
}

export function generateSequentialGroups(
  memberIds: string[],
  groupSize: number
): string[][] {
  if (groupSize <= 0) {
    return [];
  }

  const groups: string[][] = [];

  for (
    let startIndex = 0;
    startIndex < memberIds.length;
    startIndex += groupSize
  ) {
    groups.push(
      memberIds.slice(startIndex, startIndex + groupSize)
    );
  }

  return groups;
}
