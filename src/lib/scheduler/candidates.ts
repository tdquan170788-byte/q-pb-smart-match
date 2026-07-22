import type { GeneratedRound, ScheduledMatch } from "@/types";

import { rotateArray, uniqueMemberIds } from "./helpers";

type GenerateNormalRoundCandidatesParams = {
  memberIds: string[];
  round: number;
  courtCount: number;
  candidateLimit?: number;

  /**
   * Dùng để sinh các nhóm candidate khác nhau nhưng vẫn deterministic.
   * Không dùng Math.random() để tránh lịch thay đổi khi reload.
   */
  strategyOffset?: number;
};

const DEFAULT_CANDIDATE_LIMIT = 48;

export function generateNormalRoundCandidates({
  memberIds,
  round,
  courtCount,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
  strategyOffset = 0,
}: GenerateNormalRoundCandidatesParams): GeneratedRound[] {
  const cleanMemberIds = uniqueMemberIds(memberIds);
  const safeCourtCount = Math.max(1, Math.floor(courtCount));
  const safeCandidateLimit = Math.max(1, Math.floor(candidateLimit));
  const safeStrategyOffset = Math.max(0, Math.floor(strategyOffset));

  const availableCourtCount = Math.min(
    safeCourtCount,
    Math.floor(cleanMemberIds.length / 4)
  );

  const activeMemberCount = availableCourtCount * 4;

  if (activeMemberCount < 4) {
    return [];
  }

  const candidates: GeneratedRound[] = [];
  const candidateKeys = new Set<string>();

  for (
    let localCandidateIndex = 0;
    localCandidateIndex < safeCandidateLimit;
    localCandidateIndex += 1
  ) {
    const effectiveCandidateIndex =
      localCandidateIndex + safeStrategyOffset;

    const orderedMemberIds = buildCandidateMemberOrder(
      cleanMemberIds,
      effectiveCandidateIndex
    );

    const activeMemberIds =
    buildActiveMemberGrouping(
        orderedMemberIds,
        activeMemberCount,
        effectiveCandidateIndex
    );

    const restingMemberIds = orderedMemberIds.slice(
      activeMemberCount
    );

    const matches = buildMatchesFromActiveMembers({
      activeMemberIds,
      round,
      courtCount: availableCourtCount,
      pairingPattern: effectiveCandidateIndex % 3,
    });

    const candidate: GeneratedRound = {
      round,
      matches,
      restingMemberIds,
    };

    const candidateKey = makeRoundCandidateKey(candidate);

    if (candidateKeys.has(candidateKey)) {
      continue;
    }

    candidateKeys.add(candidateKey);
    candidates.push(candidate);
  }

  return candidates;
}

function buildCandidateMemberOrder(
  memberIds: string[],
  candidateIndex: number
): string[] {
  if (memberIds.length === 0) {
    return [];
  }

function buildActiveMemberGrouping(
  orderedMemberIds: string[],
  activeMemberCount: number,
  candidateIndex: number
): string[] {
  const activeMemberIds =
    orderedMemberIds.slice(0, activeMemberCount);

  if (activeMemberIds.length <= 4) {
    return activeMemberIds;
  }

  const strategy = Math.floor(candidateIndex / 8) % 4;

  switch (strategy) {
    case 0:
      return activeMemberIds;

    case 1:
      return interleaveFirstAndSecondHalf(
        activeMemberIds
      );

    case 2:
      return alternateFromBothEnds(
        activeMemberIds
      );

    case 3:
      return rotateBlocks(
        activeMemberIds,
        4
      );

    default:
      return activeMemberIds;
  }
}

  const rotationShift = candidateIndex % memberIds.length;
  const cycleIndex = Math.floor(
    candidateIndex / memberIds.length
  );

  const rotatedMemberIds = rotateArray(
    memberIds,
    rotationShift
  );

  const strategy = cycleIndex % 8;

  if (strategy === 0) {
    return rotatedMemberIds;
  }

  if (strategy === 1) {
    return alternateFromBothEnds(rotatedMemberIds);
  }

  if (strategy === 2) {
    return interleaveEvenAndOddIndexes(rotatedMemberIds);
  }

  if (strategy === 3) {
    return [
      rotatedMemberIds[0],
      ...rotatedMemberIds.slice(1).reverse(),
    ];
  }

  if (strategy === 4) {
    return interleaveFirstAndSecondHalf(rotatedMemberIds);
  }

  if (strategy === 5) {
    return rotateBlocks(rotatedMemberIds, 2);
  }

  if (strategy === 6) {
    return rotateBlocks(rotatedMemberIds, 3);
  }

  return reverseAlternatingGroups(rotatedMemberIds);
}

