import type {
  MatchRecord,
  Player,
  PlayerDetailStats,
  PlayerOpponentStat,
  PlayerPartnerStat,
  PlayerRecentMatch,
  PlayerSummary,
  RankingMode,
  RankingRow,
  SessionRecord,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

type RebuildInput = {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
};

type InternalAgg = {
  playerId: string;
  playerName: string;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  pointsFor: number;
  pointsAgainst: number;
  last5: Array<"W" | "L">;
};

type InternalModeAgg = Record<string, InternalAgg>;

const BASE_RATING = 1000;
const K_FACTOR = 20;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calcRankScore(row: {
  rating: number;
  winRate: number;
  pointDiff: number;
  wins: number;
}) {
  return (
    row.rating +
    row.winRate * 2 +
    row.pointDiff * 0.2 +
    row.wins * 0.5
  );
}

function buildEmptyAgg(player: Player, mode: RankingMode): InternalAgg {
  return {
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname ?? "",
    rating: mode === "normal" ? player.ratingNormal ?? BASE_RATING : player.ratingTeam ?? BASE_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
  };
}

function ensureAgg(
  map: InternalModeAgg,
  player: Player,
  mode: RankingMode
): InternalAgg {
  if (!map[player.id]) {
    map[player.id] = buildEmptyAgg(player, mode);
  }
  return map[player.id];
}

function pushLast5(arr: Array<"W" | "L">, value: "W" | "L") {
  arr.push(value);
  if (arr.length > 5) {
    arr.splice(0, arr.length - 5);
  }
}

function sortRankingRows(a: RankingRow, b: RankingRow) {
  if (b.rating !== a.rating) return b.rating - a.rating;
  if (b.winRate !== a.winRate) return b.winRate - a.winRate;
  if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.playerName.localeCompare(b.playerName, "vi");
}

function toRankingRows(map: InternalModeAgg): RankingRow[] {
  return Object.values(map)
    .map((agg) => {
      const pointDiff = agg.pointsFor - agg.pointsAgainst;
      const winRate = agg.matches > 0 ? Math.round((agg.wins / agg.matches) * 100) : 0;

      const row: RankingRow = {
        playerId: agg.playerId,
        playerName: agg.playerName,
        nickname: agg.nickname,
        rating: round2(agg.rating),
        wins: agg.wins,
        losses: agg.losses,
        draws: agg.draws,
        matches: agg.matches,
        pointsFor: agg.pointsFor,
        pointsAgainst: agg.pointsAgainst,
        pointDiff,
        winRate,
        rankScore: round2(
          calcRankScore({
            rating: agg.rating,
            winRate,
            pointDiff,
            wins: agg.wins,
          })
        ),
        last5: [...agg.last5],
      };

      return row;
    })
    .sort(sortRankingRows);
}

function buildPlayerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function buildSessionMap(sessions: SessionRecord[]) {
  return new Map(sessions.map((s) => [s.id, s]));
}

function applyMatchToAgg(
  match: MatchRecord,
  session: SessionRecord,
  playerMap: Map<string, Player>,
  normalAgg: InternalModeAgg,
  teamAgg: InternalModeAgg
) {
  const mode: RankingMode = session.mode === "team" ? "team" : "normal";
  const targetAgg = mode === "normal" ? normalAgg : teamAgg;

  const teamAPlayers = match.teamA.playerIds
    .map((id) => playerMap.get(id))
    .filter(Boolean) as Player[];

  const teamBPlayers = match.teamB.playerIds
    .map((id) => playerMap.get(id))
    .filter(Boolean) as Player[];

  if (teamAPlayers.length === 0 || teamBPlayers.length === 0) return;

  const scoreA = Number(match.scoreA ?? 0);
  const scoreB = Number(match.scoreB ?? 0);

  const avgRatingA =
    teamAPlayers.reduce(
      (sum, p) =>
        sum + (mode === "normal" ? p.ratingNormal ?? BASE_RATING : p.ratingTeam ?? BASE_RATING),
      0
    ) / teamAPlayers.length;

  const avgRatingB =
    teamBPlayers.reduce(
      (sum, p) =>
        sum + (mode === "normal" ? p.ratingNormal ?? BASE_RATING : p.ratingTeam ?? BASE_RATING),
      0
    ) / teamBPlayers.length;

  const expectedA = expectedScore(avgRatingA, avgRatingB);
  const expectedB = expectedScore(avgRatingB, avgRatingA);

  let actualA = 0;
  let actualB = 0;

  if (scoreA > scoreB) {
    actualA = 1;
    actualB = 0;
  } else if (scoreA < scoreB) {
    actualA = 0;
    actualB = 1;
  } else {
    actualA = 0.5;
    actualB = 0.5;
  }

  const deltaA = K_FACTOR * (actualA - expectedA);
  const deltaB = K_FACTOR * (actualB - expectedB);

  for (const player of teamAPlayers) {
    const agg = ensureAgg(targetAgg, player, mode);
    agg.matches += 1;
    agg.pointsFor += scoreA;
    agg.pointsAgainst += scoreB;
    agg.rating = round2(agg.rating + deltaA);

    if (scoreA > scoreB) {
      agg.wins += 1;
      pushLast5(agg.last5, "W");
    } else if (scoreA < scoreB) {
      agg.losses += 1;
      pushLast5(agg.last5, "L");
    } else {
      agg.draws += 1;
    }
  }

  for (const player of teamBPlayers) {
    const agg = ensureAgg(targetAgg, player, mode);
    agg.matches += 1;
    agg.pointsFor += scoreB;
    agg.pointsAgainst += scoreA;
    agg.rating = round2(agg.rating + deltaB);

    if (scoreB > scoreA) {
      agg.wins += 1;
      pushLast5(agg.last5, "W");
    } else if (scoreB < scoreA) {
      agg.losses += 1;
      pushLast5(agg.last5, "L");
    } else {
      agg.draws += 1;
    }
  }
}

function buildUpdatedPlayers(
  players: Player[],
  normalRows: RankingRow[],
  teamRows: RankingRow[]
): Player[] {
  const normalMap = new Map(normalRows.map((r) => [r.playerId, r]));
  const teamMap = new Map(teamRows.map((r) => [r.playerId, r]));

  return players.map((player) => {
    const normal = normalMap.get(player.id);
    const team = teamMap.get(player.id);

    const ratingNormal = normal?.rating ?? BASE_RATING;
    const winsNormal = normal?.wins ?? 0;
    const lossesNormal = normal?.losses ?? 0;
    const matchesNormal = normal?.matches ?? 0;
    const pointsForNormal = normal?.pointsFor ?? 0;
    const pointsAgainstNormal = normal?.pointsAgainst ?? 0;

    const ratingTeam = team?.rating ?? BASE_RATING;
    const winsTeam = team?.wins ?? 0;
    const lossesTeam = team?.losses ?? 0;
    const matchesTeam = team?.matches ?? 0;
    const pointsForTeam = team?.pointsFor ?? 0;
    const pointsAgainstTeam = team?.pointsAgainst ?? 0;

    return {
      ...player,

      ratingNormal,
      winsNormal,
      lossesNormal,
      matchesNormal,
      pointsForNormal,
      pointsAgainstNormal,

      ratingTeam,
      winsTeam,
      lossesTeam,
      matchesTeam,
      pointsForTeam,
      pointsAgainstTeam,

      // legacy tổng = cộng dồn cả 2 mode
      rating: round2((ratingNormal + ratingTeam) / 2),
      wins: winsNormal + winsTeam,
      losses: lossesNormal + lossesTeam,
      matches: matchesNormal + matchesTeam,
    };
  });
}

export function rebuildRankingData(input: RebuildInput) {
  const { players, sessions, matches } = input;

  const playerMap = buildPlayerMap(players);
  const sessionMap = buildSessionMap(sessions);

  const normalAgg: InternalModeAgg = {};
  const teamAgg: InternalModeAgg = {};

  // tạo sẵn agg rỗng cho toàn bộ player để BXH luôn hiện đủ người
  for (const player of players) {
    normalAgg[player.id] = buildEmptyAgg(player, "normal");
    teamAgg[player.id] = buildEmptyAgg(player, "team");
  }

  const sortedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap.get(a.sessionId);
    const sb = sessionMap.get(b.sessionId);

    const da = sa?.date ?? "";
    const db = sb?.date ?? "";

    if (da !== db) return da.localeCompare(db);
    if (a.round !== b.round) return a.round - b.round;
    return (a.court ?? 1) - (b.court ?? 1);
  });

  for (const match of sortedMatches) {
    const session = sessionMap.get(match.sessionId);
    if (!session) continue;

    applyMatchToAgg(match, session, playerMap, normalAgg, teamAgg);
  }

  const normalRows = toRankingRows(normalAgg);
  const teamRows = toRankingRows(teamAgg);
  const playersUpdated = buildUpdatedPlayers(players, normalRows, teamRows);

  return {
    players: playersUpdated,
    normalRows,
    teamRows,
  };
}

