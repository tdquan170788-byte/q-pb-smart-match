import type {
  MatchRecord,
  SessionRecord,
} from "@/types";

export type TeamSessionWinner =
  | "team-a"
  | "team-b"
  | "draw"
  | "pending";

export type TeamSessionMatchSummary = {
  matchId: string;

  round: number;
  court: number;

  scoreA: number;
  scoreB: number;

  winner:
    | "team-a"
    | "team-b"
    | "draw";
};

export type TeamSessionSideSummary = {
  matchWins: number;
  matchLosses: number;
  matchDraws: number;

  pointsFor: number;
  pointsAgainst: number;

  pointDifference: number;
};

export type TeamSessionSummary = {
  sessionId: string;

  isTeamMode: boolean;

  totalScheduledMatches: number;
  completedMatches: number;
  pendingMatches: number;

  completionPercent: number;

  teamA: TeamSessionSideSummary;
  teamB: TeamSessionSideSummary;

  winner: TeamSessionWinner;

  isCompleted: boolean;

  matchSummaries: TeamSessionMatchSummary[];
};

type BuildTeamSessionSummaryParams = {
  session: SessionRecord;

  savedMatches: MatchRecord[];

  /**
   * Tổng số trận trong lịch đấu.
   *
   * Nên truyền schedule.rounds.flatMap(...).length
   * để Progress chính xác cả với những trận chưa lưu.
   */
  totalScheduledMatches?: number;
};

/**
 * Tổng hợp kết quả chung cuộc của một Team Session.
 *
 * Quy tắc:
 *
 * - Mỗi Match thắng được tính 1 điểm chung cuộc.
 * - Trận hòa không xác định đội thắng và được ghi riêng.
 * - Trận 0-0 được coi là chưa thi đấu.
 * - Winner chỉ được công bố chính thức khi toàn bộ trận
 *   trong lịch đã có kết quả.
 */
export function buildTeamSessionSummary({
  session,
  savedMatches,
  totalScheduledMatches,
}: BuildTeamSessionSummaryParams): TeamSessionSummary {
  const isTeamMode =
    session.mode === "team";

  if (!isTeamMode) {
    return createEmptySummary({
      sessionId: session.id,
      isTeamMode: false,
      totalScheduledMatches:
        normalizeNonNegativeInteger(
          totalScheduledMatches,
          0
        ),
    });
  }

  const validSessionMatches =
    savedMatches
      .filter(
        (match) =>
          match.sessionId === session.id
      )
      .filter(isCompletedMatch)
      .sort(compareMatches);

  const matchSummaries =
    validSessionMatches.map(
      createMatchSummary
    );

  const completedMatches =
    matchSummaries.length;

  const normalizedScheduledMatches =
    Math.max(
      completedMatches,
      normalizeNonNegativeInteger(
        totalScheduledMatches,
        completedMatches
      )
    );

  const pendingMatches =
    Math.max(
      0,
      normalizedScheduledMatches -
        completedMatches
    );

  const teamA =
    createSideSummary({
      matchSummaries,
      side: "team-a",
    });

  const teamB =
    createSideSummary({
      matchSummaries,
      side: "team-b",
    });

  const isCompleted =
    normalizedScheduledMatches > 0 &&
    completedMatches >=
      normalizedScheduledMatches;

  const winner =
    determineTeamSessionWinner({
      teamA,
      teamB,
      completedMatches,
      isCompleted,
    });

  return {
    sessionId: session.id,

    isTeamMode: true,

    totalScheduledMatches:
      normalizedScheduledMatches,

    completedMatches,

    pendingMatches,

    completionPercent:
      calculateCompletionPercent({
        completedMatches,
        totalScheduledMatches:
          normalizedScheduledMatches,
      }),

    teamA,

    teamB,

    winner,

    isCompleted,

    matchSummaries,
  };
}

function createEmptySummary({
  sessionId,
  isTeamMode,
  totalScheduledMatches,
}: {
  sessionId: string;

  isTeamMode: boolean;

  totalScheduledMatches: number;
}): TeamSessionSummary {
  const emptySide =
    createEmptySideSummary();

  return {
    sessionId,

    isTeamMode,

    totalScheduledMatches,

    completedMatches: 0,

    pendingMatches:
      totalScheduledMatches,

    completionPercent: 0,

    teamA: {
      ...emptySide,
    },

    teamB: {
      ...emptySide,
    },

    winner: "pending",

    isCompleted: false,

    matchSummaries: [],
  };
}

function createEmptySideSummary(): TeamSessionSideSummary {
  return {
    matchWins: 0,
    matchLosses: 0,
    matchDraws: 0,

    pointsFor: 0,
    pointsAgainst: 0,

    pointDifference: 0,
  };
}

function createMatchSummary(
  match: MatchRecord
): TeamSessionMatchSummary {
  return {
    matchId: match.id,

    round: match.round,

    court: match.court ?? 1,

    scoreA: match.scoreA,

    scoreB: match.scoreB,

    winner:
      match.scoreA > match.scoreB
        ? "team-a"
        : match.scoreB > match.scoreA
          ? "team-b"
          : "draw",
  };
}

function createSideSummary({
  matchSummaries,
  side,
}: {
  matchSummaries:
    TeamSessionMatchSummary[];

  side: "team-a" | "team-b";
}): TeamSessionSideSummary {
  let matchWins = 0;
  let matchLosses = 0;
  let matchDraws = 0;

  let pointsFor = 0;
  let pointsAgainst = 0;

  for (
    const match of matchSummaries
  ) {
    const isTeamA =
      side === "team-a";

    const sideScore =
      isTeamA
        ? match.scoreA
        : match.scoreB;

    const opponentScore =
      isTeamA
        ? match.scoreB
        : match.scoreA;

    pointsFor += sideScore;
    pointsAgainst += opponentScore;

    if (match.winner === "draw") {
      matchDraws += 1;
      continue;
    }

    const sideWon =
      match.winner === side;

    if (sideWon) {
      matchWins += 1;
    } else {
      matchLosses += 1;
    }
  }

  return {
    matchWins,

    matchLosses,

    matchDraws,

    pointsFor,

    pointsAgainst,

    pointDifference:
      pointsFor - pointsAgainst,
  };
}

function determineTeamSessionWinner({
  teamA,
  teamB,
  completedMatches,
  isCompleted,
}: {
  teamA: TeamSessionSideSummary;

  teamB: TeamSessionSideSummary;

  completedMatches: number;

  isCompleted: boolean;
}): TeamSessionWinner {
  if (
    completedMatches === 0 ||
    !isCompleted
  ) {
    return "pending";
  }

  if (
    teamA.matchWins >
    teamB.matchWins
  ) {
    return "team-a";
  }

  if (
    teamB.matchWins >
    teamA.matchWins
  ) {
    return "team-b";
  }

  return "draw";
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
      (completedMatches /
        totalScheduledMatches) *
        100
    ),
    0,
    100
  );
}

function isCompletedMatch(
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

  /**
   * Match mặc định mới tạo là 0-0,
   * nên chưa được tính là đã thi đấu.
   */
  if (
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  return true;
}

function compareMatches(
  firstMatch: MatchRecord,
  secondMatch: MatchRecord
): number {
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

function normalizeNonNegativeInteger(
  value: unknown,
  fallback: number
): number {
  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(parsedValue)
  );
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}
