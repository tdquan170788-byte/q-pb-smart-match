export type RankingMode = "normal" | "team";

export type MatchTeam = {
  memberIds: string[];
};

export type MatchRecord = {
  id: string;
  sessionId: string;
  round: number;
  court?: number;
  teamA: MatchTeam;
  teamB: MatchTeam;
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
  mode?: RankingMode;
  courtCount?: number;
  teamConfig?: SessionTeamConfig;
};

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

export type PlayerForm = {
  name: string;
  nickname?: string;
};

export type RankingRow = {
  memberId: string;
  playerId: string;
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
};

export type RankingRebuildResult = {
  players: Player[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
};

export type StreakType = "win" | "loss" | "draw" | "none";

export type PlayerSummary = {
  rating: number;
  rankScore: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  pointDiff: number;
  winRate: number;
  streakType: StreakType;
  streakCount: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type RecentMatchItem = {
  matchId: string;
  round: number;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
  partnerIds: string[];
  opponentIds: string[];
};

export type PartnerStatItem = {
  playerId: string;
  memberId: string;
  name: string;
  count: number;
  winsTogether: number;
  lossesTogether: number;
};

export type OpponentStatItem = {
  playerId: string;
  memberId: string;
  name: string;
  count: number;
  winsAgainst: number;
  lossesAgainst: number;
};

export type PlayerDetailStats = {
  player: Player;
  summary: PlayerSummary;
  summaryNormal: PlayerSummary;
  summaryTeam: PlayerSummary;
  recentMatches: RecentMatchItem[];
  topPartners: PartnerStatItem[];
  topOpponents: OpponentStatItem[];
};