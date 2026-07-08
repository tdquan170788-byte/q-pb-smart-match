export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt?: string;

  /**
   * Legacy overall stats
   * - dùng để tương thích với code cũ / trang members cũ
   */
  rating?: number;
  wins?: number;
  losses?: number;
  matches?: number;

  /**
   * Sprint 9A - mode normal
   */
  ratingNormal?: number;
  winsNormal?: number;
  lossesNormal?: number;
  matchesNormal?: number;
  pointsForNormal?: number;
  pointsAgainstNormal?: number;

  /**
   * Sprint 9A - mode team
   */
  ratingTeam?: number;
  winsTeam?: number;
  lossesTeam?: number;
  matchesTeam?: number;
  pointsForTeam?: number;
  pointsAgainstTeam?: number;
};

export type SessionMode = "normal" | "team";

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;

  /**
   * normal = ghép trận tự do / round robin / smart match
   * team   = đánh theo 2 đội cố định
   */
  mode?: SessionMode;

  /**
   * số sân trong session
   */
  courtCount?: number;

  /**
   * chỉ dùng cho session mode = "team"
   */
  teamConfig?: {
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
};

export type MatchTeam = {
  playerIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court?: number;

  teamA: MatchTeam;
  teamB: MatchTeam;

  scoreA: number;
  scoreB: number;

  createdAt?: string;
};

/* =========================================================
   MATCH GENERATOR / SESSION DETAIL
========================================================= */

export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};

export type GeneratedRound = {
  round: number;
  matches: ScheduledMatch[];
  restingPlayerIds: string[];
};

export type GeneratedSchedule = {
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
};

/* =========================================================
   UI / FORM TYPES
========================================================= */

export type PlayerForm = {
  name: string;
  nickname?: string;
};

export type SessionForm = {
  date: string;
  pointToWin: number;
  participantIds: string[];
  mode?: SessionMode;
  courtCount?: number;
  teamConfig?: {
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
};