import type {
  CompletedMatchRawStats,
  MatchAnalysisResult,
  MemberRawStats,
  PairRawStats,
} from "./match-analyzer";

import type {
  BestPartnershipHighlight,
  LongestWinStreakHighlight,
  MatchOfTheDayHighlight,
  MostEfficientPlayerHighlight,
  MostRestedPlayerHighlight,
  SessionHighlights,
} from "./types";

/* =========================================================
   Public Builder
========================================================= */

export function buildSessionHighlights(
  analysis: MatchAnalysisResult
): SessionHighlights {
  return {
    bestPartnership: buildBestPartnership(analysis),
    matchOfTheDay: buildMatchOfTheDay(analysis),
    mostEfficientPlayer: buildMostEfficientPlayer(analysis),
    longestWinStreak: buildLongestWinStreak(analysis),
    mostRestedPlayer: buildMostRestedPlayer(analysis),
  };
}

/* =========================================================
   Best Partnership
========================================================= */

function buildBestPartnership(
  analysis: MatchAnalysisResult
): BestPartnershipHighlight | undefined {
  const pairs = Object.values(analysis.pairStats).filter(
    (pair) => pair.matches > 0
  );

  if (pairs.length === 0) return undefined;

  const bestPair = [...pairs].sort(comparePartnerships)[0];

  return {
    memberIds: bestPair.memberIds,

    matches: bestPair.matches,

    wins: bestPair.wins,

    losses: bestPair.losses,

    draws: bestPair.draws,

    winRate: calculateRate(bestPair.wins, bestPair.matches),

    pointDiff: bestPair.pointsFor - bestPair.pointsAgainst,
  };
}

function comparePartnerships(
  first: PairRawStats,
  second: PairRawStats
): number {
  const firstWinRate = calculateRate(first.wins, first.matches);

  const secondWinRate = calculateRate(second.wins, second.matches);

  if (firstWinRate !== secondWinRate) {
    return secondWinRate - firstWinRate;
  }

  if (first.wins !== second.wins) {
    return second.wins - first.wins;
  }

  const firstPointDiff = first.pointsFor - first.pointsAgainst;

  const secondPointDiff = second.pointsFor - second.pointsAgainst;

  if (firstPointDiff !== secondPointDiff) {
    return secondPointDiff - firstPointDiff;
  }

  if (first.matches !== second.matches) {
    return second.matches - first.matches;
  }

  return first.key.localeCompare(second.key);
}

/* =========================================================
   Match Of The Day
========================================================= */

function buildMatchOfTheDay(
  analysis: MatchAnalysisResult
): MatchOfTheDayHighlight | undefined {
  if (analysis.completedMatches.length === 0) return undefined;

  const bestMatch = [...analysis.completedMatches].sort(
    compareMatchesOfTheDay
  )[0];

  return {
    round: bestMatch.round,

    court: bestMatch.court,

    teamAMemberIds: [...bestMatch.teamAMemberIds],

    teamBMemberIds: [...bestMatch.teamBMemberIds],

    scoreA: bestMatch.scoreA,

    scoreB: bestMatch.scoreB,

    pointDiff: bestMatch.pointDiff,

    totalPoints: bestMatch.totalPoints,
  };
}

function compareMatchesOfTheDay(
  first: CompletedMatchRawStats,
  second: CompletedMatchRawStats
): number {
  if (first.pointDiff !== second.pointDiff) {
    return first.pointDiff - second.pointDiff;
  }

  if (first.totalPoints !== second.totalPoints) {
    return second.totalPoints - first.totalPoints;
  }

  if (first.round !== second.round) {
    return first.round - second.round;
  }

  return first.court - second.court;
}

/* =========================================================
   Most Efficient Player
========================================================= */

function buildMostEfficientPlayer(
  analysis: MatchAnalysisResult
): MostEfficientPlayerHighlight | undefined {
  const members = Object.values(analysis.memberStats).filter(
    (member) => member.completedMatches > 0
  );

  if (members.length === 0) return undefined;

  const bestMember = [...members].sort(compareEfficientPlayers)[0];

  return {
    memberId: bestMember.memberId,

    score: calculateEfficiencyScore(bestMember),
  };
}

function compareEfficientPlayers(
  first: MemberRawStats,
  second: MemberRawStats
): number {
  const firstScore = calculateEfficiencyScore(first);

  const secondScore = calculateEfficiencyScore(second);

  if (firstScore !== secondScore) {
    return secondScore - firstScore;
  }

  const firstWinRate = calculateRate(
    first.wins,
    first.completedMatches
  );

  const secondWinRate = calculateRate(
    second.wins,
    second.completedMatches
  );

  if (firstWinRate !== secondWinRate) {
    return secondWinRate - firstWinRate;
  }

  const firstPointDiff = first.pointsFor - first.pointsAgainst;

  const secondPointDiff = second.pointsFor - second.pointsAgainst;

  if (firstPointDiff !== secondPointDiff) {
    return secondPointDiff - firstPointDiff;
  }

  if (first.wins !== second.wins) {
    return second.wins - first.wins;
  }

  return first.memberId.localeCompare(second.memberId);
}

function calculateEfficiencyScore(member: MemberRawStats): number {
  if (member.completedMatches <= 0) return 0;

  const winRateScore =
    calculateRate(member.wins, member.completedMatches) * 100;

  const pointDiff = member.pointsFor - member.pointsAgainst;

  const averagePointDiff = pointDiff / member.completedMatches;

  return roundToTwoDecimals(winRateScore + averagePointDiff);
}

/* =========================================================
   Longest Win Streak
========================================================= */

function buildLongestWinStreak(
  analysis: MatchAnalysisResult
): LongestWinStreakHighlight | undefined {
  const candidates = Object.values(analysis.memberStats)
    .map((member) => ({
      memberId: member.memberId,

      streak: calculateLongestWinStreak(member),
    }))
    .filter((candidate) => candidate.streak > 0);

  if (candidates.length === 0) return undefined;

  candidates.sort((first, second) => {
    if (first.streak !== second.streak) {
      return second.streak - first.streak;
    }

    return first.memberId.localeCompare(second.memberId);
  });

  return candidates[0];
}

function calculateLongestWinStreak(
  member: MemberRawStats
): number {
  let currentStreak = 0;

  let longestStreak = 0;

  for (const outcome of member.resultSequence) {
    if (outcome === "W") {
      currentStreak += 1;

      longestStreak = Math.max(longestStreak, currentStreak);

      continue;
    }

    currentStreak = 0;
  }

  return longestStreak;
}

/* =========================================================
   Most Rested Player
========================================================= */

function buildMostRestedPlayer(
  analysis: MatchAnalysisResult
): MostRestedPlayerHighlight | undefined {
  const candidates = Object.values(analysis.memberStats)
    .map((member) => ({
      memberId: member.memberId,

      restedRounds: member.restedRounds.length,
    }))
    .filter((candidate) => candidate.restedRounds > 0);

  if (candidates.length === 0) return undefined;

  candidates.sort((first, second) => {
    if (first.restedRounds !== second.restedRounds) {
      return second.restedRounds - first.restedRounds;
    }

    return first.memberId.localeCompare(second.memberId);
  });

  return candidates[0];
}

/* =========================================================
   Shared Helpers
========================================================= */

function calculateRate(
  numerator: number,
  denominator: number
): number {
  if (denominator <= 0) return 0;

  return numerator / denominator;
}

function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}