export type SessionMode = "normal" | "team";

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;
};

export type MatchSide = {
  memberIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court: number;
  teamA: MatchSide;
  teamB: MatchSide;
  scoreA: number;
  scoreB: number;
  createdAt: string;
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
  mode: SessionMode;
  courtCount: number;
  teamConfig?: SessionTeamConfig;
};

/* =========================================================
   UI / FORM TYPES
========================================================= */

export type PlayerForm = {
  name: string;
  nickname?: string;
};