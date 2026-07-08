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

export type PlayerForm = {
  name: string;
  nickname?: string;
};

export type SessionStatus = "draft" | "in_progress" | "completed";

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt: string;
  status?: SessionStatus;
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court?: number;

  teamA: {
    playerIds: string[];
  };

  teamB: {
    playerIds: string[];
  };

  scoreA: number;
  scoreB: number;

  createdAt: string;
  updatedAt?: string;
};