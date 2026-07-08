import type { MatchRecord, Player } from "@/types";
import { getMatches, getPlayers } from "@/lib/storage";

/* =========================================================
   Sprint 9A - Ranking Pro + Elo
   Compatible version:
   - keeps old API: getRanking(), getPlayerDetailStats()
   - supports homepage, ranking page, member detail page
========================================================= */

export type RankingRow = {
  playerId: string;
  name: string;
  nickname?: string;

  rating: number; // Elo current
  rankScore: number; // điểm xếp hạng tổng hợp để sort

  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;

  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
};

export type PlayerMatchHistoryItem = {
  matchId: string;
  sessionId: string;
  round: number;
  createdAt?: string;

  partnerIds: string[];
  opponentIds: string[];

  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
};

export type PlayerDetailStats = {
  player: Player;
  summary: {
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
    streakType: "win" | "loss" | "draw" | "none";
    streakCount: number;
  };
  recentMatches: PlayerMatchHistoryItem[];
  topPartners: Array<{
    playerId: string;
    name: string;
    count: number;
    winsTogether: number;
    lossesTogether: number;
  }>;
  topOpponents: Array<{
    playerId: string;
    name: string;
    count: number;
    winsAgainst: number;
    lossesAgainst: number;
  }>;
};

/* =========================================================
   CONFIG
========================================================= */

const DEFAULT_ELO = 1000;
const K_FACTOR = 24;

/**
 * RankScore dùng để sort BXH.
 * Option C kiểu "Ranking Pro + Elo":
 * - Elo là lõi chính
 * - cộng thưởng nhẹ cho win rate / activity / point diff
 */
function calcRankScore(params: {
  rating: number;
  matches: number;
  winRate: number;
  pointDiff: number;
}) {
  const { rating, matches, winRate, pointDiff } = params;

  const activityBonus = Math.min(matches, 30) * 1.5;
  const winRateBonus = winRate * 120; // ví dụ 60% => +72
  const pointDiffBonus = Math.max(-80, Math.min(80, pointDiff)) * 0.6;

  return rating + activityBonus + winRateBonus + pointDiffBonus;
}

/* =========================================================
   INTERNAL TYPES
========================================================= */

type MutableStat = {
  player: Player;
  rating: number;

  matches: number;
  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;

  results: Array<"W" | "L" | "D">;
  history: PlayerMatchHistoryItem[];
};

function getPlayerNameMap(players: Player[]) {
  const map = new Map<string, Player>();
  players.forEach((p) => map.set(p.id, p));
  return map;
}

