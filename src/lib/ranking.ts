import type {
  MatchRecord,
  OpponentStat,
  PartnerStat,
  Player,
  PlayerDetailStats,
  PlayerRecentMatch,
  PlayerSummary,
  RankingMode,
  RankingRebuildResult,
  RankingRow,
  SessionRecord,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

/* =========================================================
   CONFIG
========================================================= */

const BASE_RATING = 1000;
const ELO_K = 24;

/* =========================================================
   INTERNAL TYPES
========================================================= */

type MatchResult = "W" | "L" | "D";

interface MutableRankingState {
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

  last5: MatchResult[];
}

interface ProcessedMatch {
  match: MatchRecord;
  session: SessionRecord;
  mode: RankingMode;
}

interface RankingBuildState {
  byPlayer: Map<string, MutableRankingState>;
  processedMatches: ProcessedMatch[];
}

/* =========================================================
   HELPERS
========================================================= */

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function clampLast5(results: MatchResult[]) {
  if (results.length <= 5) return results;
  return results.slice(results.length - 5);
}

function safeWinRate(wins: number, draws: number, matches: number) {
  if (matches <= 0) return 0;
  return round2(((wins + draws * 0.5) / matches) * 100);
}

function calcRankScore(row: {
  rating: number;
  winRate: number;
  pointDiff: number;
  wins: number;
}) {
  // giữ công thức đơn giản, dễ hiểu
  // rating vẫn là tiêu chí chính
  return round2(
    row.rating +
      row.winRate * 0.8 +
      row.pointDiff * 0.3 +
      row.wins * 1
  );
}

function getResult(scoreFor: number, scoreAgainst: number): MatchResult {
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "D";
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function actualScore(result: MatchResult) {
  if (result === "W") return 1;
  if (result === "L") return 0;
  return 0.5;
}

function ensureState(
  map: Map<string, MutableRankingState>,
  player: Player
): MutableRankingState {
  let row = map.get(player.id);
  if (!row) {
    row = {
      playerId: player.id,
      playerName: player.name,
      nickname: player.nickname,
      rating: BASE_RATING,
      wins: 0,
      losses: 0,
      draws: 0,
      matches: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      last5: [],
    };
    map.set(player.id, row);
  }
  return row;
}

function buildPlayerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function buildSessionMap(sessions: SessionRecord[]) {
  return new Map(sessions.map((s) => [s.id, s]));
}

function teamAverageRating(
  ids: string[],
  stateMap: Map<string, MutableRankingState>,
  playerMap: Map<string, Player>
) {
  if (ids.length === 0) return BASE_RATING;

  let total = 0;
  let count = 0;

  ids.forEach((id) => {
    const player = playerMap.get(id);
    if (!player) return;

    const state = ensureState(stateMap, player);
    total += state.rating;
    count += 1;
  });

  return count > 0 ? total / count : BASE_RATING;
}

function applyBasicStats(
  state: MutableRankingState,
  result: MatchResult,
  scoreFor: number,
  scoreAgainst: number
) {
  state.matches += 1;
  state.pointsFor += scoreFor;
  state.pointsAgainst += scoreAgainst;

  if (result === "W") state.wins += 1;
  else if (result === "L") state.losses += 1;
  else state.draws += 1;

  state.last5.push(result);
  state.last5 = clampLast5(state.last5);
}

function sortRankingRows(rows: RankingRow[]) {
  return [...rows].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName, "vi");
  });
}

function buildSummaryFromRow(row?: RankingRow): PlayerSummary {
  if (!row) {
    return {
      rating: BASE_RATING,
      rankScore: BASE_RATING,
      wins: 0,
      losses: 0,
      draws: 0,
      matches: 0,
      winRate: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      streakType: "none",
      streakCount: 0,
    };
  }

  const { streakType, streakCount } = computeStreak(row.last5);

  return {
    rating: row.rating,
    rankScore: row.rankScore,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    matches: row.matches,
    winRate: row.winRate / 100,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    pointDiff: row.pointDiff,
    streakType,
    streakCount,
  };
}

function computeStreak(last5: Array<"W" | "L" | "D">): {
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
} {
  if (!last5.length) {
    return { streakType: "none", streakCount: 0 };
  }

  const latest = last5[last5.length - 1];
  let count = 0;

  for (let i = last5.length - 1; i >= 0; i -= 1) {
    if (last5[i] === latest) count += 1;
    else break;
  }

  return {
    streakType:
      latest === "W" ? "win" : latest === "L" ? "loss" : "draw",
    streakCount: count,
  };
}

function createEmptySummary(): PlayerSummary {
  return {
    rating: BASE_RATING,
    rankScore: BASE_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    winRate: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,
    streakType: "none",
    streakCount: 0,
  };
}

