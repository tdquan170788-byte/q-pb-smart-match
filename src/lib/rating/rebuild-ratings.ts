import type {
  MatchRecord,
  Member,
  SessionMode,
} from "@/types";

import {
  getMatches,
  getMembers,
  getSessions,
  saveMembers,
} from "@/lib/storage";

import {
  calculateTeamRatingResult,
  type TeamRatingMemberInput,
  type TeamRatingResult,
} from "./team-rating";

/**
 * Dự án hiện tại đang sử dụng rating mặc định 1000
 * trong members.repo.ts.
 *
 * Giữ nguyên mốc này để không làm thay đổi dữ liệu
 * và cách hiển thị rating hiện có.
 */
const INITIAL_RATING = 1000;

export type RatingRebuildResult = {
  processedMatchCount: number;
  skippedMatchCount: number;
  updatedMemberCount: number;
};

export function rebuildAllRatings(): RatingRebuildResult {
  const storedMembers = getMembers();
  const storedMatches = getMatches();
  const storedSessions = getSessions();

  const sessionModeMap = new Map<
    string,
    SessionMode
  >(
    storedSessions.map((session) => [
      session.id,
      session.mode,
    ])
  );

  /**
   * Reset toàn bộ rating và thống kê.
   *
   * Sau đó lịch sử trận sẽ được replay lại từ đầu.
   */
  const memberMap = new Map<string, Member>(
    storedMembers.map((member) => {
      const resetMember =
        resetMemberRating(member);

      return [
        resetMember.id,
        resetMember,
      ];
    })
  );

  const orderedMatches = [
    ...storedMatches,
  ].sort(compareMatchesChronologically);

  let processedMatchCount = 0;
  let skippedMatchCount = 0;

  for (const match of orderedMatches) {
    const mode =
      sessionModeMap.get(match.sessionId) ??
      "normal";

    const processed =
      applyStoredMatchToMembers({
        match,
        mode,
        memberMap,
      });

    if (processed) {
      processedMatchCount += 1;
    } else {
      skippedMatchCount += 1;
    }
  }

  const rebuiltMembers = [
    ...memberMap.values(),
  ];

  saveMembers(rebuiltMembers);

  return {
    processedMatchCount,
    skippedMatchCount,
    updatedMemberCount:
      rebuiltMembers.length,
  };
}

function applyStoredMatchToMembers({
  match,
  mode,
  memberMap,
}: {
  match: MatchRecord;
  mode: SessionMode;
  memberMap: Map<string, Member>;
}): boolean {
  /**
   * Không tính các trận chưa có kết quả
   * hoặc có tỷ số hòa.
   */
  if (
    !isValidCompletedMatch(match)
  ) {
    return false;
  }

  const teamAOverall =
    buildTeamRatingInput({
      memberIds:
        match.teamA.memberIds,
      memberMap,
      ratingField: "rating",
    });

  const teamBOverall =
    buildTeamRatingInput({
      memberIds:
        match.teamB.memberIds,
      memberMap,
      ratingField: "rating",
    });

  if (
    !teamAOverall ||
    !teamBOverall
  ) {
    return false;
  }

  const modeRatingField =
    mode === "team"
      ? "ratingTeam"
      : "ratingNormal";

  const teamAMode =
    buildTeamRatingInput({
      memberIds:
        match.teamA.memberIds,
      memberMap,
      ratingField:
        modeRatingField,
    });

  const teamBMode =
    buildTeamRatingInput({
      memberIds:
        match.teamB.memberIds,
      memberMap,
      ratingField:
        modeRatingField,
    });

  if (
    !teamAMode ||
    !teamBMode
  ) {
    return false;
  }

  const teamAActualScore:
    0 | 1 =
    match.scoreA > match.scoreB
      ? 1
      : 0;

  /**
   * Tính rating tổng.
   */
  const overallResult =
    calculateTeamRatingResult({
      teamA: teamAOverall,
      teamB: teamBOverall,
      teamAActualScore,
    });

  /**
   * Tính rating riêng theo mode.
   */
  const modeResult =
    calculateTeamRatingResult({
      teamA: teamAMode,
      teamB: teamBMode,
      teamAActualScore,
    });

  applyOverallRatingResult({
    result: overallResult,
    teamAWon:
      teamAActualScore === 1,
    memberMap,
  });

  applyModeRatingResult({
    result: modeResult,
    mode,
    teamAWon:
      teamAActualScore === 1,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    memberMap,
  });

  return true;
}

