import type { Member, SessionMode } from "./domain";

export type RankingMode = SessionMode;

export type MatchResult = "win" | "loss" | "draw";
export type LastResult = "W" | "L" | "D";
export type StreakType = "win" | "loss" | "draw" | "none";

export type MemberSummary = {
  rating: number;
  rankScore: number;

  wins: number;
  losses: number;
  draws: number;
  matches: number;

  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  streakType: StreakType;
  streakCount: number;
};

export type RankingRow = {
  memberId: string;
  memberName: string;
  nickname?: string;

  rating: number;
  rankScore: number;

  wins: number;
  losses: number;
  draws: number;
  matches: number;

  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  last5: LastResult[];
};

export type RankingRebuildResult = {
  members: Member[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
};

export type RecentMatchItem = {
  matchId: string;
  sessionId: string;
  mode: SessionMode;
  round: number;
  court?: number;
  scoreFor: number;
  scoreAgainst: number;
  result: MatchResult;
  partnerMemberIds: string[];
  partnerNames: string[];
  opponentMemberIds: string[];
  opponentNames: string[];
  playedAt?: string;
};

export type PartnerStatItem = {
  memberId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
};

export type OpponentStatItem = {
  memberId: string;
  name: string;
  count: number;
  winsAgainst: number;
  lossesAgainst: number;
};

export type MemberDetailStats = {
  member: Member;
  summary: MemberSummary;
  summaryNormal: MemberSummary;
  summaryTeam: MemberSummary;
  recentMatches: RecentMatchItem[];
  topPartners: PartnerStatItem[];
  topOpponents: OpponentStatItem[];
};
