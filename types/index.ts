export type SessionMode = "normal" | "team";
export type RankingMode = SessionMode;

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;

  // legacy tổng
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
}

export interface MatchRecord {
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
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
}

export interface PlayerForm {
  name: string;
  nickname?: string;
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
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number; // integer %
  rankScore: number;
  last5: Array<"W" | "L">;
}

export interface PlayerSummary {
  rating: number;
  rankScore: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointDiff: number;
  winRate: number; // 0..1
  pointsFor: number;
  pointsAgainst: number;
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
}

export interface PlayerRecentMatch {
  matchId: string;
  sessionId: string;
  sessionDate?: string;
  round: number;
  mode: RankingMode;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
  partnerIds: string[];
  opponentIds: string[];
}

export interface PlayerPartnerStat {
  playerId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
}

export interface PlayerOpponentStat {
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
  topPartners: PlayerPartnerStat[];
  topOpponents: PlayerOpponentStat[];
}