/* =========================================================
   CORE DOMAIN TYPES
========================================================= */

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  rating?: number;
  wins?: number;
  losses?: number;
  matches?: number;
  createdAt?: string;
};

export type PlayerForm = {
  name: string;
  nickname?: string;
};

export type TeamRef = {
  playerIds: string[];
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

export type SessionMode = "normal" | "team";

export type SessionTeamConfig = {
  teamAName?: string;
  teamBName?: string;
  teamAPlayerIds: string[];
  teamBPlayerIds: string[];
};

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;

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