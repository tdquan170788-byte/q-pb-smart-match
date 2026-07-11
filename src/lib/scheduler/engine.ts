import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

import { generateNormalRoundCandidates } from "./candidates";
import {
  applyRoundToHistory,
  createEmptySchedulerHistory,
} from "./cost";
import { rotateArray, uniqueMemberIds } from "./helpers";
import { selectBestRoundCandidate } from "./optimizer";

type PairSequentialResult = {
  matches: ScheduledMatch[];
  restingMemberIds: string[];
};

const NORMAL_CANDIDATE_LIMIT = 96;

function createEmptySchedule(sessionId: string): GeneratedSchedule {
  return {
    sessionId,
    totalRounds: 0,
    rounds: [],
  };
}

/**
 * Thuật toán tuần tự cũ.
 *
 * Hiện chỉ dùng làm fallback khi optimizer không tìm được candidate hợp lệ.
 */
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

function buildFallbackNormalRound(params: {
  memberIds: string[];
  round: number;
  courtCount: number;
}): GeneratedRound {
  const { memberIds, round, courtCount } = params;

  const rotatedMemberIds = rotateArray(memberIds, round - 1);

  const { matches, restingMemberIds } = pairSequential(
    rotatedMemberIds,
    round,
    courtCount
  );

  return {
    round,
    matches,
    restingMemberIds,
  };
}

/**
 * Normal Scheduler 2.0
 *
 * Mỗi vòng:
 * 1. Sinh nhiều candidate.
 * 2. Loại candidate không hợp lệ.
 * 3. Chấm cost dựa trên lịch sử.
 * 4. Chọn candidate có cost thấp nhất.
 * 5. Cập nhật lịch sử cho vòng tiếp theo.
 */
function buildNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const memberIds = uniqueMemberIds(session.memberIds);
  const requestedCourtCount = Math.max(
    1,
    Math.floor(session.courtCount ?? 1)
  );

  if (memberIds.length < 4) {
    return createEmptySchedule(session.id);
  }

  const usableCourtCount = Math.min(
    requestedCourtCount,
    Math.floor(memberIds.length / 4)
  );

  if (usableCourtCount < 1) {
    return createEmptySchedule(session.id);
  }

  const totalRounds = Math.max(1, memberIds.length - 1);
  const rounds: GeneratedRound[] = [];

  const history = createEmptySchedulerHistory();

  for (let round = 1; round <= totalRounds; round += 1) {
    const candidates = generateNormalRoundCandidates({
      memberIds,
      round,
      courtCount: usableCourtCount,
      candidateLimit: NORMAL_CANDIDATE_LIMIT,
    });

    const optimizedRound = selectBestRoundCandidate({
      candidates,
      history,
      memberIds,
    });

    const selectedRound =
      optimizedRound ??
      buildFallbackNormalRound({
        memberIds,
        round,
        courtCount: usableCourtCount,
      });

    rounds.push(selectedRound);
    applyRoundToHistory(history, selectedRound);
  }

  return {
    sessionId: session.id,
    totalRounds: rounds.length,
    rounds,
  };
}

/**
 * Team mode vẫn giữ thuật toán hiện tại.
 *
 * Scheduler AI chỉ được bật cho Normal mode trong bước này.
 */
function buildTeamSchedule(session: SessionRecord): GeneratedSchedule {
  const courtCount = Math.max(
    1,
    Math.floor(session.courtCount ?? 1)
  );

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
    totalRounds: rounds.length,
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
