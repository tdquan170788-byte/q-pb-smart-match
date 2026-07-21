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

  pointsFor: number;

  pointsAgainst: number;

  pointDiff: number;

  winRate: number;

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
   Session Summary
========================================================= */

export interface SessionSummary {
  overview: SessionOverview;

  players: PlayerSessionSummary[];

  teams?: TeamSessionSummary[];
}