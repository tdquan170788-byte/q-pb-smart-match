import type { MatchRecord, Player, SessionRecord } from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

/* =========================================================
   SPRINT 9A - RANKING PRO (OPTION C + ELO)
   - Elo là nền tảng chính
   - Có thêm Win rate / Strength of Schedule / Form / Point diff
   - Export tương thích ngược:
     + getRanking()
     + getPlayerDetailStats()
     + rebuildRankingData()
========================================================= */

export type RankingRow = {
  rank: number;
  playerId: string;
  name: string;
  nickname?: string;

  rating: number; // Elo cuối cùng
  rankScore: number; // điểm tổng hợp để xếp hạng

  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;

  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;

  sos: number; // strength of schedule
  form: number; // phong độ gần đây
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
  summary: RankingRow;
  recentMatches: PlayerRecentMatch[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
};

export type RankingBuildResult = {
  ranking: RankingRow[];
  playerDetails: Record<string, PlayerDetailStats>;
};

type MutablePlayerStat = {
  player: Player;
  rating: number;

  matches: number;
  wins: number;
  losses: number;
  draws: number;

  pointsFor: number;
  pointsAgainst: number;

  recentResults: Array<"W" | "L" | "D">;
  recentMatches: PlayerRecentMatch[];

  teammateMap: Record<
    string,
    {
      count: number;
      winsTogether: number;
      lossesTogether: number;
    }
  >;

  opponentMap: Record<
    string,
    {
      count: number;
      winsAgainst: number;
      lossesAgainst: number;
    }
  >;
};

const DEFAULT_RATING = 1000;
const K_FACTOR = 24;

/* =========================================================
   HELPERS
========================================================= */

function normalizeName(player: Player) {
  return player.nickname?.trim()
    ? `${player.name} (${player.nickname.trim()})`
    : player.name;
}

function getPlayerInitialRating(player: Player) {
  return typeof player.rating === "number" ? player.rating : DEFAULT_RATING;
}

function createEmptyStat(player: Player): MutablePlayerStat {
  return {
    player,
    rating: getPlayerInitialRating(player),
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    recentResults: [],
    recentMatches: [],
    teammateMap: {},
    opponentMap: {},
  };
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function expectedScore(playerRating: number, opponentRating: number) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function getResultScore(scoreFor: number, scoreAgainst: number): 1 | 0.5 | 0 {
  if (scoreFor > scoreAgainst) return 1;
  if (scoreFor < scoreAgainst) return 0;
  return 0.5;
}

function getResultLabel(scoreFor: number, scoreAgainst: number): "W" | "L" | "D" {
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "D";
}

function safeDateValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function buildPlayerMap(players: Player[]) {
  return Object.fromEntries(players.map((p) => [p.id, p]));
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

function ensureStat(
  statMap: Record<string, MutablePlayerStat>,
  playerMap: Record<string, Player>,
  playerId: string
) {
  if (!statMap[playerId]) {
    const player = playerMap[playerId];
    if (!player) {
      statMap[playerId] = createEmptyStat({
        id: playerId,
        name: playerId,
        nickname: "",
        rating: DEFAULT_RATING,
      });
    } else {
      statMap[playerId] = createEmptyStat(player);
    }
  }
  return statMap[playerId];
}

function updateTeammate(
  stat: MutablePlayerStat,
  teammateId: string,
  isWin: boolean,
  isLoss: boolean
) {
  if (!stat.teammateMap[teammateId]) {
    stat.teammateMap[teammateId] = {
      count: 0,
      winsTogether: 0,
      lossesTogether: 0,
    };
  }

  stat.teammateMap[teammateId].count += 1;
  if (isWin) stat.teammateMap[teammateId].winsTogether += 1;
  if (isLoss) stat.teammateMap[teammateId].lossesTogether += 1;
}

function updateOpponent(
  stat: MutablePlayerStat,
  opponentId: string,
  isWin: boolean,
  isLoss: boolean
) {
  if (!stat.opponentMap[opponentId]) {
    stat.opponentMap[opponentId] = {
      count: 0,
      winsAgainst: 0,
      lossesAgainst: 0,
    };
  }

  stat.opponentMap[opponentId].count += 1;
  if (isWin) stat.opponentMap[opponentId].winsAgainst += 1;
  if (isLoss) stat.opponentMap[opponentId].lossesAgainst += 1;
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

function calcForm(results: Array<"W" | "L" | "D">) {
  const last5 = results.slice(-5);
  if (!last5.length) return 0;

  let score = 0;
  for (const r of last5) {
    if (r === "W") score += 1;
    else if (r === "D") score += 0.5;
  }

  return score / last5.length; // 0 -> 1
}

/* =========================================================
   CORE RANKING ENGINE
========================================================= */

export function buildRankingFromData(
  players: Player[],
  sessions: SessionRecord[],
  matches: MatchRecord[]
): RankingBuildResult {
  const playerMap = buildPlayerMap(players);
  const statMap: Record<string, MutablePlayerStat> = {};

  // init stat cho toàn bộ player hiện có
  for (const player of players) {
    statMap[player.id] = createEmptyStat(player);
  }

  // sort matches theo thời gian + round để Elo cập nhật ổn định
  const sessionMap = Object.fromEntries(sessions.map((s) => [s.id, s]));
  const sortedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap[a.sessionId];
    const sb = sessionMap[b.sessionId];

    const timeA = safeDateValue(sa?.createdAt || sa?.date || a.createdAt);
    const timeB = safeDateValue(sb?.createdAt || sb?.date || b.createdAt);

    if (timeA !== timeB) return timeA - timeB;
    if (a.round !== b.round) return a.round - b.round;
    return safeDateValue(a.createdAt) - safeDateValue(b.createdAt);
  });

  for (const match of sortedMatches) {
    const teamAIds = uniqueIds(match.teamA?.playerIds ?? []);
    const teamBIds = uniqueIds(match.teamB?.playerIds ?? []);

    if (!teamAIds.length || !teamBIds.length) continue;

    const teamAStats = teamAIds.map((id) => ensureStat(statMap, playerMap, id));
    const teamBStats = teamBIds.map((id) => ensureStat(statMap, playerMap, id));

    const avgRatingA = avg(teamAStats.map((s) => s.rating));
    const avgRatingB = avg(teamBStats.map((s) => s.rating));

    const resultA = getResultScore(match.scoreA, match.scoreB);
    const resultB = resultA === 1 ? 0 : resultA === 0 ? 1 : 0.5;

    const expectedA = expectedScore(avgRatingA, avgRatingB);
    const expectedB = expectedScore(avgRatingB, avgRatingA);

    // margin bonus nhẹ để trận thắng đậm có thêm ảnh hưởng nhưng không quá lớn
    const pointDiff = Math.abs(match.scoreA - match.scoreB);
    const marginMultiplier = clamp(1 + pointDiff / 20, 1, 1.35);

    const deltaA = K_FACTOR * marginMultiplier * (resultA - expectedA);
    const deltaB = K_FACTOR * marginMultiplier * (resultB - expectedB);

    // cập nhật team A
    for (const stat of teamAStats) {
      stat.rating += deltaA;
      stat.matches += 1;
      stat.pointsFor += match.scoreA;
      stat.pointsAgainst += match.scoreB;

      if (resultA === 1) stat.wins += 1;
      else if (resultA === 0) stat.losses += 1;
      else stat.draws += 1;

      const resultLabel = getResultLabel(match.scoreA, match.scoreB);
      stat.recentResults.push(resultLabel);
      stat.recentMatches.push({
        matchId: match.id,
        sessionId: match.sessionId,
        round: match.round,
        result: resultLabel,
        scoreFor: match.scoreA,
        scoreAgainst: match.scoreB,
        partnerIds: teamAIds.filter((id) => id !== stat.player.id),
        opponentIds: teamBIds,
      });

      for (const mateId of teamAIds) {
        if (mateId !== stat.player.id) {
          updateTeammate(stat, mateId, resultA === 1, resultA === 0);
        }
      }

      for (const oppId of teamBIds) {
        updateOpponent(stat, oppId, resultA === 1, resultA === 0);
      }
    }

    // cập nhật team B
    for (const stat of teamBStats) {
      stat.rating += deltaB;
      stat.matches += 1;
      stat.pointsFor += match.scoreB;
      stat.pointsAgainst += match.scoreA;

      if (resultB === 1) stat.wins += 1;
      else if (resultB === 0) stat.losses += 1;
      else stat.draws += 1;

      const resultLabel = getResultLabel(match.scoreB, match.scoreA);
      stat.recentResults.push(resultLabel);
      stat.recentMatches.push({
        matchId: match.id,
        sessionId: match.sessionId,
        round: match.round,
        result: resultLabel,
        scoreFor: match.scoreB,
        scoreAgainst: match.scoreA,
        partnerIds: teamBIds.filter((id) => id !== stat.player.id),
        opponentIds: teamAIds,
      });

      for (const mateId of teamBIds) {
        if (mateId !== stat.player.id) {
          updateTeammate(stat, mateId, resultB === 1, resultB === 0);
        }
      }

      for (const oppId of teamAIds) {
        updateOpponent(stat, oppId, resultB === 1, resultB === 0);
      }
    }
  }

  // Tính SoS: trung bình rating hiện tại của các đối thủ đã gặp
  const rankingRows: RankingRow[] = Object.values(statMap).map((stat) => {
    const matches = stat.matches;
    const wins = stat.wins;
    const losses = stat.losses;
    const draws = stat.draws;
    const pointsFor = stat.pointsFor;
    const pointsAgainst = stat.pointsAgainst;
    const pointDiff = pointsFor - pointsAgainst;
    const winRate = matches > 0 ? (wins + draws * 0.5) / matches : 0;

    const opponentIds = Object.keys(stat.opponentMap);
    const sos =
      opponentIds.length > 0
        ? avg(
            opponentIds.map((id) => {
              const opp = statMap[id];
              return opp ? opp.rating : DEFAULT_RATING;
            })
          )
        : DEFAULT_RATING;

    const form = calcForm(stat.recentResults);
    const { streakType, streakCount } = getStreak(stat.recentResults);

    // OPTION C: rankScore tổng hợp
    // Elo là lõi chính, sau đó cộng các chỉ số phụ có trọng số vừa phải
    const rankScore =
      stat.rating +
      winRate * 120 +
      (pointDiff / Math.max(matches || 1, 1)) * 3 +
      ((sos - DEFAULT_RATING) / 10) +
      form * 25;

    return {
      rank: 0,
      playerId: stat.player.id,
      name: stat.player.name,
      nickname: stat.player.nickname ?? "",
      rating: Math.round(stat.rating),
      rankScore,
      matches,
      wins,
      losses,
      draws,
      winRate,
      pointsFor,
      pointsAgainst,
      pointDiff,
      sos: Math.round(sos),
      form,
      streakType,
      streakCount,
    };
  });

  rankingRows.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return a.name.localeCompare(b.name, "vi");
  });

  rankingRows.forEach((row, index) => {
    row.rank = index + 1;
  });

  const rankingMap = Object.fromEntries(rankingRows.map((row) => [row.playerId, row]));
  const playerDetails: Record<string, PlayerDetailStats> = {};

  for (const stat of Object.values(statMap)) {
    const summary = rankingMap[stat.player.id];
    if (!summary) continue;

    const topPartners: PartnerStat[] = Object.entries(stat.teammateMap)
      .map(([playerId, value]) => ({
        playerId,
        name: playerMap[playerId]?.name ?? playerId,
        count: value.count,
        winsTogether: value.winsTogether,
        lossesTogether: value.lossesTogether,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.winsTogether !== a.winsTogether) return b.winsTogether - a.winsTogether;
        return a.name.localeCompare(b.name, "vi");
      })
      .slice(0, 8);

    const topOpponents: OpponentStat[] = Object.entries(stat.opponentMap)
      .map(([playerId, value]) => ({
        playerId,
        name: playerMap[playerId]?.name ?? playerId,
        count: value.count,
        winsAgainst: value.winsAgainst,
        lossesAgainst: value.lossesAgainst,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        if (b.winsAgainst !== a.winsAgainst) return b.winsAgainst - a.winsAgainst;
        return a.name.localeCompare(b.name, "vi");
      })
      .slice(0, 8);

    playerDetails[stat.player.id] = {
      player: stat.player,
      summary,
      recentMatches: [...stat.recentMatches]
        .sort((a, b) => {
          if (a.sessionId !== b.sessionId) return b.sessionId.localeCompare(a.sessionId);
          return b.round - a.round;
        })
        .slice(0, 20),
      topPartners,
      topOpponents,
    };
  }

  return {
    ranking: rankingRows,
    playerDetails,
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

export function buildAllRankingStats(): RankingBuildResult {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  return buildRankingFromData(players, sessions, matches);
}

export function getRanking() {
  return buildAllRankingStats().ranking;
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const data = buildAllRankingStats();
  return data.playerDetails[playerId] ?? null;
}

/* =========================================================
   BACKWARD COMPATIBILITY
   - app/ranking/page.tsx có thể gọi rebuildRankingData({ players, sessions, matches })
   - app/session/[id]/page.tsx có thể gọi rebuildRankingData()
========================================================= */

export function rebuildRankingData(input?: {
  players?: Player[];
  sessions?: SessionRecord[];
  matches?: MatchRecord[];
}) {
  if (!input) {
    return buildAllRankingStats();
  }

  const players = input.players ?? getPlayers();
  const sessions = input.sessions ?? getSessions();
  const matches = input.matches ?? getMatches();

  return buildRankingFromData(players, sessions, matches);
}