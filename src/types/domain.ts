export type SessionMode = "normal" | "team";

export type Member = {
  id: string;

  name: string;
  nickname?: string;

  createdAt: string;

  rating: number;
  wins: number;
  losses: number;
  matches: number;

  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

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

  memberIds: string[];

  createdAt: string;

  mode: SessionMode;

  courtCount?: number;

  teamConfig?: SessionTeamConfig;
};

export type MemberForm = {
  name: string;
  nickname?: string;
};