function safeDateValue(value?: string) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function average(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function expectedScore(playerRating: number, oppAverageRating: number) {
  return 1 / (1 + Math.pow(10, (oppAverageRating - playerRating) / 400));
}

function getMatchTeams(match: MatchRecord) {
  const teamA = match.teamA?.playerIds ?? [];
  const teamB = match.teamB?.playerIds ?? [];
  return { teamA, teamB };
}

function getMatchResultForPlayer(match: MatchRecord, playerId: string) {
  const { teamA, teamB } = getMatchTeams(match);

  const isInA = teamA.includes(playerId);
  const isInB = teamB.includes(playerId);

  if (!isInA && !isInB) return null;

  const scoreA = match.scoreA ?? 0;
  const scoreB = match.scoreB ?? 0;

  const myTeam = isInA ? teamA : teamB;
  const oppTeam = isInA ? teamB : teamA;

  const scoreFor = isInA ? scoreA : scoreB;
  const scoreAgainst = isInA ? scoreB : scoreA;

  let result: "W" | "L" | "D" = "D";
  if (scoreFor > scoreAgainst) result = "W";
  else if (scoreFor < scoreAgainst) result = "L";

  const partnerIds = myTeam.filter((id) => id !== playerId);
  const opponentIds = [...oppTeam];

  return {
    partnerIds,
    opponentIds,
    scoreFor,
    scoreAgainst,
    result,
  };
}

function buildBaseStats(players: Player[]) {
  const map = new Map<string, MutableStat>();

  players.forEach((player) => {
    map.set(player.id, {
      player,
      rating: typeof player.rating === "number" ? player.rating : DEFAULT_ELO,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      results: [],
      history: [],
    });
  });

  return map;
}

/* =========================================================
   ELO ENGINE
========================================================= */

function applyEloForMatch(match: MatchRecord, statMap: Map<string, MutableStat>) {
  const { teamA, teamB } = getMatchTeams(match);
  if (teamA.length === 0 || teamB.length === 0) return;

  const teamARatings = teamA
    .map((id) => statMap.get(id)?.rating ?? DEFAULT_ELO);

  const teamBRatings = teamB
    .map((id) => statMap.get(id)?.rating ?? DEFAULT_ELO);

  const avgA = average(teamARatings);
  const avgB = average(teamBRatings);

  let actualA = 0.5;
  let actualB = 0.5;

  if (match.scoreA > match.scoreB) {
    actualA = 1;
    actualB = 0;
  } else if (match.scoreA < match.scoreB) {
    actualA = 0;
    actualB = 1;
  }

  const expectedA = expectedScore(avgA, avgB);
  const expectedB = expectedScore(avgB, avgA);

  for (const id of teamA) {
    const stat = statMap.get(id);
    if (!stat) continue;
    stat.rating = Math.round(stat.rating + K_FACTOR * (actualA - expectedA));
  }

  for (const id of teamB) {
    const stat = statMap.get(id);
    if (!stat) continue;
    stat.rating = Math.round(stat.rating + K_FACTOR * (actualB - expectedB));
  }
}

/* =========================================================
   BUILD ALL STATS
========================================================= */

function buildAllRankingStats() {
  const players = getPlayers();
  const matches = [...getMatches()].sort(
    (a, b) => safeDateValue(a.createdAt) - safeDateValue(b.createdAt)
  );

  const playerMap = getPlayerNameMap(players);
  const statMap = buildBaseStats(players);

  for (const match of matches) {
    const { teamA, teamB } = getMatchTeams(match);
    const allPlayers = [...teamA, ...teamB];

    // 1) update W/L/points/history
    for (const playerId of allPlayers) {
      const stat = statMap.get(playerId);
      if (!stat) continue;

      const result = getMatchResultForPlayer(match, playerId);
      if (!result) continue;

      stat.matches += 1;
      stat.pointsFor += result.scoreFor;
      stat.pointsAgainst += result.scoreAgainst;

      if (result.result === "W") stat.wins += 1;
      else if (result.result === "L") stat.losses += 1;
      else stat.draws += 1;

      stat.results.push(result.result);

      stat.history.push({
        matchId: match.id,
        sessionId: match.sessionId,
        round: match.round,
        createdAt: match.createdAt,
        partnerIds: result.partnerIds,
        opponentIds: result.opponentIds,
        scoreFor: result.scoreFor,
        scoreAgainst: result.scoreAgainst,
        result: result.result,
      });
    }

    // 2) update Elo after match
    applyEloForMatch(match, statMap);
  }

  function getStreak(results: Array<"W" | "L" | "D">): {
    streakType: "win" | "loss" | "draw" | "none";
    streakCount: number;
  } {
    if (!results.length) {
      return { streakType: "none", streakCount: 0 };
    }

    const last = results[results.length - 1];
    let count = 0;

    for (let i = results.length - 1; i >= 0; i -= 1) {
      if (results[i] === last) count += 1;
      else break;
    }

    return {
      streakType:
        last === "W" ? "win" : last === "L" ? "loss" : "draw",
      streakCount: count,
    };
  }

  const rankingRows: RankingRow[] = Array.from(statMap.values()).map((stat) => {
    const winRate = stat.matches > 0 ? stat.wins / stat.matches : 0;
    const pointDiff = stat.pointsFor - stat.pointsAgainst;
    const streak = getStreak(stat.results);

    return {
      playerId: stat.player.id,
      name: stat.player.name,
      nickname: stat.player.nickname,
      rating: Math.round(stat.rating),
      rankScore: calcRankScore({
        rating: Math.round(stat.rating),
        matches: stat.matches,
        winRate,
        pointDiff,
      }),
      matches: stat.matches,
      wins: stat.wins,
      losses: stat.losses,
      draws: stat.draws,
      winRate,
      pointsFor: stat.pointsFor,
      pointsAgainst: stat.pointsAgainst,
      pointDiff,
      streakType: streak.streakType,
      streakCount: streak.streakCount,
    };
  });

  rankingRows.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name, "vi");
  });

  return {
    players,
    matches,
    playerMap,
    statMap,
    rankingRows,
  };
}

