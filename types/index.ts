export type SessionMode = "normal" | "team";

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt?: string;

  // legacy / overall
  rating: number;
  wins: number;
  losses: number;
  matches: number;

  // normal mode stats
  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

  // team mode stats
  ratingTeam: number;
  winsTeam: number;
  lossesTeam: number;
  matchesTeam: number;
  pointsForTeam: number;
  pointsAgainstTeam: number;
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

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;

  mode?: SessionMode;
  courtCount?: number;

  teamConfig?: {
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
};

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
  totalRounds: number;
  rounds: GeneratedRound[];
};

export type PlayerForm = {
  name: string;
  nickname?: string;
};