export function getRanking(mode: RankingMode = "normal"): RankingRow[] {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const result = rebuildRankingData({
    players,
    sessions,
    matches,
  });

  return mode === "normal" ? result.normalRows : result.teamRows;
}

function emptySummary(): PlayerSummary {
  return {
    rating: BASE_RATING,
    rankScore: BASE_RATING,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointDiff: 0,
    winRate: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    streakType: "none",
    streakCount: 0,
  };
}

function rowToSummary(row: RankingRow | null | undefined): PlayerSummary {
  if (!row) return emptySummary();

  let streakType: "win" | "loss" | "draw" | "none" = "none";
  let streakCount = 0;

  if (row.last5.length > 0) {
    const reversed = [...row.last5].reverse();
    const first = reversed[0];

    if (first === "W") streakType = "win";
    else if (first === "L") streakType = "loss";

    for (const item of reversed) {
      if (item === first) streakCount += 1;
      else break;
    }
  }

  return {
    rating: row.rating,
    rankScore: row.rankScore,
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    pointDiff: row.pointDiff,
    winRate: row.matches > 0 ? row.wins / row.matches : 0,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    streakType,
    streakCount,
  };
}

function buildOverallSummary(
  normalRow: RankingRow | null | undefined,
  teamRow: RankingRow | null | undefined
): PlayerSummary {
  const n = rowToSummary(normalRow);
  const t = rowToSummary(teamRow);

  const matches = n.matches + t.matches;
  const wins = n.wins + t.wins;
  const losses = n.losses + t.losses;
  const draws = n.draws + t.draws;
  const pointsFor = n.pointsFor + t.pointsFor;
  const pointsAgainst = n.pointsAgainst + t.pointsAgainst;
  const pointDiff = pointsFor - pointsAgainst;

  return {
    rating: round2((n.rating + t.rating) / 2),
    rankScore: round2((n.rankScore + t.rankScore) / 2),
    matches,
    wins,
    losses,
    draws,
    pointDiff,
    winRate: matches > 0 ? wins / matches : 0,
    pointsFor,
    pointsAgainst,
    streakType: "none",
    streakCount: 0,
  };
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const sessionMap = buildSessionMap(sessions);
  const playerMap = buildPlayerMap(players);

  const rebuilt = rebuildRankingData({ players, sessions, matches });
  const normalRow =
    rebuilt.normalRows.find((r) => r.playerId === playerId) ?? null;
  const teamRow =
    rebuilt.teamRows.find((r) => r.playerId === playerId) ?? null;

  const summaryNormal = rowToSummary(normalRow);
  const summaryTeam = rowToSummary(teamRow);
  const summary = buildOverallSummary(normalRow, teamRow);

  const recentMatches: PlayerRecentMatch[] = [];
  const partnerMap = new Map<
    string,
    { name: string; count: number; winsTogether: number; lossesTogether: number }
  >();
  const opponentMap = new Map<
    string,
    { name: string; count: number; winsAgainst: number; lossesAgainst: number }
  >();

  const sortedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap.get(a.sessionId);
    const sb = sessionMap.get(b.sessionId);

    const da = sa?.date ?? "";
    const db = sb?.date ?? "";

    if (da !== db) return db.localeCompare(da);
    if (a.round !== b.round) return b.round - a.round;
    return (b.court ?? 1) - (a.court ?? 1);
  });

  for (const match of sortedMatches) {
    const inTeamA = match.teamA.playerIds.includes(playerId);
    const inTeamB = match.teamB.playerIds.includes(playerId);
    if (!inTeamA && !inTeamB) continue;

    const session = sessionMap.get(match.sessionId);
    const mode: RankingMode = session?.mode === "team" ? "team" : "normal";

    const myTeamIds = inTeamA ? match.teamA.playerIds : match.teamB.playerIds;
    const oppIds = inTeamA ? match.teamB.playerIds : match.teamA.playerIds;

    const partnerIds = myTeamIds.filter((id) => id !== playerId);
    const scoreFor = inTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = inTeamA ? match.scoreB : match.scoreA;

    let result: "W" | "L" | "D" = "D";
    if (scoreFor > scoreAgainst) result = "W";
    else if (scoreFor < scoreAgainst) result = "L";

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      sessionDate: session?.date,
      round: match.round,
      mode,
      scoreFor,
      scoreAgainst,
      result,
      partnerIds: partnerIds.map((id) => playerMap.get(id)?.name ?? id),
      opponentIds: oppIds.map((id) => playerMap.get(id)?.name ?? id),
    });

    for (const pid of partnerIds) {
      const partner = playerMap.get(pid);
      const key = pid;
      const item = partnerMap.get(key) ?? {
        name: partner?.name ?? pid,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      item.count += 1;
      if (result === "W") item.winsTogether += 1;
      if (result === "L") item.lossesTogether += 1;

      partnerMap.set(key, item);
    }

    for (const oid of oppIds) {
      const opp = playerMap.get(oid);
      const key = oid;
      const item = opponentMap.get(key) ?? {
        name: opp?.name ?? oid,
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      item.count += 1;
      if (result === "W") item.winsAgainst += 1;
      if (result === "L") item.lossesAgainst += 1;

      opponentMap.set(key, item);
    }
  }

  const topPartners: PlayerPartnerStat[] = Array.from(partnerMap.entries())
    .map(([playerIdKey, item]) => ({
      playerId: playerIdKey,
      name: item.name,
      count: item.count,
      winsTogether: item.winsTogether,
      lossesTogether: item.lossesTogether,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 10);

  const topOpponents: PlayerOpponentStat[] = Array.from(opponentMap.entries())
    .map(([playerIdKey, item]) => ({
      playerId: playerIdKey,
      name: item.name,
      count: item.count,
      winsAgainst: item.winsAgainst,
      lossesAgainst: item.lossesAgainst,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, "vi");
    })
    .slice(0, 10);

  return {
    player,
    summary,
    summaryNormal,
    summaryTeam,
    recentMatches: recentMatches.slice(0, 20),
    topPartners,
    topOpponents,
  };
}