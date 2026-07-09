export type SessionMode = "normal" | "team";
export type RankingMode = SessionMode;

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;

  // legacy
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

export interface MatchTeam {
  playerIds: string[];
}

export interface MatchRecord {
  id: string;
  sessionId: string;
  round: number;
  court?: number;
  teamA: MatchTeam;
  teamB: MatchTeam;
  scoreA: number;
  scoreB: number;
  createdAt: string;
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
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
}

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
  totalRounds: number;
  rounds: GeneratedRound[];
}

export interface RankingRow {
  playerId: string;
  playerName: string;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  winRate: number; // 0-100
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  rankScore: number;
  last5: Array<"W" | "L">;
}

export interface ModeSummary {
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number; // 0..1
}

export interface PlayerRecentMatch {
  matchId: string;
  sessionId: string;
  mode: RankingMode;
  round: number;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
  partnerIds: string[];
  opponentIds: string[];
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
  summary: ModeSummary;
  summaryNormal: ModeSummary;
  summaryTeam: ModeSummary;
  recentMatches: PlayerRecentMatch[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
}

export interface PlayerForm {
  name: string;
  nickname?: string;
}