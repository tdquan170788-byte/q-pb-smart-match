import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  SessionMode,
  SessionRecord,
} from "@/types";

export type SessionInsightMember = {
  memberId: string;

  memberName: string;

  nickname?: string;
};

export type SessionMvpInsight =
  SessionInsightMember & {
    score: number;

    matches: number;

    wins: number;

    losses: number;

    winRate: number;

    pointsFor: number;

    pointsAgainst: number;

    pointDifference: number;

    estimatedRatingGain: number;
  };

export type SessionMostImprovedInsight =
  SessionInsightMember & {
    ratingBefore: number;

    ratingAfter: number;

    ratingGain: number;
  };

export type SessionWinStreakInsight =
  SessionInsightMember & {
    longestWinStreak: number;

    currentWinStreak: number;

    totalWins: number;

    matchCount: number;
  };

export type SessionPartnershipInsight = {
  firstMember: SessionInsightMember;

  secondMember: SessionInsightMember;

  matches: number;

  wins: number;

  losses: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDifference: number;
};

export type SessionRestInsight =
  SessionInsightMember & {
    restRounds: number;

    consecutiveRestMaximum: number;

    totalRounds: number;
  };

export type SessionOpponentInsight = {
  firstMember: SessionInsightMember;

  secondMember: SessionInsightMember;

  meetings: number;

  firstMemberWins: number;

  secondMemberWins: number;

  draws: number;
};

export type SessionUpsetInsight = {
  matchId: string;

  round: number;

  court: number;

  winnerMemberIds: string[];

  loserMemberIds: string[];

  winnerMemberNames: string[];

  loserMemberNames: string[];

  winningTeamAverageRating: number;

  losingTeamAverageRating: number;

  winningTeamExpectedPercent: number;

  upsetScore: number;

  scoreA: number;

  scoreB: number;
};

export type SessionBestMatchInsight = {
  matchId: string;

  round: number;

  court: number;

  scoreA: number;

  scoreB: number;

  pointDifference: number;

  totalPoints: number;

  qualityScore: number;

  teamAMemberIds: string[];

  teamBMemberIds: string[];

  teamAMemberNames: string[];

  teamBMemberNames: string[];
};

export type SessionInsightMemberSummary =
  SessionInsightMember & {
    mode: SessionMode;

    matches: number;

    wins: number;

    losses: number;

    winRate: number;

    pointsFor: number;

    pointsAgainst: number;

    pointDifference: number;

    restRounds: number;
  };

export type SessionInsights = {
  sessionId: string;

  sessionDate: string;

  mode: SessionMode;

  totalMembers: number;

  totalRounds: number;

  totalScheduledMatches: number;

  completedMatches: number;

  pendingMatches: number;

  completionPercent: number;

  isCompleted: boolean;

  mvp: SessionMvpInsight | null;

  mostImproved:
    | SessionMostImprovedInsight
    | null;

  longestWinStreak:
    | SessionWinStreakInsight
    | null;

  bestPartnership:
    | SessionPartnershipInsight
    | null;

  mostRest:
    | SessionRestInsight
    | null;

  mostFrequentOpponent:
    | SessionOpponentInsight
    | null;

  biggestUpset:
    | SessionUpsetInsight
    | null;

  bestMatch:
    | SessionBestMatchInsight
    | null;

  memberSummaries:
    SessionInsightMemberSummary[];
};

export type BuildSessionInsightsParams = {
  session: SessionRecord;

  members: Member[];

  matches: MatchRecord[];

  schedule: GeneratedSchedule;
};

/**
 * Phase 1 chỉ xây dựng:
 *
 * - dữ liệu đầu vào đã chuẩn hóa;
 * - tiến độ session;
 * - thống kê cơ bản từng thành viên;
 * - cấu trúc trả về hoàn chỉnh.
 *
 * Các insight nâng cao sẽ được bổ sung lần lượt
 * ở những phase tiếp theo.
 */