/* =========================================================
   CORE BUILD
========================================================= */

function buildRankingForMode(params: {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
  mode: RankingMode;
}): RankingBuildState {
  const { players, sessions, matches, mode } = params;

  const playerMap = buildPlayerMap(players);
  const sessionMap = buildSessionMap(sessions);
  const byPlayer = new Map<string, MutableRankingState>();
  const processedMatches: ProcessedMatch[] = [];

  // ensure all players exist in ranking even if chưa đánh trận nào
  players.forEach((p) => ensureState(byPlayer, p));

  const filteredMatches = matches
    .map((match) => {
      const session = sessionMap.get(match.sessionId);
      if (!session) return null;
      if ((session.mode ?? "normal") !== mode) return null;
      return { match, session, mode } satisfies ProcessedMatch;
    })
    .filter(Boolean) as ProcessedMatch[];

  // sort theo thời gian/round để elo chạy ổn định hơn
  filteredMatches.sort((a, b) => {
    const da = a.session.date.localeCompare(b.session.date);
    if (da !== 0) return da;
    if (a.match.round !== b.match.round) return a.match.round - b.match.round;
    return (a.match.court ?? 1) - (b.match.court ?? 1);
  });

  for (const item of filteredMatches) {
    const { match } = item;

    const teamAIds = match.teamA.memberIds ?? [];
    const teamBIds = match.teamB.memberIds ?? [];

    if (teamAIds.length === 0 || teamBIds.length === 0) continue;

    const teamARating = teamAverageRating(teamAIds, byPlayer, playerMap);
    const teamBRating = teamAverageRating(teamBIds, byPlayer, playerMap);

    const resultA = getResult(match.scoreA, match.scoreB);
    const resultB = getResult(match.scoreB, match.scoreA);

    const expectedA = expectedScore(teamARating, teamBRating);
    const expectedB = expectedScore(teamBRating, teamARating);

    const actualA = actualScore(resultA);
    const actualB = actualScore(resultB);

    const deltaA = ELO_K * (actualA - expectedA);
    const deltaB = ELO_K * (actualB - expectedB);

    // apply stats + elo cho từng người trong team
    teamAIds.forEach((playerId) => {
      const player = playerMap.get(playerId);
      if (!player) return;

      const state = ensureState(byPlayer, player);
      applyBasicStats(state, resultA, match.scoreA, match.scoreB);
      state.rating = round2(state.rating + deltaA);
    });

    teamBIds.forEach((playerId) => {
      const player = playerMap.get(playerId);
      if (!player) return;

      const state = ensureState(byPlayer, player);
      applyBasicStats(state, resultB, match.scoreB, match.scoreA);
      state.rating = round2(state.rating + deltaB);
    });

    processedMatches.push(item);
  }

  return {
    byPlayer,
    processedMatches,
  };
}

function convertStateToRows(
  byPlayer: Map<string, MutableRankingState>
): RankingRow[] {
  const rows: RankingRow[] = Array.from(byPlayer.values()).map((state) => {
    const pointDiff = state.pointsFor - state.pointsAgainst;
    const winRate = safeWinRate(state.wins, state.draws, state.matches);

    const row: RankingRow = {
      playerId: state.playerId,
      playerName: state.playerName,
      nickname: state.nickname,
      rating: round2(state.rating),
      wins: state.wins,
      losses: state.losses,
      draws: state.draws,
      matches: state.matches,
      winRate,
      pointsFor: state.pointsFor,
      pointsAgainst: state.pointsAgainst,
      pointDiff,
      rankScore: 0,
      last5: state.last5,
    };

    row.rankScore = calcRankScore(row);
    return row;
  });

  return sortRankingRows(rows);
}

/* =========================================================
   PUBLIC: REBUILD RANKING
========================================================= */