function buildMatchesFromActiveMembers(params: {
  activeMemberIds: string[];
  round: number;
  courtCount: number;
  pairingPattern: number;
}): ScheduledMatch[] {
  const {
    activeMemberIds,
    round,
    courtCount,
    pairingPattern,
  } = params;

  const matches: ScheduledMatch[] = [];

  for (
    let courtIndex = 0;
    courtIndex < courtCount;
    courtIndex += 1
  ) {
    const groupStartIndex = courtIndex * 4;

    const group = activeMemberIds.slice(
      groupStartIndex,
      groupStartIndex + 4
    );

    if (group.length < 4) {
      break;
    }

    const [first, second, third, fourth] = group;

    const teams = buildTeamsFromGroup(
      [first, second, third, fourth],
      pairingPattern
    );

    matches.push({
      round,
      court: courtIndex + 1,
      teamAMemberIds: teams.teamAMemberIds,
      teamBMemberIds: teams.teamBMemberIds,
    });
  }

  return matches;
}

function buildTeamsFromGroup(
  group: [string, string, string, string],
  pairingPattern: number
): {
  teamAMemberIds: [string, string];
  teamBMemberIds: [string, string];
} {
  const [first, second, third, fourth] = group;

  if (pairingPattern === 1) {
    return {
      teamAMemberIds: [first, third],
      teamBMemberIds: [second, fourth],
    };
  }

  if (pairingPattern === 2) {
    return {
      teamAMemberIds: [first, fourth],
      teamBMemberIds: [second, third],
    };
  }

  return {
    teamAMemberIds: [first, second],
    teamBMemberIds: [third, fourth],
  };
}

function alternateFromBothEnds(
  memberIds: string[]
): string[] {
  const result: string[] = [];

  let leftIndex = 0;
  let rightIndex = memberIds.length - 1;

  while (leftIndex <= rightIndex) {
    result.push(memberIds[leftIndex]);

    if (leftIndex !== rightIndex) {
      result.push(memberIds[rightIndex]);
    }

    leftIndex += 1;
    rightIndex -= 1;
  }

  return result;
}

function interleaveEvenAndOddIndexes(
  memberIds: string[]
): string[] {
  const evenIndexMemberIds: string[] = [];
  const oddIndexMemberIds: string[] = [];

  memberIds.forEach((memberId, index) => {
    if (index % 2 === 0) {
      evenIndexMemberIds.push(memberId);
    } else {
      oddIndexMemberIds.push(memberId);
    }
  });

  return [
    ...evenIndexMemberIds,
    ...oddIndexMemberIds,
  ];
}

function interleaveFirstAndSecondHalf(
  memberIds: string[]
): string[] {
  const halfIndex = Math.ceil(memberIds.length / 2);

  const firstHalf = memberIds.slice(0, halfIndex);
  const secondHalf = memberIds.slice(halfIndex);

  const result: string[] = [];
  const longestHalfLength = Math.max(
    firstHalf.length,
    secondHalf.length
  );

  for (
    let index = 0;
    index < longestHalfLength;
    index += 1
  ) {
    if (firstHalf[index]) {
      result.push(firstHalf[index]);
    }

    if (secondHalf[index]) {
      result.push(secondHalf[index]);
    }
  }

  return result;
}

function rotateBlocks(
  memberIds: string[],
  blockSize: number
): string[] {
  if (blockSize <= 1) {
    return [...memberIds];
  }

  const blocks: string[][] = [];

  for (
    let startIndex = 0;
    startIndex < memberIds.length;
    startIndex += blockSize
  ) {
    blocks.push(
      memberIds.slice(
        startIndex,
        startIndex + blockSize
      )
    );
  }

  if (blocks.length <= 1) {
    return [...memberIds];
  }

  return [
    ...blocks.slice(1),
    blocks[0],
  ].flat();
}

function reverseAlternatingGroups(
  memberIds: string[]
): string[] {
  const result: string[] = [];

  for (
    let startIndex = 0;
    startIndex < memberIds.length;
    startIndex += 4
  ) {
    const group = memberIds.slice(
      startIndex,
      startIndex + 4
    );

    const groupIndex = Math.floor(startIndex / 4);

    result.push(
      ...(groupIndex % 2 === 0
        ? group
        : [...group].reverse())
    );
  }

  return result;
}

function makeRoundCandidateKey(
  round: GeneratedRound
): string {
  const matchKeys = round.matches
    .map((match) => {
      const teamAKey = [
        ...match.teamAMemberIds,
      ]
        .sort()
        .join("-");

      const teamBKey = [
        ...match.teamBMemberIds,
      ]
        .sort()
        .join("-");

      return [teamAKey, teamBKey]
        .sort()
        .join("_vs_");
    })
    .sort();

  const restingKey = [
    ...round.restingMemberIds,
  ]
    .sort()
    .join("-");

  return `${matchKeys.join(
    "|"
  )}__rest__${restingKey}`;
}