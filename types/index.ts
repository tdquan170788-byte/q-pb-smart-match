/* =========================================================
   CORE DOMAIN TYPES
========================================================= */

export type SessionMode = "normal" | "team";

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt?: string;

  /* ---------- Legacy fields (giữ để không vỡ code cũ) ---------- */
  rating?: number;
  wins?: number;
  losses?: number;
  matches?: number;

  /* ---------- Ranking Pro: Normal ---------- */
  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

  /* ---------- Ranking Pro: Team ---------- */
  ratingTeam: number;
  winsTeam: number;
  lossesTeam: number;
  matchesTeam: number;
  pointsForTeam: number;
  pointsAgainstTeam: number;
};

export type PlayerForm = {
  name: string;
  nickname?: string;
};

export type TeamRef = {
  playerIds: string[];
};

export type SessionTeamConfig = {
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court?: number;

  teamA: TeamRef;
  teamB: TeamRef;

  scoreA: number;
  scoreB: number;

  createdAt?: string;
};

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;

  /* Sprint 8+ */
  mode?: SessionMode;
  courtCount?: number;
  teamConfig?: SessionTeamConfig;
};

/* =========================================================
   SCHEDULER / SESSION VIEW TYPES
========================================================= */

export type ScheduledMatch = {
  id: string;
  round: number;
  court: number;

  teamA: string[];
  teamB: string[];

  restingPlayerIds?: string[];

  scoreA?: number;
  scoreB?: number;
  completed?: boolean;
};

export type SessionRound = {
  round: number;
  matches: ScheduledMatch[];
  restingPlayerIds: string[];
  completed: boolean;
};

export type GeneratedSchedule = {
  sessionId: string;
  rounds: SessionRound[];
  totalRounds: number;
};

export type ScheduleStats = {
  matchesByPlayer: Record<string, number>;
  restsByPlayer: Record<string, number>;
};

/* =========================================================
   RANKING PRO
========================================================= */

export type RankingMode = "normal" | "team";

export type RankingLastResult = "W" | "L";

export type RankingRow = {
  playerId: string;
  playerName: string;
  nickname?: string;

  rating: number;
  matches: number;
  wins: number;
  losses: number;

  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  winRate: number;
  last5: RankingLastResult[];
};

export type RankingBuildResult = {
  players: Player[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
};