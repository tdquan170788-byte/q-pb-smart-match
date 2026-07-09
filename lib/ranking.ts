import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import type {
  MatchRecord,
  ModeSummary,
  OpponentStat,
  PartnerStat,
  Player,
  PlayerDetailStats,
  PlayerRecentMatch,
  RankingMode,
  RankingRow,
  SessionRecord,
} from "@/types";

type RankingAccumulator = {
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

type RebuildInput = {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
};

type RebuildResult = {
  players: Player[];
  normalRows: RankingRow[];
  teamRows: RankingRow[];
};

const BASE_RATING = 1000;
const K_FACTOR = 24;

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function average(values: number[]) {
  if (values.length === 0) return BASE_RATING;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function toModeSummary(row: RankingRow | null): ModeSummary {
  if (!row) {
    return {
      rating: BASE_RATING,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      winRate: 0,
    };
  }

  return {
    rating: row.rating,
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    pointDiff: row.pointDiff,
    winRate: row.matches > 0 ? row.wins / row.matches : 0,
  };
}

function createEmptyAccumulator(player: Player): RankingAccumulator {
  return {
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname ?? "",
    rating: BASE_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
  };
}

function createAccumulatorMap(players: Player[]) {
  const map = new Map<string, RankingAccumulator>();
  for (const player of players) {
    map.set(player.id, createEmptyAccumulator(player));
  }
  return map;
}

function buildRowsFromAccumulator(map: Map<string, RankingAccumulator>): RankingRow[] {
  const rows: RankingRow[] = Array.from(map.values()).map((item) => {
    const pointDiff = item.pointsFor - item.pointsAgainst;
    const winRate =
      item.matches > 0 ? Math.round((item.wins / item.matches) * 100) : 0;

    return {
      playerId: item.playerId,
      playerName: item.playerName,
      nickname: item.nickname,
      rating: Number(item.rating.toFixed(2)),
      wins: item.wins,
      losses: item.losses,
      draws: item.draws,
      matches: item.matches,
      winRate,
      pointsFor: item.pointsFor,
      pointsAgainst: item.pointsAgainst,
      pointDiff,
      rankScore:
        item.rating +
        item.wins * 3 -
        item.losses * 1 +
        pointDiff * 0.01 +
        winRate * 0.1,
      last5: item.last5.slice(-5).reverse(),
    };
  });

  rows.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName, "vi");
  });

  return rows;
}

function getSessionMode(session: SessionRecord | undefined): RankingMode {
  return session?.mode === "team" ? "team" : "normal";
}

function updateAccumulatorForPlayer(
  acc: RankingAccumulator,
  scoreFor: number,
  scoreAgainst: number,
  actualScore: 0 | 0.5 | 1,
  newRating: number
) {
  acc.matches += 1;
  acc.pointsFor += scoreFor;
  acc.pointsAgainst += scoreAgainst;
  acc.rating = newRating;

  if (actualScore === 1) {
    acc.wins += 1;
    acc.last5.push("W");
  } else if (actualScore === 0) {
    acc.losses += 1;
    acc.last5.push("L");
  } else {
    acc.draws += 1;
  }
}

export function rebuildRankingData(input: RebuildInput): RebuildResult {
  const { players, sessions, matches } = input;

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const normalAcc = createAccumulatorMap(players);
  const teamAcc = createAccumulatorMap(players);

  const orderedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap.get(a.sessionId)?.date ?? "";
    const sb = sessionMap.get(b.sessionId)?.date ?? "";
    if (sa !== sb) return sa.localeCompare(sb);
    return a.createdAt.localeCompare(b.createdAt);
  });

  for (const match of orderedMatches) {
    const session = sessionMap.get(match.sessionId);
    const mode = getSessionMode(session);
    const accMap = mode === "team" ? teamAcc : normalAcc;

    const teamAIds = match.teamA.playerIds;
    const teamBIds = match.teamB.playerIds;

    const teamARating = average(
      teamAIds.map((id) => accMap.get(id)?.rating ?? BASE_RATING)
    );
    const teamBRating = average(
      teamBIds.map((id) => accMap.get(id)?.rating ?? BASE_RATING)
    );

    let scoreAActual: 0 | 0.5 | 1 = 0;
    let scoreBActual: 0 | 0.5 | 1 = 0;

    if (match.scoreA > match.scoreB) {
      scoreAActual = 1;
      scoreBActual = 0;
    } else if (match.scoreA < match.scoreB) {
      scoreAActual = 0;
      scoreBActual = 1;
    } else {
      scoreAActual = 0.5;
      scoreBActual = 0.5;
    }

    const expectedA = expectedScore(teamARating, teamBRating);
    const expectedB = expectedScore(teamBRating, teamARating);

    for (const playerId of teamAIds) {
      const acc = accMap.get(playerId);
      if (!acc) continue;

      const newRating = acc.rating + K_FACTOR * (scoreAActual - expectedA);
      updateAccumulatorForPlayer(
        acc,
        match.scoreA,
        match.scoreB,
        scoreAActual,
        Number(newRating.toFixed(2))
      );
    }

    for (const playerId of teamBIds) {
      const acc = accMap.get(playerId);
      if (!acc) continue;

      const newRating = acc.rating + K_FACTOR * (scoreBActual - expectedB);
      updateAccumulatorForPlayer(
        acc,
        match.scoreB,
        match.scoreA,
        scoreBActual,
        Number(newRating.toFixed(2))
      );
    }
  }

  const normalRows = buildRowsFromAccumulator(normalAcc);
  const teamRows = buildRowsFromAccumulator(teamAcc);

  const normalRowMap = new Map(normalRows.map((r) => [r.playerId, r]));
  const teamRowMap = new Map(teamRows.map((r) => [r.playerId, r]));

  const updatedPlayers = players.map((player) => {
    const normal = normalRowMap.get(player.id);
    const team = teamRowMap.get(player.id);

    const wins = (normal?.wins ?? 0) + (team?.wins ?? 0);
    const losses = (normal?.losses ?? 0) + (team?.losses ?? 0);
    const matchesCount = (normal?.matches ?? 0) + (team?.matches ?? 0);

    return {
      ...player,

      // legacy tổng
      rating: Number(
        (((normal?.rating ?? BASE_RATING) + (team?.rating ?? BASE_RATING)) / 2).toFixed(2)
      ),
      wins,
      losses,
      matches: matchesCount,

      // normal
      ratingNormal: normal?.rating ?? BASE_RATING,
      winsNormal: normal?.wins ?? 0,
      lossesNormal: normal?.losses ?? 0,
      matchesNormal: normal?.matches ?? 0,
      pointsForNormal: normal?.pointsFor ?? 0,
      pointsAgainstNormal: normal?.pointsAgainst ?? 0,

      // team
      ratingTeam: team?.rating ?? BASE_RATING,
      winsTeam: team?.wins ?? 0,
      lossesTeam: team?.losses ?? 0,
      matchesTeam: team?.matches ?? 0,
      pointsForTeam: team?.pointsFor ?? 0,
      pointsAgainstTeam: team?.pointsAgainst ?? 0,
    };
  });

  return {
    players: updatedPlayers,
    normalRows,
    teamRows,
  };
}