function buildTeamRatingInput({
  memberIds,
  memberMap,
  ratingField,
}: {
  memberIds: string[];
  memberMap: Map<string, Member>;
  ratingField:
    | "rating"
    | "ratingNormal"
    | "ratingTeam";
}): TeamRatingMemberInput[] | null {
  /**
   * Phiên bản hiện tại hỗ trợ trận đánh đôi 2 vs 2.
   */
  if (memberIds.length !== 2) {
    return null;
  }

  const team:
    TeamRatingMemberInput[] = [];

  const uniqueMemberIds =
    new Set<string>();

  for (const memberId of memberIds) {
    if (
      uniqueMemberIds.has(memberId)
    ) {
      return null;
    }

    const member =
      memberMap.get(memberId);

    if (!member) {
      return null;
    }

    uniqueMemberIds.add(memberId);

    team.push({
      memberId,
      rating:
        member[ratingField],
    });
  }

  return team;
}

function applyOverallRatingResult({
  result,
  teamAWon,
  memberMap,
}: {
  result: TeamRatingResult;
  teamAWon: boolean;
  memberMap: Map<string, Member>;
}): void {
  for (
    const memberResult of
    result.teamAMembers
  ) {
    const member =
      memberMap.get(
        memberResult.memberId
      );

    if (!member) {
      continue;
    }

    memberMap.set(
      member.id,
      {
        ...member,

        rating:
          memberResult.newRating,

        matches:
          member.matches + 1,

        wins:
          member.wins +
          (teamAWon ? 1 : 0),

        losses:
          member.losses +
          (teamAWon ? 0 : 1),
      }
    );
  }

  for (
    const memberResult of
    result.teamBMembers
  ) {
    const member =
      memberMap.get(
        memberResult.memberId
      );

    if (!member) {
      continue;
    }

    memberMap.set(
      member.id,
      {
        ...member,

        rating:
          memberResult.newRating,

        matches:
          member.matches + 1,

        wins:
          member.wins +
          (teamAWon ? 0 : 1),

        losses:
          member.losses +
          (teamAWon ? 1 : 0),
      }
    );
  }
}

