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

import {
  rotateArray,
  uniqueMemberIds,
} from "./helpers";

import { selectBestRoundCandidate } from "./optimizer";

import { selectBestScheduleCandidate } from "./schedule-search";

type PairSequentialResult = {
  matches: ScheduledMatch[];
  restingMemberIds: string[];
};

const NORMAL_CANDIDATE_LIMIT = 72;

/**
 * Số lịch hoàn chỉnh được tạo để so sánh.
 *
 * 8 phương án đủ tạo khác biệt rõ rệt nhưng vẫn nhẹ
 * đối với trình duyệt điện thoại.
 */
const NORMAL_SCHEDULE_VARIANT_COUNT = 8;

function createEmptySchedule(
  sessionId: string
): GeneratedSchedule {
  return {
    sessionId,
    totalRounds: 0,
    rounds: [],
  };
}

/**
 * Thuật toán tuần tự cũ.
 * Chỉ dùng làm fallback.
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

  const activeMembers = members.slice(
    0,
    maxMembersCanPlay
  );

  const membersOutsideCourtCapacity =
    members.slice(maxMembersCanPlay);

  restingMemberIds.push(
    ...membersOutsideCourtCapacity
  );

  for (
    let startIndex = 0;
    startIndex + 3 < activeMembers.length;
    startIndex += 4
  ) {
    const group = activeMembers.slice(
      startIndex,
      startIndex + 4
    );

    matches.push({
      round,
      court: Math.floor(startIndex / 4) + 1,
      teamAMemberIds: [group[0], group[1]],
      teamBMemberIds: [group[2], group[3]],
    });
  }

  const leftoverCount =
    activeMembers.length % 4;

  if (leftoverCount > 0) {
    const leftoverMembers =
      activeMembers.slice(
        activeMembers.length - leftoverCount
      );

    restingMemberIds.push(...leftoverMembers);
  }

  return {
    matches,
    restingMemberIds:
      uniqueMemberIds(restingMemberIds),
  };
}

function buildFallbackNormalRound(params: {
  memberIds: string[];
  round: number;
  courtCount: number;
  strategyOffset: number;
}): GeneratedRound {
  const {
    memberIds,
    round,
    courtCount,
    strategyOffset,
  } = params;

  const rotationShift =
    round - 1 + strategyOffset;

  const rotatedMemberIds = rotateArray(
    memberIds,
    rotationShift
  );

  const {
    matches,
    restingMemberIds,
  } = pairSequential(
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
 * Tạo một lịch hoàn chỉnh theo một chiến lược xác định.
 *
 * Mỗi variant dùng vùng candidate khác nhau.
 * Kết quả vẫn deterministic.
 */
function buildNormalScheduleVariant(params: {
  sessionId: string;
  memberIds: string[];
  courtCount: number;
  totalRounds: number;
  variantIndex: number;
}): GeneratedSchedule {
  const {
    sessionId,
    memberIds,
    courtCount,
    totalRounds,
    variantIndex,
  } = params;

  const rounds: GeneratedRound[] = [];
  const history = createEmptySchedulerHistory();

  for (
    let round = 1;
    round <= totalRounds;
    round += 1
  ) {
    /**
     * Các số nguyên tố được dùng để tách vùng candidate
     * giữa các variant và các round.
     */
    const strategyOffset =
      variantIndex * 1009 + round * 131;

    const candidates =
      generateNormalRoundCandidates({
        memberIds,
        round,
        courtCount,
        candidateLimit:
          NORMAL_CANDIDATE_LIMIT,
        strategyOffset,
      });

    const optimizedRound =
      selectBestRoundCandidate({
        candidates,
        history,
        memberIds,
      });

    const selectedRound =
      optimizedRound ??
      buildFallbackNormalRound({
        memberIds,
        round,
        courtCount,
        strategyOffset,
      });

    rounds.push(selectedRound);

    applyRoundToHistory(
      history,
      selectedRound
    );
  }

  return {
    sessionId,
    totalRounds: rounds.length,
    rounds,
  };
}

/**
 * Normal Scheduler 2.1
 *
 * 1. Tạo nhiều lịch hoàn chỉnh.
 * 2. Phân tích từng lịch.
 * 3. So sánh qualityScore và các chỉ số phụ.
 * 4. Trả về lịch tốt nhất.
 */
function buildNormalSchedule(
  session: SessionRecord
): GeneratedSchedule {
  const memberIds = uniqueMemberIds(
    session.memberIds
  );

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

  const totalRounds = Math.max(
    1,
    memberIds.length - 1
  );

  const scheduleCandidates: GeneratedSchedule[] =
    [];

  for (
    let variantIndex = 0;
    variantIndex <
    NORMAL_SCHEDULE_VARIANT_COUNT;
    variantIndex += 1
  ) {
    scheduleCandidates.push(
      buildNormalScheduleVariant({
        sessionId: session.id,
        memberIds,
        courtCount: usableCourtCount,
        totalRounds,
        variantIndex,
      })
    );
  }

  const bestCandidate =
    selectBestScheduleCandidate({
      schedules: scheduleCandidates,
      memberIds,
    });

  return (
    bestCandidate?.schedule ??
    scheduleCandidates[0] ??
    createEmptySchedule(session.id)
  );
}

/**
 * Team mode vẫn giữ nguyên.
 */
function buildTeamSchedule(
  session: SessionRecord
): GeneratedSchedule {
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

  if (
    teamAMemberIds.length < 2 ||
    teamBMemberIds.length < 2
  ) {
    return createEmptySchedule(session.id);
  }

  const totalRounds = Math.max(
    teamAMemberIds.length,
    teamBMemberIds.length
  );

  const rounds: GeneratedRound[] = [];

  for (
    let round = 1;
    round <= totalRounds;
    round += 1
  ) {
    const rotatedTeamAMemberIds =
      rotateArray(
        teamAMemberIds,
        round - 1
      );

    const rotatedTeamBMemberIds =
      rotateArray(
        teamBMemberIds,
        round - 1
      );

    const matches: ScheduledMatch[] = [];

    for (
      let court = 1;
      court <= courtCount;
      court += 1
    ) {
      const startIndex = (court - 1) * 2;

      const teamAHasEnoughMembers =
        startIndex + 1 <
        rotatedTeamAMemberIds.length;

      const teamBHasEnoughMembers =
        startIndex + 1 <
        rotatedTeamBMemberIds.length;

      if (
        !teamAHasEnoughMembers ||
        !teamBHasEnoughMembers
      ) {
        break;
      }

      matches.push({
        round,
        court,
        teamAMemberIds: [
          rotatedTeamAMemberIds[startIndex],
          rotatedTeamAMemberIds[
            startIndex + 1
          ],
        ],
        teamBMemberIds: [
          rotatedTeamBMemberIds[startIndex],
          rotatedTeamBMemberIds[
            startIndex + 1
          ],
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
    ].filter(
      (memberId) =>
        !playingMemberIds.has(memberId)
    );

    rounds.push({
      round,
      matches,
      restingMemberIds:
        uniqueMemberIds(restingMemberIds),
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
