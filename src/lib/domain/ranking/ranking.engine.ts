import type { MatchRecord, Player, SessionRecord } from "@/types/domain";
import type {
  LastResult,
  PlayerSummary,
  RankingRow,
  StreakType,
} from "@/types/ranking";

type StatsAccumulator = {
  playerId: string;
  playerName: string;
  nickname?: string;

  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;

  pointsFor: number;
  pointsAgainst: number;

  lastResults: LastResult[];
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function createEmptyAccumulator(player: Player): StatsAccumulator {
  return {
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname ?? "",

    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,

    pointsFor: 0,
    pointsAgainst: 0,

    lastResults: [],
  };
}

function calcExpectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calcEloDelta(params: {
  ratingA: number;
  ratingB: number;
  scoreA: number; // 1 / 0.5 / 0
  k?: number;
}) {
  const k = params.k ?? 24;
  const expectedA = calcExpectedScore(params.ratingA, params.ratingB);
  return k * (params.scoreA - expectedA);
}

function getMatchResult(scoreFor: number, scoreAgainst: number): LastResult {
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "D";
}

function applyMatchToStats(params: {
  match: MatchRecord;
  statsMap: Map<string, StatsAccumulator>;
}) {
  const { match, statsMap } = params;
  const aIds = match.teamA.memberIds;
  const bIds = match.teamB.memberIds;

  if (aIds.length === 0 || bIds.length === 0) return;

  const avgA =
    aIds.reduce((sum, id) => sum + (statsMap.get(id)?.rating ?? 1000), 0) /
    aIds.length;
  const avgB =
    bIds.reduce((sum, id) => sum + (statsMap.get(id)?.rating ?? 1000), 0) /
    bIds.length;

  let scoreAResult = 0.5;
  let scoreBResult = 0.5;

  if (match.scoreA > match.scoreB) {
    scoreAResult = 1;
    scoreBResult = 0;
  } else if (match.scoreA < match.scoreB) {
    scoreAResult = 0;
    scoreBResult = 1;
  }

  const deltaA = calcEloDelta({
    ratingA: avgA,
    ratingB: avgB,
    scoreA: scoreAResult,
  });
  const deltaB = -deltaA;

  for (const id of aIds) {
    const row = statsMap.get(id);
    if (!row) continue;

    row.matches += 1;
    row.pointsFor += match.scoreA;
    row.pointsAgainst += match.scoreB;
    row.rating += deltaA;

    if (match.scoreA > match.scoreB) row.wins += 1;
    else if (match.scoreA < match.scoreB) row.losses += 1;
    else row.draws += 1;

    row.lastResults.push(getMatchResult(match.scoreA, match.scoreB));
    if (row.lastResults.length > 5) row.lastResults.shift();
  }

  for (const id of bIds) {
    const row = statsMap.get(id);
    if (!row) continue;

    row.matches += 1;
    row.pointsFor += match.scoreB;
    row.pointsAgainst += match.scoreA;
    row.rating += deltaB;

    if (match.scoreB > match.scoreA) row.wins += 1;
    else if (match.scoreB < match.scoreA) row.losses += 1;
    else row.draws += 1;

    row.lastResults.push(getMatchResult(match.scoreB, match.scoreA));
    if (row.lastResults.length > 5) row.lastResults.shift();
  }
}

function finalizeRows(statsMap: Map<string, StatsAccumulator>): RankingRow[] {
  return [...statsMap.values()]
    .map((row) => {
      const pointDiff = row.pointsFor - row.pointsAgainst;
      const winRate = row.matches > 0 ? (row.wins / row.matches) * 100 : 0;

      return {
        playerId: row.playerId,
        playerName: row.playerName,
        nickname: row.nickname,

        rating: round2(row.rating),
        rankScore: round2(row.rating),

        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        matches: row.matches,

        winRate: round2(winRate),
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointDiff,

        last5: row.lastResults,
      };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return b.wins - a.wins;
    });
}

function buildSummaryFromRows(row?: RankingRow): PlayerSummary {
  if (!row) {
    return {
      rating: 1000,
      rankScore: 1000,
      wins: 0,
      losses: 0,
      draws: 0,
      matches: 0,
      winRate: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      last5: [],
      streakType: "none",
      streakCount: 0,
    };
  }

  const { streakType, streakCount } = calcStreak(row.last5);

  return {
    rating: row.rating,
    rankScore: row.rankScore,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    matches: row.matches,
    winRate: row.matches > 0 ? row.wins / row.matches : 0,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    pointDiff: row.pointDiff,
    last5: row.last5,
    streakType,
    streakCount,
  };
}

export function calcStreak(last5: LastResult[]): {
  streakType: StreakType;
  streakCount: number;
} {
  if (last5.length === 0) {
    return { streakType: "none", streakCount: 0 };
  }

  const reversed = [...last5].reverse();
  const first = reversed[0];

  let count = 0;
  for (const result of reversed) {
    if (result === first) count += 1;
    else break;
  }

  if (first === "W") return { streakType: "win", streakCount: count };
  if (first === "L") return { streakType: "loss", streakCount: count };
  return { streakType: "draw", streakCount: count };
}

export function buildRanking(params: {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
}) {
  const { players, sessions, matches } = params;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const normalStats = new Map(players.map((p) => [p.id, createEmptyAccumulator(p)]));
  const teamStats = new Map(players.map((p) => [p.id, createEmptyAccumulator(p)]));

  const sortedMatches = [...matches].sort((a, b) => {
    const sessionA = sessionMap.get(a.sessionId);
    const sessionB = sessionMap.get(b.sessionId);

    const dateA = sessionA?.date ?? "";
    const dateB = sessionB?.date ?? "";

    if (dateA !== dateB) return dateA.localeCompare(dateB);
    if (a.sessionId !== b.sessionId) return a.sessionId.localeCompare(b.sessionId);
    if (a.round !== b.round) return a.round - b.round;
    return (a.court ?? 1) - (b.court ?? 1);
  });

  for (const match of sortedMatches) {
    const session = sessionMap.get(match.sessionId);
    if (!session) continue;

    if ((session.mode ?? "normal") === "team") {
      applyMatchToStats({ match, statsMap: teamStats });
    } else {
      applyMatchToStats({ match, statsMap: normalStats });
    }
  }

  const normalRows = finalizeRows(normalStats);
  const teamRows = finalizeRows(teamStats);

  return {
    normalRows,
    teamRows,
    getSummaryForPlayer(playerId: string) {
      const normal = normalRows.find((r) => r.playerId === playerId);
      const team = teamRows.find((r) => r.playerId === playerId);

      const overall = mergeSummaries(
        buildSummaryFromRows(normal),
        buildSummaryFromRows(team)
      );

      return {
        summary: overall,
        summaryNormal: buildSummaryFromRows(normal),
        summaryTeam: buildSummaryFromRows(team),
      };
    },
  };
}

function mergeSummaries(a: PlayerSummary, b: PlayerSummary): PlayerSummary {
  const matches = a.matches + b.matches;
  const wins = a.wins + b.wins;
  const losses = a.losses + b.losses;
  const draws = a.draws + b.draws;
  const pointsFor = a.pointsFor + b.pointsFor;
  const pointsAgainst = a.pointsAgainst + b.pointsAgainst;
  const pointDiff = pointsFor - pointsAgainst;

  const rating = round2((a.rating + b.rating) / 2);
  const rankScore = rating;
  const winRate = matches > 0 ? wins / matches : 0;

  // overall streak không thật sự có ý nghĩa nếu tách 2 mode riêng,
  // nhưng để UI không vỡ, mình lấy streak từ chuỗi ghép đơn giản.
  const last5 = [...a.last5, ...b.last5].slice(-5);
  const { streakType, streakCount } = calcStreak(last5);

  return {
    rating,
    rankScore,
    wins,
    losses,
    draws,
    matches,
    winRate,
    pointsFor,
    pointsAgainst,
    pointDiff,
    last5,
    streakType,
    streakCount,
  };
}