export type RankingMode = "all" | "normal" | "team";

export type Player = {
  id: string;
  name: string;
  nickname?: string;
  createdAt?: string;

  // legacy tổng
  rating?: number;
  wins?: number;
  losses?: number;
  matches?: number;

  // normal mode
  ratingNormal?: number;
  winsNormal?: number;
  lossesNormal?: number;
  matchesNormal?: number;
  pointsForNormal?: number;
  pointsAgainstNormal?: number;

  // team mode
  ratingTeam?: number;
  winsTeam?: number;
  lossesTeam?: number;
  matchesTeam?: number;
  pointsForTeam?: number;
  pointsAgainstTeam?: number;
};

export type MatchRecord = {
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
  createdAt?: string;
};

export type SessionMode = "normal" | "team";

export type SessionRecord = {
  id: string;
  date: string;
  pointToWin: number;
  participantIds: string[];
  createdAt?: string;

  mode?: SessionMode;
  courtCount?: number;

  teamConfig?: {
    teamAPlayerIds: string[];
    teamBPlayerIds: string[];
  };
};

export type PlayerForm = {
  name: string;
  nickname?: string;
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
  rank: number;
  playerId: string;
  name: string;
  nickname?: string;

  rating: number;
  rankScore: number;

  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;

  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  sos: number;
  form: number;
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
};

export type PlayerRecentMatch = {
  matchId: string;
  sessionId: string;
  round: number;
  result: "W" | "L" | "D";
  scoreFor: number;
  scoreAgainst: number;
  partnerIds: string[];
  opponentIds: string[];
  mode?: SessionMode;
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

  // tổng hợp all mode
  summary: RankingRow;

  // tách theo mode để app/members/[id]/page.tsx dùng được
  summaryNormal: RankingRow | null;
  summaryTeam: RankingRow | null;

  recentMatches: PlayerRecentMatch[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
};

export type RankingBuildResult = {
  ranking: RankingRow[];
  rankingNormal: RankingRow[];
  rankingTeam: RankingRow[];

  playerDetails: Record<string, PlayerDetailStats>;
  players: Player[];
};