export function rebuildRankingData(params: {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
}): RankingRebuildResult {
  const { players, sessions, matches } = params;

  const normalState = buildRankingForMode({
    players,
    sessions,
    matches,
    mode: "normal",
  });

  const teamState = buildRankingForMode({
    players,
    sessions,
    matches,
    mode: "team",
  });

  const normalRows = convertStateToRows(normalState.byPlayer);
  const teamRows = convertStateToRows(teamState.byPlayer);

  const normalRowMap = new Map(normalRows.map((r) => [r.playerId, r]));
  const teamRowMap = new Map(teamRows.map((r) => [r.playerId, r]));

  const nextPlayers: Player[] = players.map((player) => {
    const normal = normalRowMap.get(player.id);
    const team = teamRowMap.get(player.id);

    const normalRating = normal?.rating ?? BASE_RATING;
    const teamRating = team?.rating ?? BASE_RATING;

    const winsNormal = normal?.wins ?? 0;
    const lossesNormal = normal?.losses ?? 0;
    const matchesNormal = normal?.matches ?? 0;
    const pointsForNormal = normal?.pointsFor ?? 0;
    const pointsAgainstNormal = normal?.pointsAgainst ?? 0;

    const winsTeam = team?.wins ?? 0;
    const lossesTeam = team?.losses ?? 0;
    const matchesTeam = team?.matches ?? 0;
    const pointsForTeam = team?.pointsFor ?? 0;
    const pointsAgainstTeam = team?.pointsAgainst ?? 0;

    return {
      ...player,

      // legacy overall = gộp normal + team
      rating: round2((normalRating + teamRating) / 2),
      wins: winsNormal + winsTeam,
      losses: lossesNormal + lossesTeam,
      matches: matchesNormal + matchesTeam,

      // normal
      ratingNormal: normalRating,
      winsNormal,
      lossesNormal,
      matchesNormal,
      pointsForNormal,
      pointsAgainstNormal,

      // team
      ratingTeam: teamRating,
      winsTeam,
      lossesTeam,
      matchesTeam,
      pointsForTeam,
      pointsAgainstTeam,
    };
  });

  return {
    players: nextPlayers,
    normalRows,
    teamRows,
  };
}

/* =========================================================
   PUBLIC: GET RANKING TABLES
========================================================= */

export function getRankingRows(mode: RankingMode): RankingRow[] {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const rebuilt = rebuildRankingData({ players, sessions, matches });
  return mode === "normal" ? rebuilt.normalRows : rebuilt.teamRows;
}

/* =========================================================
   PLAYER DETAIL
========================================================= */

