export type RankingMode = "normal" | "team";

export type LastResult = "W" | "L" | "D";
export type StreakType = "win" | "loss" | "draw" | "none";

export type PlayerSummary = {
  rating: number;
  rankScore: number;

  wins: number;
  losses: number;
  draws: number;
  matches: number;

  winRate: number; // 0..1
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  last5: LastResult[];

  streakType: StreakType;
  streakCount: number;
};

export type RankingRow = {
  playerId: string;
  playerName: string;
  nickname?: string;

  rating: number;
  rankScore: number;

  wins: number;
  losses: number;
  draws: number;
  matches: number;

  winRate: number; // 0..100 để hiển thị bảng
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  last5: LastResult[];
};

export type PartnerStat = {
  playerId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
};

export type OpponentStat = {
  playerId: string;
  name: string;
  count: number;
  winsAgainst: number;
  lossesAgainst: number;
};

export type RecentMatchRow = {
  matchId: string;
  sessionId: string;
  mode: "normal" | "team";
  round: number;
  court: number;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
  partnerIds: string[];
  opponentIds: string[];
  createdAt: string;
};

export type PlayerDetailStats = {
  player: {
    id: string;
    name: string;
    nickname?: string;
  };

  summary: PlayerSummary;
  summaryNormal: PlayerSummary;
  summaryTeam: PlayerSummary;

  recentMatches: RecentMatchRow[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
};