/* =========================================================
   Session Summary
========================================================= */

export interface SessionOverview {
  sessionId: string;

  mode: "normal" | "team";

  totalMembers: number;

  totalRounds: number;

  totalMatches: number;

  completedMatches: number;

  unfinishedMatches: number;

  completionRate: number;

  winnerTeam?: "A" | "B";

  createdAt?: string;
}

/* =========================================================
   Player Summary
========================================================= */

export interface PlayerSessionSummary {
  memberId: string;

  matches: number;

  completedMatches: number;

  wins: number;

  losses: number;

  draws: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDiff: number;

  averagePointsFor: number;

  averagePointsAgainst: number;

  currentWinStreak: number;

  longestWinStreak: number;

  currentLoseStreak: number;

  longestLoseStreak: number;

  playedRounds: number[];

  restedRounds: number[];

  partnerIds: string[];

  opponentIds: string[];

  ratingBefore?: number;

  ratingAfter?: number;

  ratingChange?: number;
}

/* =========================================================
   Team Summary
========================================================= */

export interface TeamSessionSummary {
  team: "A" | "B";

  wins: number;

  losses: number;

  draws: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDiff: number;

  winRate: number;
}

/* =========================================================
   Session Highlights
========================================================= */

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

/* =========================================================
   Session Summary
========================================================= */

export interface SessionSummary {
  overview: SessionOverview;

  players: PlayerSessionSummary[];

  teams?: TeamSessionSummary[];

  highlights?: SessionHighlights;
}