/* =========================================================
   PUBLIC API - COMPATIBLE
========================================================= */

/**
 * API cũ cho app/page.tsx hoặc ranking page
 */
export function getRanking(): RankingRow[] {
  return buildAllRankingStats().rankingRows;
}

/**
 * API chi tiết 1 member cho app/members/[id]/page.tsx
 */
export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const { playerMap, statMap } = buildAllRankingStats();

  const player = playerMap.get(playerId);
  const stat = statMap.get(playerId);

  if (!player || !stat) return null;

  const winRate = stat.matches > 0 ? stat.wins / stat.matches : 0;
  const pointDiff = stat.pointsFor - stat.pointsAgainst;

  const results = stat.results;
  let streakType: "win" | "loss" | "draw" | "none" = "none";
  let streakCount = 0;

  if (results.length > 0) {
    const last = results[results.length - 1];
    streakType = last === "W" ? "win" : last === "L" ? "loss" : "draw";
    for (let i = results.length - 1; i >= 0; i -= 1) {
      if (results[i] === last) streakCount += 1;
      else break;
    }
  }

  const partnerCounter = new Map<
    string,
    { count: number; winsTogether: number; lossesTogether: number }
  >();

  const opponentCounter = new Map<
    string,
    { count: number; winsAgainst: number; lossesAgainst: number }
  >();

  for (const item of stat.history) {
    for (const partnerId of item.partnerIds) {
      const current = partnerCounter.get(partnerId) ?? {
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      current.count += 1;
      if (item.result === "W") current.winsTogether += 1;
      if (item.result === "L") current.lossesTogether += 1;

      partnerCounter.set(partnerId, current);
    }

    for (const oppId of item.opponentIds) {
      const current = opponentCounter.get(oppId) ?? {
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      current.count += 1;
      if (item.result === "W") current.winsAgainst += 1;
      if (item.result === "L") current.lossesAgainst += 1;

      opponentCounter.set(oppId, current);
    }
  }

  const topPartners = Array.from(partnerCounter.entries())
    .map(([id, info]) => ({
      playerId: id,
      name: playerMap.get(id)?.name ?? id,
      ...info,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 5);

  const topOpponents = Array.from(opponentCounter.entries())
    .map(([id, info]) => ({
      playerId: id,
      name: playerMap.get(id)?.name ?? id,
      ...info,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 5);

  const recentMatches = [...stat.history]
    .sort((a, b) => safeDateValue(b.createdAt) - safeDateValue(a.createdAt))
    .slice(0, 20);

  return {
    player,
    summary: {
      rating: Math.round(stat.rating),
      rankScore: calcRankScore({
        rating: Math.round(stat.rating),
        matches: stat.matches,
        winRate,
        pointDiff,
      }),
      matches: stat.matches,
      wins: stat.wins,
      losses: stat.losses,
      draws: stat.draws,
      winRate,
      pointsFor: stat.pointsFor,
      pointsAgainst: stat.pointsAgainst,
      pointDiff,
      streakType,
      streakCount,
    },
    recentMatches,
    topPartners,
    topOpponents,
  };
}