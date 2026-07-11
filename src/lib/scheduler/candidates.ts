import type { GeneratedRound, ScheduledMatch } from "@/types";

import { rotateArray, uniqueMemberIds } from "./helpers";

type GenerateNormalRoundCandidatesParams = {
  memberIds: string[];
  round: number;
  courtCount: number;
  candidateLimit?: number;
};

const DEFAULT_CANDIDATE_LIMIT = 48;

export function generateNormalRoundCandidates({
  memberIds,
  round,
  courtCount,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
}: GenerateNormalRoundCandidatesParams): GeneratedRound[] {
  const cleanMemberIds = uniqueMemberIds(memberIds);
  const safeCourtCount = Math.max(1, Math.floor(courtCount));
  const safeCandidateLimit = Math.max(1, Math.floor(candidateLimit));

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
    let candidateIndex = 0;
    candidateIndex < safeCandidateLimit;
    candidateIndex += 1
  ) {
    const orderedMemberIds = buildCandidateMemberOrder(
      cleanMemberIds,
      candidateIndex
    );

    const activeMemberIds = orderedMemberIds.slice(0, activeMemberCount);
    const restingMemberIds = orderedMemberIds.slice(activeMemberCount);

    const matches = buildMatchesFromActiveMembers({
      activeMemberIds,
      round,
      courtCount: availableCourtCount,
      pairingPattern: candidateIndex % 3,
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

  const rotationShift = candidateIndex % memberIds.length;
  const cycleIndex = Math.floor(candidateIndex / memberIds.length);

  const rotatedMemberIds = rotateArray(memberIds, rotationShift);

  if (cycleIndex % 4 === 0) {
    return rotatedMemberIds;
  }

  if (cycleIndex % 4 === 1) {
    return alternateFromBothEnds(rotatedMemberIds);
  }

  if (cycleIndex % 4 === 2) {
    return interleaveEvenAndOddIndexes(rotatedMemberIds);
  }

  return [
    rotatedMemberIds[0],
    ...rotatedMemberIds.slice(1).reverse(),
  ];
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

  for (let courtIndex = 0; courtIndex < courtCount; courtIndex += 1) {
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

function alternateFromBothEnds(memberIds: string[]): string[] {
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

function interleaveEvenAndOddIndexes(memberIds: string[]): string[] {
  const evenIndexMemberIds: string[] = [];
  const oddIndexMemberIds: string[] = [];

  memberIds.forEach((memberId, index) => {
    if (index % 2 === 0) {
      evenIndexMemberIds.push(memberId);
    } else {
      oddIndexMemberIds.push(memberId);
    }
  });

  return [...evenIndexMemberIds, ...oddIndexMemberIds];
}

function makeRoundCandidateKey(round: GeneratedRound): string {
  const matchKeys = round.matches
    .map((match) => {
      const teamAKey = [...match.teamAMemberIds].sort().join("-");
      const teamBKey = [...match.teamBMemberIds].sort().join("-");

      return [teamAKey, teamBKey].sort().join("_vs_");
    })
    .sort();

  const restingKey = [...round.restingMemberIds].sort().join("-");

  return `${matchKeys.join("|")}__rest__${restingKey}`;
}
