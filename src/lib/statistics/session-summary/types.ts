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
  /* Member */

  memberId: string;

  /* Match Statistics */

  matches: number;

  completedMatches: number;

  wins: number;

  losses: number;

  draws: number;

  winRate: number;

  /* Points */

  pointsFor: number;

  pointsAgainst: number;

  pointDiff: number;

  averagePointsFor: number;

  averagePointsAgainst: number;

  /* Streak */

  currentWinStreak: number;

  longestWinStreak: number;

  currentLoseStreak: number;

  longestLoseStreak: number;

  /* Participation */

  playedRounds: number[];

  restedRounds: number[];

  /* Relationship */

  partnerIds: string[];

  opponentIds: string[];

  /* Rating */

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