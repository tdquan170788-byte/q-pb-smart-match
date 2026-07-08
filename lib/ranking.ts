import type { MatchRecord, Player, SessionRecord } from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

/* =========================================================
   SPRINT 9A.4 - CLEAN PATCH
   - Elo tách theo normal / team
   - Có ranking tổng hợp + detail stats
   - Backward compatible cho:
     + getRanking()
     + getPlayerDetailStats()
     + rebuildRankingData()
   - rebuildRankingData() trả về cả players đã được rebuild stat
========================================================= */

export type RankingMode = "all" | "normal" | "team";

export type RankingRow = {
  rank: number;
  playerId: string;
  name: string;
  nickname?: string;

  mode: "normal" | "team" | "all";

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
  mode: "normal" | "team";
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

  /**
   * summary mặc định dùng cho UI tổng quát.
   * Sprint 9A.4: mặc định ưu tiên normal nếu có trận normal,
   * nếu không thì fallback team.
   */
  summary: RankingRow;

  /**
   * thống kê tách theo mode
   */
  summaryNormal: RankingRow | null;
  summaryTeam: RankingRow | null;

  recentMatches: PlayerRecentMatch[];
  topPartners: PartnerStat[];
  topOpponents: OpponentStat[];
};

export type RankingBuildResult = {
  /**
   * Ranking mặc định cho UI cũ:
   * ưu tiên normal nếu có, fallback team nếu không có normal
   */
  ranking: RankingRow[];

  /**
   * thêm ranking theo mode để dùng sau này
   */
  rankingNormal: RankingRow[];
  rankingTeam: RankingRow[];

  /**
   * player details cho trang member detail
   */
  playerDetails: Record<string, PlayerDetailStats>;

  /**
   * players đã rebuild lại stat/rating để save xuống localStorage
   * -> dùng cho app/session/[id]/page.tsx
   */
  players: Player[];
};

