export type SessionMode = "normal" | "team";
export type RankingMode = SessionMode;

export type MatchResult = "W" | "L" | "D";

/**
 * Member = thành viên trong CLB / nhóm chơi
 * Dữ liệu ranking được lưu kèm trên member để load nhanh UI
 */
export interface Member {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;

  // legacy overall
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

/**
 * Giữ alias Player = Member để không làm vỡ các file cũ.
 * Từ sprint sau có thể đổi dần toàn bộ Player -> Member.
 */
export type Player = Member;

export interface MatchRecord {
  id: string;
  sessionId: string;
  round: number;
  court?: number;

  teamA: {
    memberIds: string[];
  };

  teamB: {
    memberIds: string[];
  };

  scoreA: number;
  scoreB: number;
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  pointToWin: number;

  /**
   * Danh sách member tham gia session
   */
  participantIds: string[];

  createdAt: string;
  mode?: SessionMode;
  courtCount?: number;

  teamConfig?: {
    teamAMemberIds: string[];
    teamBMemberIds: string[];
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

export interface RankingRow {
  memberId: string;
  playerId: string; // giữ tạm để code cũ không vỡ ngay
  playerName: string;
  nickname: string;
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
  last5: Array<"W" | "L">;
}

export interface RankingRebuildResult {
  players: Player[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
}

export interface PlayerSummary {
  rating: number;
  rankScore: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointDiff: number;
  winRate: number;
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface PartnerStats {
  playerId: string;
  memberId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
}

export interface OpponentStats {
  playerId: string;
  memberId: string;
  name: string;
  count: number;
  winsAgainst: number;
  lossesAgainst: number;
}

export interface RecentMatchItem {
  matchId: string;
  round: number;
  scoreFor: number;
  scoreAgainst: number;
  result: MatchResult;
  partnerIds: string[];
  opponentIds: string[];
}

export interface PlayerDetailStats {
  player: Player;
  summary: PlayerSummary;
  summaryNormal: PlayerSummary;
  summaryTeam: PlayerSummary;
  recentMatches: RecentMatchItem[];
  topPartners: PartnerStats[];
  topOpponents: OpponentStats[];
}

export interface PlayerForm {
  name: string;
  nickname?: string;
}