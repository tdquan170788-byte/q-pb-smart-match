export type SessionMode = "normal" | "team";

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;

  // overall legacy / tổng hợp
  rating: number;
  wins: number;
  losses: number;
  matches: number;

  // normal mode
  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

  // team mode
  ratingTeam: number;
  winsTeam: number;
  lossesTeam: number;
  matchesTeam: number;
  pointsForTeam: number;
  pointsAgainstTeam: number;
};

export type MatchSide = {
  memberIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court?: number;
  teamA: MatchSide;
  teamB: MatchSide;
  scoreA: number;
  scoreB: number;
  createdAt?: string;
};

export type SessionTeamConfig = {
  teamAMemberIds: string[];
  teamBMemberIds: string[];
};

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt: string;
  mode?: SessionMode;
  courtCount?: number;
  teamConfig?: SessionTeamConfig;
};

export type PlayerForm = {
  name: string;
  nickname?: string;
};
