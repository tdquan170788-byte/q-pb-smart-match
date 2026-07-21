import type { TeamSessionSummary } from "./types";
import type {
  MatchAnalysisResult,
  TeamRawStats,
} from "./match-analyzer";

export interface BuildTeamSummariesInput {
  analysis: MatchAnalysisResult;
}

export function buildTeamSummaries(
  input: BuildTeamSummariesInput
): TeamSessionSummary[] {
  const { analysis } = input;

  return [
    buildTeamSummary(analysis.teamStats.A),
    buildTeamSummary(analysis.teamStats.B),
  ];
}

export function buildTeamSummary(
  stats: TeamRawStats
): TeamSessionSummary {
  const pointDiff =
    stats.pointsFor - stats.pointsAgainst;

  return {
    team: stats.team,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    pointsFor: stats.pointsFor,
    pointsAgainst: stats.pointsAgainst,
    pointDiff,
    winRate: calculateWinRate(
      stats.wins,
      stats.completedMatches
    ),
  };
}

function calculateWinRate(
  wins: number,
  completedMatches: number
): number {
  if (completedMatches <= 0) {
    return 0;
  }

  return roundToTwoDecimals(
    wins / completedMatches
  );
}

function roundToTwoDecimals(
  value: number
): number {
  return Math.round(value * 100) / 100;
}
