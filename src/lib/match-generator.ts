import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

function pairSequential(
  memberIds: string[],
  round: number,
  courtCount: number
): {
  matches: ScheduledMatch[];
  restingMemberIds: string[];
} {
  const members = [...memberIds];

  const matches: ScheduledMatch[] = [];
  const restingMemberIds: string[] = [];

  const maxMembersCanPlay = courtCount * 4;
  const activeMembers = members.slice(0, maxMembersCanPlay);
  const restingMembers = members.slice(maxMembersCanPlay);

  restingMemberIds.push(...restingMembers);

  for (let i = 0; i + 3 < activeMembers.length; i += 4) {
    const group = activeMembers.slice(i, i + 4);

    matches.push({
      round,
      court: Math.floor(i / 4) + 1,
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
    restingMemberIds,
  };
}

function rotateArray<T>(arr: T[], shift: number): T[] {
  if (arr.length === 0) {
    return [];
  }

  const normalizedShift = ((shift % arr.length) + arr.length) % arr.length;

  return [...arr.slice(normalizedShift), ...arr.slice(0, normalizedShift)];
}

function buildNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const memberIds = [...session.memberIds];
  const courtCount = Math.max(1, session.courtCount ?? 1);

  if (memberIds.length < 4) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const totalRounds = Math.max(1, memberIds.length - 1);
  const rounds: GeneratedRound[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const rotatedMemberIds = rotateArray(memberIds, round - 1);

    const result = pairSequential(rotatedMemberIds, round, courtCount);

    rounds.push({
      round,
      matches: result.matches,
      restingMemberIds: result.restingMemberIds,
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

  const teamAMemberIds = session.teamConfig?.teamAMemberIds ?? [];
  const teamBMemberIds = session.teamConfig?.teamBMemberIds ?? [];

  if (teamAMemberIds.length < 2 || teamBMemberIds.length < 2) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const rounds: GeneratedRound[] = [];
  const totalRounds = Math.max(teamAMemberIds.length, teamBMemberIds.length);

  for (let round = 1; round <= totalRounds; round++) {
    const rotatedTeamAMemberIds = rotateArray(teamAMemberIds, round - 1);
    const rotatedTeamBMemberIds = rotateArray(teamBMemberIds, round - 1);

    const matches: ScheduledMatch[] = [];
    const restingMemberIds: string[] = [];

    for (let court = 1; court <= courtCount; court++) {
      const index = (court - 1) * 2;

      if (
        index + 1 >= rotatedTeamAMemberIds.length ||
        index + 1 >= rotatedTeamBMemberIds.length
      ) {
        break;
      }

      matches.push({
        round,
        court,
        teamAMemberIds: [
          rotatedTeamAMemberIds[index],
          rotatedTeamAMemberIds[index + 1],
        ],
        teamBMemberIds: [
          rotatedTeamBMemberIds[index],
          rotatedTeamBMemberIds[index + 1],
        ],
      });
    }

    const usedMemberIds = new Set(
      matches.flatMap((match) => [
        ...match.teamAMemberIds,
        ...match.teamBMemberIds,
      ])
    );

    for (const memberId of [...teamAMemberIds, ...teamBMemberIds]) {
      if (!usedMemberIds.has(memberId)) {
        restingMemberIds.push(memberId);
      }
    }

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

export function buildSessionSchedule(session: SessionRecord): GeneratedSchedule {
  if (session.mode === "team") {
    return buildTeamSchedule(session);
  }

  return buildNormalSchedule(session);
}