type MutablePlayerStat = {
  player: Player;
  mode: "normal" | "team";

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

function getSessionMode(session?: SessionRecord | null): "normal" | "team" {
  return session?.mode === "team" ? "team" : "normal";
}

function getPlayerInitialRatingByMode(
  player: Player,
  mode: "normal" | "team"
) {
  if (mode === "team") {
    return typeof player.ratingTeam === "number"
      ? player.ratingTeam
      : DEFAULT_RATING;
  }

  return typeof player.ratingNormal === "number"
    ? player.ratingNormal
    : DEFAULT_RATING;
}

function createEmptyStat(
  player: Player,
  mode: "normal" | "team"
): MutablePlayerStat {
  return {
    player,
    mode,
    rating: getPlayerInitialRatingByMode(player, mode),
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

function ensureStat(
  statMap: Record<string, MutablePlayerStat>,
  playerMap: Record<string, Player>,
  playerId: string,
  mode: "normal" | "team"
) {
  if (!statMap[playerId]) {
    const player = playerMap[playerId];
    if (!player) {
      statMap[playerId] = createEmptyStat(
        {
          id: playerId,
          name: playerId,
          nickname: "",
          rating: DEFAULT_RATING,
          wins: 0,
          losses: 0,
          matches: 0,
          ratingNormal: DEFAULT_RATING,
          winsNormal: 0,
          lossesNormal: 0,
          matchesNormal: 0,
          pointsForNormal: 0,
          pointsAgainstNormal: 0,
          ratingTeam: DEFAULT_RATING,
          winsTeam: 0,
          lossesTeam: 0,
          matchesTeam: 0,
          pointsForTeam: 0,
          pointsAgainstTeam: 0,
        },
        mode
      );
    } else {
      statMap[playerId] = createEmptyStat(player, mode);
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

function sortRecentMatches(
  matches: PlayerRecentMatch[],
  sessionMap: Record<string, SessionRecord>
) {
  return [...matches].sort((a, b) => {
    const sa = sessionMap[a.sessionId];
    const sb = sessionMap[b.sessionId];

    const timeA = safeDateValue(sa?.createdAt || sa?.date);
    const timeB = safeDateValue(sb?.createdAt || sb?.date);

    if (timeA !== timeB) return timeB - timeA;
    if (a.round !== b.round) return b.round - a.round;
    return b.matchId.localeCompare(a.matchId);
  });
}

function buildRankingRows(
  statMap: Record<string, MutablePlayerStat>,
  mode: "normal" | "team"
): RankingRow[] {
  const rows: RankingRow[] = Object.values(statMap).map((stat) => {
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

    // rankScore tổng hợp:
    // Elo là lõi chính, cộng thêm các chỉ số phụ có trọng số vừa phải
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
      mode,
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

  rows.sort((a, b) => {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return a.name.localeCompare(b.name, "vi");
  });

  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

function buildEmptyRankingRow(
  player: Player,
  mode: "normal" | "team"
): RankingRow {
  return {
    rank: 0,
    playerId: player.id,
    name: player.name,
    nickname: player.nickname ?? "",
    mode,
    rating:
      mode === "team"
        ? player.ratingTeam ?? DEFAULT_RATING
        : player.ratingNormal ?? DEFAULT_RATING,
    rankScore:
      mode === "team"
        ? player.ratingTeam ?? DEFAULT_RATING
        : player.ratingNormal ?? DEFAULT_RATING,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    sos: DEFAULT_RATING,
    form: 0,
    streakType: "none",
    streakCount: 0,
  };
}

function pickDefaultSummary(
  normal: RankingRow | null,
  team: RankingRow | null,
  player: Player
): RankingRow {
  if (normal && normal.matches > 0) return normal;
  if (team && team.matches > 0) return team;
  if (normal) return normal;
  if (team) return team;
  return buildEmptyRankingRow(player, "normal");
}

function mergePartnerStats(
  playerId: string,
  playerMap: Record<string, Player>,
  normalMap?: Record<
    string,
    {
      count: number;
      winsTogether: number;
      lossesTogether: number;
    }
  >,
  teamMap?: Record<
    string,
    {
      count: number;
      winsTogether: number;
      lossesTogether: number;
    }
  >
): PartnerStat[] {
  const ids = new Set([
    ...Object.keys(normalMap ?? {}),
    ...Object.keys(teamMap ?? {}),
  ]);

  return Array.from(ids)
    .map((id) => {
      const a = normalMap?.[id];
      const b = teamMap?.[id];

      return {
        playerId: id,
        name: playerMap[id]?.name ?? id,
        count: (a?.count ?? 0) + (b?.count ?? 0),
        winsTogether: (a?.winsTogether ?? 0) + (b?.winsTogether ?? 0),
        lossesTogether: (a?.lossesTogether ?? 0) + (b?.lossesTogether ?? 0),
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.winsTogether !== a.winsTogether) return b.winsTogether - a.winsTogether;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 8);
}

function mergeOpponentStats(
  playerId: string,
  playerMap: Record<string, Player>,
  normalMap?: Record<
    string,
    {
      count: number;
      winsAgainst: number;
      lossesAgainst: number;
    }
  >,
  teamMap?: Record<
    string,
    {
      count: number;
      winsAgainst: number;
      lossesAgainst: number;
    }
  >
): OpponentStat[] {
  const ids = new Set([
    ...Object.keys(normalMap ?? {}),
    ...Object.keys(teamMap ?? {}),
  ]);

  return Array.from(ids)
    .map((id) => {
      const a = normalMap?.[id];
      const b = teamMap?.[id];

      return {
        playerId: id,
        name: playerMap[id]?.name ?? id,
        count: (a?.count ?? 0) + (b?.count ?? 0),
        winsAgainst: (a?.winsAgainst ?? 0) + (b?.winsAgainst ?? 0),
        lossesAgainst: (a?.lossesAgainst ?? 0) + (b?.lossesAgainst ?? 0),
      };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.winsAgainst !== a.winsAgainst) return b.winsAgainst - a.winsAgainst;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 8);
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

  const normalStatMap: Record<string, MutablePlayerStat> = {};
  const teamStatMap: Record<string, MutablePlayerStat> = {};

  // init stat cho toàn bộ player hiện có
  for (const player of players) {
    normalStatMap[player.id] = createEmptyStat(player, "normal");
    teamStatMap[player.id] = createEmptyStat(player, "team");
  }

  const sessionMap = Object.fromEntries(sessions.map((s) => [s.id, s]));

  // sort matches theo thời gian + round để Elo cập nhật ổn định
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
    const session = sessionMap[match.sessionId];
    const mode = getSessionMode(session);
    const targetStatMap = mode === "team" ? teamStatMap : normalStatMap;

    const teamAIds = uniqueIds(match.teamA?.playerIds ?? []);
    const teamBIds = uniqueIds(match.teamB?.playerIds ?? []);

    if (!teamAIds.length || !teamBIds.length) continue;

    const teamAStats = teamAIds.map((id) =>
      ensureStat(targetStatMap, playerMap, id, mode)
    );
    const teamBStats = teamBIds.map((id) =>
      ensureStat(targetStatMap, playerMap, id, mode)
    );

    const avgRatingA = avg(teamAStats.map((s) => s.rating));
    const avgRatingB = avg(teamBStats.map((s) => s.rating));

    const resultA = getResultScore(match.scoreA, match.scoreB);
    const resultB = resultA === 1 ? 0 : resultA === 0 ? 1 : 0.5;

    const expectedA = expectedScore(avgRatingA, avgRatingB);
    const expectedB = expectedScore(avgRatingB, avgRatingA);

    // margin bonus nhẹ để thắng đậm có thêm ảnh hưởng nhưng không quá lớn
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
        mode,
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
        mode,
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

  /* =========================================================
     BUILD RANKINGS
  ========================================================= */

  const rankingNormal = buildRankingRows(normalStatMap, "normal");
  const rankingTeam = buildRankingRows(teamStatMap, "team");

  const rankingNormalMap = Object.fromEntries(
    rankingNormal.map((row) => [row.playerId, row])
  ) as Record<string, RankingRow>;

  const rankingTeamMap = Object.fromEntries(
    rankingTeam.map((row) => [row.playerId, row])
  ) as Record<string, RankingRow>;

  /**
   * ranking mặc định:
   * - ưu tiên summary normal nếu có trận normal
   * - nếu chưa có normal thì fallback team
   */
  const ranking = players
    .map((player) => {
      const normal = rankingNormalMap[player.id] ?? null;
      const team = rankingTeamMap[player.id] ?? null;
      return pickDefaultSummary(normal, team, player);
    })
    .sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      return a.name.localeCompare(b.name, "vi");
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      mode: "all" as const,
    }));

  /* =========================================================
     BUILD PLAYER DETAILS
  ========================================================= */

  const playerDetails: Record<string, PlayerDetailStats> = {};

  for (const player of players) {
    const normalStat = normalStatMap[player.id];
    const teamStat = teamStatMap[player.id];

    const summaryNormal = rankingNormalMap[player.id] ?? null;
    const summaryTeam = rankingTeamMap[player.id] ?? null;
    const summary = pickDefaultSummary(summaryNormal, summaryTeam, player);

    const recentMatches = sortRecentMatches(
      [
        ...(normalStat?.recentMatches ?? []),
        ...(teamStat?.recentMatches ?? []),
      ],
      sessionMap
    ).slice(0, 20);

    const topPartners = mergePartnerStats(
      player.id,
      playerMap,
      normalStat?.teammateMap,
      teamStat?.teammateMap
    );

    const topOpponents = mergeOpponentStats(
      player.id,
      playerMap,
      normalStat?.opponentMap,
      teamStat?.opponentMap
    );

    playerDetails[player.id] = {
      player,
      summary,
      summaryNormal,
      summaryTeam,
      recentMatches,
      topPartners,
      topOpponents,
    };
  }

  /* =========================================================
     REBUILD PLAYERS (save back to storage)
  ========================================================= */

  const rebuiltPlayers: Player[] = players.map((player) => {
    const normal = rankingNormalMap[player.id];
    const team = rankingTeamMap[player.id];
    const preferred = pickDefaultSummary(normal ?? null, team ?? null, player);

    return {
      ...player,

      // legacy tổng hợp cho UI cũ
      rating: preferred.rating,
      wins: preferred.wins,
      losses: preferred.losses,
      matches: preferred.matches,

      // normal
      ratingNormal: normal?.rating ?? DEFAULT_RATING,
      winsNormal: normal?.wins ?? 0,
      lossesNormal: normal?.losses ?? 0,
      matchesNormal: normal?.matches ?? 0,
      pointsForNormal: normal?.pointsFor ?? 0,
      pointsAgainstNormal: normal?.pointsAgainst ?? 0,

      // team
      ratingTeam: team?.rating ?? DEFAULT_RATING,
      winsTeam: team?.wins ?? 0,
      lossesTeam: team?.losses ?? 0,
      matchesTeam: team?.matches ?? 0,
      pointsForTeam: team?.pointsFor ?? 0,
      pointsAgainstTeam: team?.pointsAgainst ?? 0,
    };
  });

  return {
    ranking,
    rankingNormal,
    rankingTeam,
    playerDetails,
    players: rebuiltPlayers,
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

export function getRanking(mode: RankingMode = "all") {
  const data = buildAllRankingStats();

  if (mode === "normal") return data.rankingNormal;
  if (mode === "team") return data.rankingTeam;
  return data.ranking;
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