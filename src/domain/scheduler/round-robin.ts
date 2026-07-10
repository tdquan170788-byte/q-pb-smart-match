const BYE_MEMBER_ID = "__BYE__";

/**
 * Generate round-robin pairings.
 *
 * Each round contains multiple pairs:
 * [
 *   [
 *     ["m1", "m2"],
 *     ["m3", "m4"]
 *   ],
 *   ...
 * ]
 */
export function buildRoundRobinPairs(
  memberIds: string[]
): string[][][] {
  if (memberIds.length < 2) {
    return [];
  }

  const members = [...memberIds];

  if (members.length % 2 === 1) {
    members.push(BYE_MEMBER_ID);
  }

  const totalMembers = members.length;
  const matchesPerRound = totalMembers / 2;

  const rounds: string[][][] = [];

  let currentMembers = [...members];

  for (let round = 0; round < totalMembers - 1; round++) {
    const pairings: string[][] = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const memberA = currentMembers[i];
      const memberB = currentMembers[totalMembers - 1 - i];

      if (
        memberA !== BYE_MEMBER_ID &&
        memberB !== BYE_MEMBER_ID
      ) {
        pairings.push([memberA, memberB]);
      }
    }

    rounds.push(pairings);

    const fixedMember = currentMembers[0];
    const rotatingMembers = currentMembers.slice(1);

    rotatingMembers.unshift(rotatingMembers.pop()!);

    currentMembers = [fixedMember, ...rotatingMembers];
  }

  return rounds;
}
