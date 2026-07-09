export type SessionMode = "normal" | "team";
export type RankingMode = SessionMode;

export interface TeamSide {
  memberIds: string[];
}

export interface MatchRecord {
  id: string;
  sessionId: string;
  round: number;
  court?: number;

  teamA: TeamSide;
  teamB: TeamSide;

  scoreA: number;
  scoreB: number;
  createdAt?: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt: string;

  mode?: SessionMode;
  courtCount?: number;

  teamConfig?: {
    teamAMemberIds: string[];
    teamBMemberIds: string[];
  };
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;

  // legacy overall
  rating: number;
  wins: number;
  losses: number;
  matches: number;

  // normal
  ratingNormal: number;
  winsNormal: number;
  lossesNormal: number;
  matchesNormal: number;
  pointsForNormal: number;
  pointsAgainstNormal: number;

  // team
  ratingTeam: number;
  winsTeam: number;
  lossesTeam: number;
  matchesTeam: number;
  pointsForTeam: number;
  pointsAgainstTeam: number;
}

export interface PlayerForm {
  name: string;
  nickname?: string;
}

/* =========================================================
   SCHEDULER
========================================================= */

export interface ScheduledMatch {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
}

export interface GeneratedRound {
  round: number;
  matches: ScheduledMatch[];
  restingPlayerIds: string[];
}

export interface GeneratedSchedule {
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
}

/* =========================================================
   RANKING
========================================================= */

export interface RankingRow {
  playerId: string;
  playerName: string;
  nickname?: string;

  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number;

  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  rankScore: number;
  last5: Array<"W" | "L" | "D">;
}

export interface PlayerSummary {
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

  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
}

export interface PlayerRecentMatch {
  matchId: string;
  sessionId: string;
  sessionMode: RankingMode;

  round: number;
  court: number;

  result: "W" | "L" | "D";
  scoreFor: number;
  scoreAgainst: number;

  partnerIds: string[];
  opponentIds: string[];
  createdAt?: string;
}

export interface PartnerStat {
  playerId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
}

export interface OpponentStat {
  playerId: string;
  name: string;
  count: number;
  winsAgainst: number;
  lossesAgainst: number;
}

export interface PlayerDetailStats {
  player: Player;

  summary: PlayerSummary;
  summaryNormal: PlayerSummary;
  summaryTeam: PlayerSummary;

  recentMatches: PlayerRecentMatch[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
}

export interface RankingRebuildResult {
  players: Player[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
}