function buildRecentMatchesForPlayer(params: {
  playerId: string;
  processedNormal: ProcessedMatch[];
  processedTeam: ProcessedMatch[];
}): PlayerRecentMatch[] {
  const { playerId, processedNormal, processedTeam } = params;

  const all = [...processedNormal, ...processedTeam];

  const result: PlayerRecentMatch[] = [];

  for (const item of all) {
    const { match, mode } = item;

    const teamAIds = match.teamA.memberIds ?? [];
    const teamBIds = match.teamB.memberIds ?? [];

    const inA = teamAIds.includes(playerId);
    const inB = teamBIds.includes(playerId);

    if (!inA && !inB) continue;

    const isTeamA = inA;
    const ownTeam = isTeamA ? teamAIds : teamBIds;
    const oppTeam = isTeamA ? teamBIds : teamAIds;

    const scoreFor = isTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = isTeamA ? match.scoreB : match.scoreA;

    result.push({
      matchId: match.id,
      sessionId: match.sessionId,
      sessionMode: mode,
      round: match.round,
      court: match.court ?? 1,
      result: getResult(scoreFor, scoreAgainst),
      scoreFor,
      scoreAgainst,
      partnerIds: ownTeam.filter((id) => id !== playerId),
      opponentIds: [...oppTeam],
      createdAt: match.createdAt,
    });
  }

  result.sort((a, b) => {
    const da = (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    if (da !== 0) return da;
    return b.round - a.round;
  });

  return result.slice(0, 20);
}

function buildPartnerStats(params: {
  playerId: string;
  processedNormal: ProcessedMatch[];
  processedTeam: ProcessedMatch[];
  playerMap: Map<string, Player>;
}): PartnerStat[] {
  const { playerId, processedNormal, processedTeam, playerMap } = params;

  const map = new Map<
    string,
    { count: number; winsTogether: number; lossesTogether: number }
  >();

  const all = [...processedNormal, ...processedTeam];

  for (const item of all) {
    const { match } = item;

    const teamAIds = match.teamA.memberIds ?? [];
    const teamBIds = match.teamB.memberIds ?? [];

    let sameTeam: string[] = [];
    let result: MatchResult | null = null;

    if (teamAIds.includes(playerId)) {
      sameTeam = teamAIds.filter((id) => id !== playerId);
      result = getResult(match.scoreA, match.scoreB);
    } else if (teamBIds.includes(playerId)) {
      sameTeam = teamBIds.filter((id) => id !== playerId);
      result = getResult(match.scoreB, match.scoreA);
    } else {
      continue;
    }

    sameTeam.forEach((partnerId) => {
      const current = map.get(partnerId) ?? {
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      current.count += 1;
      if (result === "W") current.winsTogether += 1;
      if (result === "L") current.lossesTogether += 1;

      map.set(partnerId, current);
    });
  }

  return Array.from(map.entries())
    .map(([partnerId, stat]) => {
      const partner = playerMap.get(partnerId);
      return {
        playerId: partnerId,
        name: partner?.name ?? partnerId,
        count: stat.count,
        winsTogether: stat.winsTogether,
        lossesTogether: stat.lossesTogether,
      } satisfies PartnerStat;
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.winsTogether - a.winsTogether;
    })
    .slice(0, 10);
}

function buildOpponentStats(params: {
  playerId: string;
  processedNormal: ProcessedMatch[];
  processedTeam: ProcessedMatch[];
  playerMap: Map<string, Player>;
}): OpponentStat[] {
  const { playerId, processedNormal, processedTeam, playerMap } = params;

  const map = new Map<
    string,
    { count: number; winsAgainst: number; lossesAgainst: number }
  >();

  const all = [...processedNormal, ...processedTeam];

  for (const item of all) {
    const { match } = item;

    const teamAIds = match.teamA.memberIds ?? [];
    const teamBIds = match.teamB.memberIds ?? [];

    let opponents: string[] = [];
    let result: MatchResult | null = null;

    if (teamAIds.includes(playerId)) {
      opponents = [...teamBIds];
      result = getResult(match.scoreA, match.scoreB);
    } else if (teamBIds.includes(playerId)) {
      opponents = [...teamAIds];
      result = getResult(match.scoreB, match.scoreA);
    } else {
      continue;
    }

    opponents.forEach((opponentId) => {
      const current = map.get(opponentId) ?? {
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      current.count += 1;
      if (result === "W") current.winsAgainst += 1;
      if (result === "L") current.lossesAgainst += 1;

      map.set(opponentId, current);
    });
  }

  return Array.from(map.entries())
    .map(([opponentId, stat]) => {
      const opponent = playerMap.get(opponentId);
      return {
        playerId: opponentId,
        name: opponent?.name ?? opponentId,
        count: stat.count,
        winsAgainst: stat.winsAgainst,
        lossesAgainst: stat.lossesAgainst,
      } satisfies OpponentStat;
    })
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.winsAgainst - a.winsAgainst;
    })
    .slice(0, 10);
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const playerMap = buildPlayerMap(players);

  const normalState = buildRankingForMode({
    players,
    sessions,
    matches,
    mode: "normal",
  });

  const teamState = buildRankingForMode({
    players,
    sessions,
    matches,
    mode: "team",
  });

  const normalRows = convertStateToRows(normalState.byPlayer);
  const teamRows = convertStateToRows(teamState.byPlayer);

  const normalRow = normalRows.find((r) => r.playerId === playerId);
  const teamRow = teamRows.find((r) => r.playerId === playerId);

  const summaryNormal = normalRow
    ? buildSummaryFromRow(normalRow)
    : createEmptySummary();

  const summaryTeam = teamRow
    ? buildSummaryFromRow(teamRow)
    : createEmptySummary();

  const mergedLast5 = [
    ...(normalRow?.last5 ?? []),
    ...(teamRow?.last5 ?? []),
  ].slice(-5);

  const summary: PlayerSummary = {
    rating: round2((summaryNormal.rating + summaryTeam.rating) / 2),
    rankScore: round2(summaryNormal.rankScore + summaryTeam.rankScore),
    wins: summaryNormal.wins + summaryTeam.wins,
    losses: summaryNormal.losses + summaryTeam.losses,
    draws: summaryNormal.draws + summaryTeam.draws,
    matches: summaryNormal.matches + summaryTeam.matches,
    winRate:
      summaryNormal.matches + summaryTeam.matches > 0
        ? (summaryNormal.wins +
            summaryTeam.wins +
            (summaryNormal.draws + summaryTeam.draws) * 0.5) /
          (summaryNormal.matches + summaryTeam.matches)
        : 0,
    pointsFor: summaryNormal.pointsFor + summaryTeam.pointsFor,
    pointsAgainst: summaryNormal.pointsAgainst + summaryTeam.pointsAgainst,
    pointDiff: summaryNormal.pointDiff + summaryTeam.pointDiff,
    ...computeStreak(mergedLast5),
  };

  const recentMatches = buildRecentMatchesForPlayer({
    playerId,
    processedNormal: normalState.processedMatches,
    processedTeam: teamState.processedMatches,
  });

  const topPartners = buildPartnerStats({
    playerId,
    processedNormal: normalState.processedMatches,
    processedTeam: teamState.processedMatches,
    playerMap,
  });

  const topOpponents = buildOpponentStats({
    playerId,
    processedNormal: normalState.processedMatches,
    processedTeam: teamState.processedMatches,
    playerMap,
  });

  return {
    player,
    summary,
    summaryNormal,
    summaryTeam,
    recentMatches,
    topPartners,
    topOpponents,
  };
}