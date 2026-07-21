import type {
  MatchAnalysisResult,
} from "./match-analyzer";

import type {
  MatchRecord,
  SessionRecord,
} from "@/types";

export interface BestPartnershipHighlight {
  memberIds: [string, string];

  matches: number;

  wins: number;

  losses: number;

  draws: number;

  winRate: number;

  pointDiff: number;
}

export interface MatchOfTheDayHighlight {
  round: number;

  court: number;

  teamAMemberIds: string[];

  teamBMemberIds: string[];

  scoreA: number;

  scoreB: number;

  pointDiff: number;

  totalPoints: number;
}

export interface MostEfficientPlayerHighlight {
  memberId: string;

  score: number;
}

export interface LongestWinStreakHighlight {
  memberId: string;

  streak: number;
}

export interface MostRestedPlayerHighlight {
  memberId: string;

  restedRounds: number;
}

export interface SessionHighlights {
  bestPartnership?: BestPartnershipHighlight;

  matchOfTheDay?: MatchOfTheDayHighlight;

  mostEfficientPlayer?: MostEfficientPlayerHighlight;

  longestWinStreak?: LongestWinStreakHighlight;

  mostRestedPlayer?: MostRestedPlayerHighlight;
}

export interface BuildSessionHighlightsInput {
  session: SessionRecord;

  savedMatches: MatchRecord[];

  analysis: MatchAnalysisResult;
}

export function buildSessionHighlights(
  _input: BuildSessionHighlightsInput
): SessionHighlights {
  return {};
}