function applyModeRatingResult({
  result,
  mode,
  teamAWon,
  scoreA,
  scoreB,
  memberMap,
}: {
  result: TeamRatingResult;
  mode: SessionMode;
  teamAWon: boolean;
  scoreA: number;
  scoreB: number;
  memberMap: Map<string, Member>;
}): void {
  for (
    const memberResult of
    result.teamAMembers
  ) {
    const member =
      memberMap.get(
        memberResult.memberId
      );

    if (!member) {
      continue;
    }

    memberMap.set(
      member.id,
      mode === "team"
        ? {
            ...member,

            ratingTeam:
              memberResult.newRating,

            matchesTeam:
              member.matchesTeam + 1,

            winsTeam:
              member.winsTeam +
              (teamAWon ? 1 : 0),

            lossesTeam:
              member.lossesTeam +
              (teamAWon ? 0 : 1),

            pointsForTeam:
              member.pointsForTeam +
              scoreA,

            pointsAgainstTeam:
              member.pointsAgainstTeam +
              scoreB,
          }
        : {
            ...member,

            ratingNormal:
              memberResult.newRating,

            matchesNormal:
              member.matchesNormal + 1,

            winsNormal:
              member.winsNormal +
              (teamAWon ? 1 : 0),

            lossesNormal:
              member.lossesNormal +
              (teamAWon ? 0 : 1),

            pointsForNormal:
              member.pointsForNormal +
              scoreA,

            pointsAgainstNormal:
              member.pointsAgainstNormal +
              scoreB,
          }
    );
  }

  for (
    const memberResult of
    result.teamBMembers
  ) {
    const member =
      memberMap.get(
        memberResult.memberId
      );

    if (!member) {
      continue;
    }

    memberMap.set(
      member.id,
      mode === "team"
        ? {
            ...member,

            ratingTeam:
              memberResult.newRating,

            matchesTeam:
              member.matchesTeam + 1,

            winsTeam:
              member.winsTeam +
              (teamAWon ? 0 : 1),

            lossesTeam:
              member.lossesTeam +
              (teamAWon ? 1 : 0),

            pointsForTeam:
              member.pointsForTeam +
              scoreB,

            pointsAgainstTeam:
              member.pointsAgainstTeam +
              scoreA,
          }
        : {
            ...member,

            ratingNormal:
              memberResult.newRating,

            matchesNormal:
              member.matchesNormal + 1,

            winsNormal:
              member.winsNormal +
              (teamAWon ? 0 : 1),

            lossesNormal:
              member.lossesNormal +
              (teamAWon ? 1 : 0),

            pointsForNormal:
              member.pointsForNormal +
              scoreB,

            pointsAgainstNormal:
              member.pointsAgainstNormal +
              scoreA,
          }
    );
  }
}

function resetMemberRating(
  member: Member
): Member {
  return {
    ...member,

    rating: INITIAL_RATING,
    wins: 0,
    losses: 0,
    matches: 0,

    ratingNormal: INITIAL_RATING,
    winsNormal: 0,
    lossesNormal: 0,
    matchesNormal: 0,
    pointsForNormal: 0,
    pointsAgainstNormal: 0,

    ratingTeam: INITIAL_RATING,
    winsTeam: 0,
    lossesTeam: 0,
    matchesTeam: 0,
    pointsForTeam: 0,
    pointsAgainstTeam: 0,
  };
}

function isValidCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(match.scoreA) ||
    !Number.isFinite(match.scoreB)
  ) {
    return false;
  }

  if (
    match.scoreA < 0 ||
    match.scoreB < 0
  ) {
    return false;
  }

  if (
    match.scoreA === match.scoreB
  ) {
    return false;
  }

  if (
    match.teamA.memberIds.length !==
      2 ||
    match.teamB.memberIds.length !==
      2
  ) {
    return false;
  }

  const allMemberIds = [
    ...match.teamA.memberIds,
    ...match.teamB.memberIds,
  ];

  return (
    new Set(allMemberIds).size === 4
  );
}

function compareMatchesChronologically(
  firstMatch: MatchRecord,
  secondMatch: MatchRecord
): number {
  const firstCreatedAt =
    parseTimestamp(
      firstMatch.createdAt
    );

  const secondCreatedAt =
    parseTimestamp(
      secondMatch.createdAt
    );

  if (
    firstCreatedAt !==
    secondCreatedAt
  ) {
    return (
      firstCreatedAt -
      secondCreatedAt
    );
  }

  if (
    firstMatch.sessionId !==
    secondMatch.sessionId
  ) {
    return firstMatch.sessionId.localeCompare(
      secondMatch.sessionId
    );
  }

  if (
    firstMatch.round !==
    secondMatch.round
  ) {
    return (
      firstMatch.round -
      secondMatch.round
    );
  }

  const firstCourt =
    firstMatch.court ?? 1;

  const secondCourt =
    secondMatch.court ?? 1;

  if (
    firstCourt !== secondCourt
  ) {
    return (
      firstCourt -
      secondCourt
    );
  }

  return firstMatch.id.localeCompare(
    secondMatch.id
  );
}

function parseTimestamp(
  value?: string
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}
