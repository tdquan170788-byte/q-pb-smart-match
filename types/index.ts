export type Player = {
  id: string;
  name: string;
  nickname?: string;
  rating: number;
  wins: number;
  losses: number;
  matches: number;
  createdAt: string;
};

export type MatchTeam = {
  playerIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  teamA: MatchTeam;
  teamB: MatchTeam;
  scoreA: number;
  scoreB: number;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt: string;
};

export type PlayerForm = {
  name: string;
  nickname: string;
};

export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};