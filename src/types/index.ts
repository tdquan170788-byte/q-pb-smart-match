export type SessionMode = "normal" | "team";
export type RankingMode = "normal" | "team";
export type MatchResult = "W" | "L" | "D";

export type Player = {
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
};

export type PlayerForm = {
  name: string;
  nickname?: string;
};

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

export type TeamConfig = {
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
  teamConfig?: TeamConfig;
};

export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};

export type GeneratedRound = {
  round: number;
  matches: ScheduledMatch[];
  restingPlayerIds: string[];
};

export type GeneratedSchedule = {
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
};

export type RankingRow = {
  playerId: string;
  playerName: string;
  nickname?: string;
  rating: number;
  wins: number;
  losses: number;
  matches: number;
  winRate: number; // 0..100
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  last5: Array<"W" | "L">;
};

export type PlayerSummary = {
  rating: number;
  rankScore: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // 0..1
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
};

export type RankingSnapshot = {
  normalRows: RankingRow[];
  teamRows: RankingRow[];
  players: Player[];
};

export type RecentMatchItem = {
  matchId: string;
  sessionId: string;
  round: number;
  mode: SessionMode;
  scoreFor: number;
  scoreAgainst: number;
  result: MatchResult;
  partnerIds: string[];
  opponentIds: string[];
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

export type PlayerDetailStats = {
  player: Player;
  summary: PlayerSummary;
  summaryNormal: PlayerSummary;
  summaryTeam: PlayerSummary;
  recentMatches: RecentMatchItem[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
};