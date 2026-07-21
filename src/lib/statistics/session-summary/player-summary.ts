import type { PlayerSessionSummary } from "./types";

import type {
  MatchAnalysisResult,
  MatchOutcome,
  MemberRawStats,
} from "./match-analyzer";

/* =========================================================
   Public Types
========================================================= */

export interface PlayerRatingSnapshot {
  ratingBefore?: number;
  ratingAfter?: number;
  ratingChange?: number;
}

export type PlayerRatingSnapshotMap = Record<
  string,
  PlayerRatingSnapshot
>;

export interface BuildPlayerSummariesInput {
  analysis: MatchAnalysisResult;
  ratingSnapshot?: PlayerRatingSnapshotMap;
}

/* =========================================================
   Public Builders
========================================================= */

export function buildPlayerSummaries(
  input: BuildPlayerSummariesInput
): PlayerSessionSummary[] {
  const {
    analysis,
    ratingSnapshot = {},
  } = input;

  return Object.values(analysis.memberStats)
    .map((memberStats) =>
      buildPlayerSummary(
        memberStats,
        ratingSnapshot[memberStats.memberId]
      )
    )
    .sort((first, second) =>
      first.memberId.localeCompare(second.memberId)
    );
}

export function buildPlayerSummary(
  memberStats: MemberRawStats,
  ratingSnapshot?: PlayerRatingSnapshot
): PlayerSessionSummary {
  const completedMatches =
    memberStats.completedMatches;

  const pointDiff =
    memberStats.pointsFor -
    memberStats.pointsAgainst;

  const ratingBefore =
    ratingSnapshot?.ratingBefore;

  const ratingAfter =
    ratingSnapshot?.ratingAfter;

  const ratingChange =
    resolveRatingChange(ratingSnapshot);

  return {
    memberId: memberStats.memberId,

    matches: memberStats.matches,
    completedMatches,

    wins: memberStats.wins,
    losses: memberStats.losses,
    draws: memberStats.draws,

    winRate: calculateRate(
      memberStats.wins,
      completedMatches
    ),

    pointsFor: memberStats.pointsFor,
    pointsAgainst: memberStats.pointsAgainst,
    pointDiff,

    averagePointsFor: calculateAverage(
      memberStats.pointsFor,
      completedMatches
    ),

    averagePointsAgainst: calculateAverage(
      memberStats.pointsAgainst,
      completedMatches
    ),

    currentWinStreak: calculateCurrentStreak(
      memberStats.resultSequence,
      "W"
    ),

    longestWinStreak: calculateLongestStreak(
      memberStats.resultSequence,
      "W"
    ),

    currentLoseStreak: calculateCurrentStreak(
      memberStats.resultSequence,
      "L"
    ),

    longestLoseStreak: calculateLongestStreak(
      memberStats.resultSequence,
      "L"
    ),

    playedRounds: [...memberStats.playedRounds],
    restedRounds: [...memberStats.restedRounds],

    partnerIds: [...memberStats.partnerIds],
    opponentIds: [...memberStats.opponentIds],

    ...(ratingBefore !== undefined
      ? { ratingBefore }
      : {}),

    ...(ratingAfter !== undefined
      ? { ratingAfter }
      : {}),

    ...(ratingChange !== undefined
      ? { ratingChange }
      : {}),
  };
}

/* =========================================================
   Rating Helpers
========================================================= */

function resolveRatingChange(
  snapshot?: PlayerRatingSnapshot
): number | undefined {
  if (!snapshot) {
    return undefined;
  }

  if (snapshot.ratingChange !== undefined) {
    return roundToTwoDecimals(
      snapshot.ratingChange
    );
  }

  if (
    snapshot.ratingBefore !== undefined &&
    snapshot.ratingAfter !== undefined
  ) {
    return roundToTwoDecimals(
      snapshot.ratingAfter -
        snapshot.ratingBefore
    );
  }

  return undefined;
}

/* =========================================================
   Statistics Helpers
========================================================= */

function calculateRate(
  value: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return roundToTwoDecimals(value / total);
}

function calculateAverage(
  value: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return roundToTwoDecimals(value / total);
}

function calculateCurrentStreak(
  sequence: MatchOutcome[],
  target: MatchOutcome
): number {
  let streak = 0;

  for (
    let index = sequence.length - 1;
    index >= 0;
    index -= 1
  ) {
    if (sequence[index] !== target) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function calculateLongestStreak(
  sequence: MatchOutcome[],
  target: MatchOutcome
): number {
  let longest = 0;
  let current = 0;

  for (const result of sequence) {
    if (result === target) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

function roundToTwoDecimals(
  value: number
): number {
  return Math.round(value * 100) / 100;
}