export function buildSessionInsights({
  session,
  members,
  matches,
  schedule,
}: BuildSessionInsightsParams): SessionInsights {
  const memberMap =
    buildMemberMap(members);

  const sessionMemberIds =
    uniqueIds(session.memberIds);

  const sessionMatches =
    normalizeSessionMatches({
      sessionId: session.id,
      matches,
    });

  const completedMatches =
    sessionMatches.filter(
      isCompletedMatch
    );

  const totalScheduledMatches =
    countScheduledMatches(schedule);

  const pendingMatches =
    Math.max(
      0,
      totalScheduledMatches -
        completedMatches.length
    );

  const totalRounds =
    Array.isArray(schedule.rounds)
      ? schedule.rounds.length
      : Math.max(
          0,
          Math.floor(
            Number(
              schedule.totalRounds ?? 0
            )
          )
        );

  const memberSummaries =
    buildMemberSummaries({
      memberIds: sessionMemberIds,

      memberMap,

      completedMatches,

      schedule,

      mode: session.mode,
    });

  const completionPercent =
    calculateCompletionPercent({
      completedMatches:
        completedMatches.length,

      totalScheduledMatches,
    });

  const isCompleted =
    totalScheduledMatches > 0 &&
    completedMatches.length >=
      totalScheduledMatches;

  return {
    sessionId: session.id,

    sessionDate: session.date,

    mode: session.mode,

    totalMembers:
      sessionMemberIds.length,

    totalRounds,

    totalScheduledMatches,

    completedMatches:
      completedMatches.length,

    pendingMatches,

    completionPercent,

    isCompleted,

    mvp: null,

    mostImproved: null,

    longestWinStreak: null,

    bestPartnership: null,

    mostRest: null,

    mostFrequentOpponent: null,

    biggestUpset: null,

    bestMatch: null,

    memberSummaries,
  };
}

function buildMemberSummaries({
  memberIds,
  memberMap,
  completedMatches,
  schedule,
  mode,
}: {
  memberIds: string[];

  memberMap: Map<string, Member>;

  completedMatches: MatchRecord[];

  schedule: GeneratedSchedule;

  mode: SessionMode;
}): SessionInsightMemberSummary[] {
  const summaries =
    new Map<
      string,
      SessionInsightMemberSummary
    >();

  for (const memberId of memberIds) {
    const member =
      memberMap.get(memberId);

    summaries.set(
      memberId,
      {
        memberId,

        memberName:
          member?.name ??
          memberId,

        nickname:
          member?.nickname,

        mode,

        matches: 0,

        wins: 0,

        losses: 0,

        winRate: 0,

        pointsFor: 0,

        pointsAgainst: 0,

        pointDifference: 0,

        restRounds: 0,
      }
    );
  }

  for (
    const match of completedMatches
  ) {
    const teamAWon =
      match.scoreA >
      match.scoreB;

    applyMatchToMemberSummaries({
      memberIds:
        match.teamA.memberIds,

      scoreFor:
        match.scoreA,

      scoreAgainst:
        match.scoreB,

      won: teamAWon,

      summaries,
    });

    applyMatchToMemberSummaries({
      memberIds:
        match.teamB.memberIds,

      scoreFor:
        match.scoreB,

      scoreAgainst:
        match.scoreA,

      won: !teamAWon,

      summaries,
    });
  }

  if (
    Array.isArray(schedule.rounds)
  ) {
    for (
      const round of schedule.rounds
    ) {
      for (
        const restingMemberId of
        round.restingMemberIds ?? []
      ) {
        const summary =
          summaries.get(
            restingMemberId
          );

        if (!summary) {
          continue;
        }

        summary.restRounds += 1;
      }
    }
  }

  for (
    const summary of
    summaries.values()
  ) {
    summary.pointDifference =
      summary.pointsFor -
      summary.pointsAgainst;

    summary.winRate =
      calculateWinRate({
        wins: summary.wins,

        matches:
          summary.matches,
      });
  }

  return [
    ...summaries.values(),
  ].sort((first, second) =>
    first.memberName.localeCompare(
      second.memberName,
      "vi"
    )
  );
}

