import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

import { rotateArray, uniqueMemberIds } from "./helpers";

type PairSequentialResult = {
  matches: ScheduledMatch[];
  restingMemberIds: string[];
};

function createEmptySchedule(sessionId: string): GeneratedSchedule {
  return {
    sessionId,
    totalRounds: 0,
    rounds: [],
  };
}

function pairSequential(
  memberIds: string[],
  round: number,
  courtCount: number
): PairSequentialResult {
  const members = [...memberIds];
  const matches: ScheduledMatch[] = [];
  const restingMemberIds: string[] = [];

  const maxMembersCanPlay = courtCount * 4;
  const activeMembers = members.slice(0, maxMembersCanPlay);
  const membersOutsideCourtCapacity = members.slice(maxMembersCanPlay);

  restingMemberIds.push(...membersOutsideCourtCapacity);

  for (
    let startIndex = 0;
    startIndex + 3 < activeMembers.length;
    startIndex += 4
  ) {
    const group = activeMembers.slice(startIndex, startIndex + 4);

    matches.push({
      round,
      court: Math.floor(startIndex / 4) + 1,
      teamAMemberIds: [group[0], group[1]],
      teamBMemberIds: [group[2], group[3]],
    });
  }

  const leftoverCount = activeMembers.length % 4;

  if (leftoverCount > 0) {
    const leftoverMembers = activeMembers.slice(
      activeMembers.length - leftoverCount
    );

    restingMemberIds.push(...leftoverMembers);
  }

  return {
    matches,
    restingMemberIds: uniqueMemberIds(restingMemberIds),
  };
}

function buildNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const memberIds = uniqueMemberIds(session.memberIds);
  const courtCount = Math.max(1, session.courtCount ?? 1);

  if (memberIds.length < 4) {
    return createEmptySchedule(session.id);
  }

  const totalRounds = Math.max(1, memberIds.length - 1);
  const rounds: GeneratedRound[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const rotatedMemberIds = rotateArray(memberIds, round - 1);

    const { matches, restingMemberIds } = pairSequential(
      rotatedMemberIds,
      round,
      courtCount
    );

    rounds.push({
      round,
      matches,
      restingMemberIds,
    });
  }

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

function buildTeamSchedule(session: SessionRecord): GeneratedSchedule {
  const courtCount = Math.max(1, session.courtCount ?? 1);

  const teamAMemberIds = uniqueMemberIds(
    session.teamConfig?.teamAMemberIds ?? []
  );

  const teamBMemberIds = uniqueMemberIds(
    session.teamConfig?.teamBMemberIds ?? []
  );

  if (teamAMemberIds.length < 2 || teamBMemberIds.length < 2) {
    return createEmptySchedule(session.id);
  }

  const totalRounds = Math.max(
    teamAMemberIds.length,
    teamBMemberIds.length
  );

  const rounds: GeneratedRound[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const rotatedTeamAMemberIds = rotateArray(
      teamAMemberIds,
      round - 1
    );

    const rotatedTeamBMemberIds = rotateArray(
      teamBMemberIds,
      round - 1
    );

    const matches: ScheduledMatch[] = [];

    for (let court = 1; court <= courtCount; court += 1) {
      const startIndex = (court - 1) * 2;

      const teamAHasEnoughMembers =
        startIndex + 1 < rotatedTeamAMemberIds.length;

      const teamBHasEnoughMembers =
        startIndex + 1 < rotatedTeamBMemberIds.length;

      if (!teamAHasEnoughMembers || !teamBHasEnoughMembers) {
        break;
      }

      matches.push({
        round,
        court,
        teamAMemberIds: [
          rotatedTeamAMemberIds[startIndex],
          rotatedTeamAMemberIds[startIndex + 1],
        ],
        teamBMemberIds: [
          rotatedTeamBMemberIds[startIndex],
          rotatedTeamBMemberIds[startIndex + 1],
        ],
      });
    }

    const playingMemberIds = new Set(
      matches.flatMap((match) => [
        ...match.teamAMemberIds,
        ...match.teamBMemberIds,
      ])
    );

    const restingMemberIds = [
      ...teamAMemberIds,
      ...teamBMemberIds,
    ].filter((memberId) => !playingMemberIds.has(memberId));

    rounds.push({
      round,
      matches,
      restingMemberIds: uniqueMemberIds(restingMemberIds),
    });
  }

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

export function buildSessionSchedule(
  session: SessionRecord
): GeneratedSchedule {
  if (session.mode === "team") {
    return buildTeamSchedule(session);
  }

  return buildNormalSchedule(session);
}
