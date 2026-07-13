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
    Array.isArray(schedule.rounds