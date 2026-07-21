export type MatchOutcome = "W" | "L" | "D";

/* =========================================================
   Member Statistics
========================================================= */

export interface MemberRawStats {
  memberId: string;

  matches: number;
  completedMatches: number;

  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;

  playedRounds: number[];
  restedRounds: number[];

  partnerIds: string[];
  opponentIds: string[];

  resultSequence: MatchOutcome[];
}

/* =========================================================
   Team Statistics
========================================================= */

export interface TeamRawStats {
  team: "A" | "B";

  matches: number;
  completedMatches: number;

  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;

  resultSequence: MatchOutcome[];
}

/* =========================================================
   Partner Pair Statistics
========================================================= */

export interface PairRawStats {
  key: string;

  memberIds: [string, string];

  matches: number;

  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;
}

/* =========================================================
   Opponent Pair Statistics
========================================================= */

export interface OpponentPairRawStats {
  key: string;

  memberAId: string;
  memberBId: string;

  matches: number;

  memberAWins: number;
  memberBWins: number;
  draws: number;

  memberAPoints: number;
  memberBPoints: number;
}

/* =========================================================
   Round Statistics
========================================================= */

export interface RoundRawStats {
  round: number;

  savedMatches: number;
  completedMatches: number;

  totalPoints: number;

  highestScore: number;

  closestPointDiff?: number;
}

/* =========================================================
   Session Statistics
========================================================= */

export interface SessionRawStats {
  savedMatches: number;
  completedMatches: number;

  totalPoints: number;

  highestScore: number;

  biggestPointDiff: number;

  closestPointDiff?: number;
}

/* =========================================================
   Analysis Result
========================================================= */

export interface MatchAnalysisResult {
  memberStats: Record<string, MemberRawStats>;

  teamStats: {
    A: TeamRawStats;
    B: TeamRawStats;
  };

  pairStats: Record<string, PairRawStats>;

  opponentStats: Record<
    string,
    OpponentPairRawStats
  >;

  roundStats: Record<number, RoundRawStats>;

  sessionStats: SessionRawStats;
}

/* =========================================================
   Internal Accumulator Types
========================================================= */

export interface MemberAccumulator {
  memberId: string;

  matches: number;
  completedMatches: number;

  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;

  playedRounds: Set<number>;
  restedRounds: Set<number>;

  partnerIds: Set<string>;
  opponentIds: Set<string>;

  resultSequence: MatchOutcome[];
}
