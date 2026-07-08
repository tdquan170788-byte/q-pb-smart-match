import type {
  MatchRecord,
  Player,
  RankingBuildResult,
  RankingLastResult,
  RankingMode,
  RankingRow,
  SessionRecord,
} from "@/types";

const DEFAULT_RATING = 1000;
const K_NORMAL = 24;
const K_TEAM = 20;

type RowAccumulator = {
  playerId: string;
  playerName: string;
  nickname?: string;
  rating: number;
  matches: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  last5: RankingLastResult[];
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function expectedScore(ra: number, rb: number) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function getK(mode: RankingMode) {
  return mode === "team" ? K_TEAM : K_NORMAL;
}

function makeEmptyRow(player: Player, mode: RankingMode): RowAccumulator {
  return {
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname ?? "",
    rating:
      mode === "normal"
        ? player.ratingNormal ?? DEFAULT_RATING
        : player.ratingTeam ?? DEFAULT_RATING,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
  };
}

function pushLast5(row: RowAccumulator, result: RankingLastResult) {
  row.last5.push(result);
  if (row.last5.length > 5) {
    row.last5 = row.last5.slice(row.last5.length - 5);
  }
}

function sortRows(rows: RankingRow[]) {
  return [...rows].sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName, "vi");
  });
}

function buildRowsForMode(params: {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
  mode: RankingMode;
}) {
  const { players, sessions, matches, mode } = params;

  const sessionMap = new Map<string, SessionRecord>();
  for (const s of sessions) {
    sessionMap.set(s.id, s);
  }

  const rowsMap = new Map<string, RowAccumulator>();
  for (const player of players) {
    rowsMap.set(player.id, makeEmptyRow(player, mode));
  }

  const sortedMatches = [...matches].sort((a, b) => {
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    return ta - tb;
  });

  for (const match of sortedMatches) {
    const session = sessionMap.get(match.sessionId);
    const sessionMode: RankingMode = session?.mode === "team" ? "team" : "normal";
    if (sessionMode !== mode) continue;

    const teamAIds = match.teamA.playerIds ?? [];
    const teamBIds = match.teamB.playerIds ?? [];
    if (teamAIds.length === 0 || teamBIds.length === 0) continue;

    const teamARows = teamAIds
      .map((id) => rowsMap.get(id))
      .filter(Boolean) as RowAccumulator[];
    const teamBRows = teamBIds
      .map((id) => rowsMap.get(id))
      .filter(Boolean) as RowAccumulator[];

    if (teamARows.length !== teamAIds.length || teamBRows.length !== teamBIds.length) {
      continue;
    }

    const scoreA = Number(match.scoreA ?? 0);
    const scoreB = Number(match.scoreB ?? 0);

    // Stats W/L/M/PF/PA
    for (const row of teamARows) {
      row.matches += 1;
      row.pointsFor += scoreA;
      row.pointsAgainst += scoreB;
    }

    for (const row of teamBRows) {
      row.matches += 1;
      row.pointsFor += scoreB;
      row.pointsAgainst += scoreA;
    }

    const teamAWon = scoreA > scoreB;
    const teamBWon = scoreB > scoreA;

    if (teamAWon || teamBWon) {
      for (const row of teamARows) {
        if (teamAWon) {
          row.wins += 1;
          pushLast5(row, "W");
        } else {
          row.losses += 1;
          pushLast5(row, "L");
        }
      }

      for (const row of teamBRows) {
        if (teamBWon) {
          row.wins += 1;
          pushLast5(row, "W");
        } else {
          row.losses += 1;
          pushLast5(row, "L");
        }
      }
    }

    // Elo
    // team rating = average rating of members in that mode
    const avgA =
      teamARows.reduce((sum, row) => sum + row.rating, 0) / teamARows.length;
    const avgB =
      teamBRows.reduce((sum, row) => sum + row.rating, 0) / teamBRows.length;

    const ea = expectedScore(avgA, avgB);
    const eb = expectedScore(avgB, avgA);

    const actualA = scoreA > scoreB ? 1 : scoreA < scoreB ? 0 : 0.5;
    const actualB = scoreB > scoreA ? 1 : scoreB < scoreA ? 0 : 0.5;

    const k = getK(mode);
    const deltaA = k * (actualA - ea);
    const deltaB = k * (actualB - eb);

    for (const row of teamARows) {
      row.rating = round2(row.rating + deltaA);
    }

    for (const row of teamBRows) {
      row.rating = round2(row.rating + deltaB);
    }
  }

  const rows: RankingRow[] = Array.from(rowsMap.values()).map((row) => {
    const pointDiff = row.pointsFor - row.pointsAgainst;
    const winRate = row.matches > 0 ? round2((row.wins / row.matches) * 100) : 0;

    return {
      playerId: row.playerId,
      playerName: row.playerName,
      nickname: row.nickname,
      rating: round2(row.rating),
      matches: row.matches,
      wins: row.wins,
      losses: row.losses,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      pointDiff,
      winRate,
      last5: row.last5,
    };
  });

  return sortRows(rows);
}

export function rebuildRankingData(params: {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
}): RankingBuildResult {
  const { players, sessions, matches } = params;

  const normalRows = buildRowsForMode({
    players,
    sessions,
    matches,
    mode: "normal",
  });

  const teamRows = buildRowsForMode({
    players,
    sessions,
    matches,
    mode: "team",
  });

  const normalMap = new Map(normalRows.map((r) => [r.playerId, r]));
  const teamMap = new Map(teamRows.map((r) => [r.playerId, r]));

  const nextPlayers: Player[] = players.map((player) => {
    const normal = normalMap.get(player.id);
    const team = teamMap.get(player.id);

    return {
      ...player,

      // legacy mirror: map từ normal để trang cũ không vỡ
      rating: normal?.rating ?? player.rating ?? DEFAULT_RATING,
      wins: normal?.wins ?? 0,
      losses: normal?.losses ?? 0,
      matches: normal?.matches ?? 0,

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
    players: nextPlayers,
    normalRows,
    teamRows,
  };
}