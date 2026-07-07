export type Player = {
  id: string;
  name: string;
  nickname?: string;
  rating?: number;
};

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court: number;
  teamA: {
    playerIds: string[];
  };
  teamB: {
    playerIds: string[];
  };
  scoreA: number;
  scoreB: number;
  createdAt?: string;
};

export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};

export type CreateSessionInput = {
  date: string;
  pointToWin: number;
  participantIds: string[];
};

export type CreateMatchInput = {
  sessionId: string;
  round: number;
  court: number;
  teamA: {
    playerIds: string[];
  };
  teamB: {
    playerIds: string[];
  };
  scoreA: number;
  scoreB: number;
};