export function getRanking(mode: RankingMode = "normal"): RankingRow[] {
  const result = rebuildRankingData({
    players: getPlayers(),
    sessions: getSessions(),
    matches: getMatches(),
  });

  return mode === "team" ? result.teamRows : result.normalRows;
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const rebuilt = rebuildRankingData({ players, sessions, matches });
  const normalRow = rebuilt.normalRows.find((r) => r.playerId === playerId) ?? null;
  const teamRow = rebuilt.teamRows.find((r) => r.playerId === playerId) ?? null;

  const summaryNormal = toModeSummary(normalRow);
  const summaryTeam = toModeSummary(teamRow);

  const summary: ModeSummary = {
    rating: Number(((summaryNormal.rating + summaryTeam.rating) / 2).toFixed(2)),
    matches: summaryNormal.matches + summaryTeam.matches,
    wins: summaryNormal.wins + summaryTeam.wins,
    losses: summaryNormal.losses + summaryTeam.losses,
    draws: summaryNormal.draws + summaryTeam.draws,
    pointsFor: summaryNormal.pointsFor + summaryTeam.pointsFor,
    pointsAgainst: summaryNormal.pointsAgainst + summaryTeam.pointsAgainst,
    pointDiff:
      summaryNormal.pointDiff + summaryTeam.pointDiff,
    winRate: (() => {
      const totalMatches = summaryNormal.matches + summaryTeam.matches;
      const totalWins = summaryNormal.wins + summaryTeam.wins;
      return totalMatches > 0 ? totalWins / totalMatches : 0;
    })(),
  };

  const recentMatches: PlayerRecentMatch[] = [];
  const partnerMap = new Map<string, PartnerStat>();
  const opponentMap = new Map<string, OpponentStat>();

  const orderedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap.get(a.sessionId)?.date ?? "";
    const sb = sessionMap.get(b.sessionId)?.date ?? "";
    if (sa !== sb) return sb.localeCompare(sa);
    return b.createdAt.localeCompare(a.createdAt);
  });

  for (const match of orderedMatches) {
    const inTeamA = match.teamA.playerIds.includes(playerId);
    const inTeamB = match.teamB.playerIds.includes(playerId);
    if (!inTeamA && !inTeamB) continue;

    const mode = getSessionMode(sessionMap.get(match.sessionId));

    const myTeam = inTeamA ? match.teamA.playerIds : match.teamB.playerIds;
    const oppTeam = inTeamA ? match.teamB.playerIds : match.teamA.playerIds;

    const scoreFor = inTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = inTeamA ? match.scoreB : match.scoreA;

    const result: "W" | "L" | "D" =
      scoreFor > scoreAgainst ? "W" : scoreFor < scoreAgainst ? "L" : "D";

    const partnerIds = myTeam.filter((id) => id !== playerId);
    const opponentIds = [...oppTeam];

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      mode,
      round: match.round,
      scoreFor,
      scoreAgainst,
      result,
      partnerIds: partnerIds.map((id) => playerMap.get(id)?.name ?? id),
      opponentIds: opponentIds.map((id) => playerMap.get(id)?.name ?? id),
    });

    for (const partnerId of partnerIds) {
      const name = playerMap.get(partnerId)?.name ?? partnerId;
      const current = partnerMap.get(partnerId) ?? {
        playerId: partnerId,
        name,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      current.count += 1;
      if (result === "W") current.winsTogether += 1;
      if (result === "L") current.lossesTogether += 1;

      partnerMap.set(partnerId, current);
    }

    for (const opponentId of opponentIds) {
      const name = playerMap.get(opponentId)?.name ?? opponentId;
      const current = opponentMap.get(opponentId) ?? {
        playerId: opponentId,
        name,
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      current.count += 1;
      if (result === "W") current.winsAgainst += 1;
      if (result === "L") current.lossesAgainst += 1;

      opponentMap.set(opponentId, current);
    }
  }

  const topPartners = Array.from(partnerMap.values())
    .sort((a, b) => b.count - a.count || b.winsTogether - a.winsTogether)
    .slice(0, 10);

  const topOpponents = Array.from(opponentMap.values())
    .sort((a, b) => b.count - a.count || b.winsAgainst - a.winsAgainst)
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