function applyMatchToMemberSummaries({
  memberIds,
  scoreFor,
  scoreAgainst,
  won,
  summaries,
}: {
  memberIds: string[];

  scoreFor: number;

  scoreAgainst: number;

  won: boolean;

  summaries: Map<
    string,
    SessionInsightMemberSummary
  >;
}): void {
  for (
    const memberId of
    uniqueIds(memberIds)
  ) {
    const summary =
      summaries.get(memberId);

    if (!summary) {
      continue;
    }

    summary.matches += 1;

    summary.wins +=
      won ? 1 : 0;

    summary.losses +=
      won ? 0 : 1;

    summary.pointsFor +=
      scoreFor;

    summary.pointsAgainst +=
      scoreAgainst;
  }
}

function buildMemberMap(
  members: Member[]
): Map<string, Member> {
  const memberMap =
    new Map<string, Member>();

  if (!Array.isArray(members)) {
    return memberMap;
  }

  for (const member of members) {
    if (
      !member ||
      typeof member.id !==
        "string" ||
      !member.id.trim()
    ) {
      continue;
    }

    memberMap.set(
      member.id,
      member
    );
  }

  return memberMap;
}

function normalizeSessionMatches({
  sessionId,
  matches,
}: {
  sessionId: string;

  matches: MatchRecord[];
}): MatchRecord[] {
  if (!Array.isArray(matches)) {
    return [];
  }

  const matchMap =
    new Map<
      string,
      MatchRecord
    >();

  for (const match of matches) {
    if (
      !match ||
      match.sessionId !==
        sessionId
    ) {
      continue;
    }

    matchMap.set(
      match.id,
      match
    );
  }

  return [
    ...matchMap.values(),
  ].sort(compareMatches);
}

function isCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(
      match.scoreA
    ) ||
    !Number.isFinite(
      match.scoreB
    )
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
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  return (
    match.scoreA !==
    match.scoreB
  );
}

function countScheduledMatches(
  schedule: GeneratedSchedule
): number {
  if (
    !Array.isArray(
      schedule.rounds
    )
  ) {
    return 0;
  }

  return schedule.rounds.reduce(
    (total, round) =>
      total +
      (
        Array.isArray(
          round.matches
        )
          ? round.matches.length
          : 0
      ),
    0
  );
}

function calculateCompletionPercent({
  completedMatches,
  totalScheduledMatches,
}: {
  completedMatches: number;

  totalScheduledMatches: number;
}): number {
  if (
    totalScheduledMatches <= 0
  ) {
    return 0;
  }

  return clampNumber(
    Math.round(
      (
        completedMatches /
        totalScheduledMatches
      ) *
        100
    ),
    0,
    100
  );
}

function calculateWinRate({
  wins,
  matches,
}: {
  wins: number;

  matches: number;
}): number {
  if (matches <= 0) {
    return 0;
  }

  return roundToTwoDecimals(
    (
      wins /
      matches
    ) *
      100
  );
}

function compareMatches(
  first: MatchRecord,
  second: MatchRecord
): number {
  if (
    first.round !==
    second.round
  ) {
    return (
      first.round -
      second.round
    );
  }

  const firstCourt =
    first.court ?? 1;

  const secondCourt =
    second.court ?? 1;

  if (
    firstCourt !==
    secondCourt
  ) {
    return (
      firstCourt -
      secondCourt
    );
  }

  return first.id.localeCompare(
    second.id
  );
}

function uniqueIds(
  memberIds: string[]
): string[] {
  if (
    !Array.isArray(memberIds)
  ) {
    return [];
  }

  return [
    ...new Set(
      memberIds.filter(
        (memberId) =>
          typeof memberId ===
            "string" &&
          memberId.trim()
      )
    ),
  ];
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

function roundToTwoDecimals(
  value: number
): number {
  return (
    Math.round(value * 100) /
    100
  );
}