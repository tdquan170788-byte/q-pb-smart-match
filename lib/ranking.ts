import type { MatchRecord, Player, RankingRow } from "@/types";

type RankingMapItem = {
  playerId: string;
  name: string;
  nickname?: string;
  matches: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type PlayerStats = {
  playerId: string;
  name: string;
  nickname?: string;
  matches: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  winRate: number;
};

export type PlayerHistoryItem = {
  matchId: string;
  sessionId: string;
  round: number;
  date?: string;
  teamLabel: string;
  opponentLabel: string;
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
};

export type PartnerCount = {
  playerId: string;
  name: string;
  count: number;
};

export type OpponentCount = {
  playerId: string;
  name: string;
  count: number;
};

export type PlayerDetailStats = {
  summary: PlayerStats;
  favoritePartners: PartnerCount[];
  commonOpponents: OpponentCount[];
  history: PlayerHistoryItem[];
};

function createEmptyRow(player: Player): RankingMapItem {
  return {
    playerId: player.id,
    name: player.name,
    nickname: player.nickname,
    matches: 0,
    wins: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

function ensureRow(map: Map<string, RankingMapItem>, player: Player) {
  if (!map.has(player.id)) {
    map.set(player.id, createEmptyRow(player));
  }
  return map.get(player.id)!;
}

/**
 * Tạo bảng xếp hạng từ players + matches
 * Thứ tự ưu tiên:
 * 1) Wins giảm dần
 * 2) Point diff giảm dần
 * 3) Points for giảm dần
 * 4) Tên A-Z
 */
export function buildRanking(
  players: Player[],
  matches: MatchRecord[]
): RankingRow[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const rankingMap = new Map<string, RankingMapItem>();

  // tạo row rỗng cho toàn bộ thành viên
  players.forEach((player) => {
    rankingMap.set(player.id, createEmptyRow(player));
  });

  for (const match of matches) {
    const teamAPlayers = match.teamA.playerIds
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];

    const teamBPlayers = match.teamB.playerIds
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];

    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) continue;

    const scoreA = match.scoreA;
    const scoreB = match.scoreB;

    const teamAWin = scoreA > scoreB;
    const teamBWin = scoreB > scoreA;

    // cộng cho team A
    for (const player of teamAPlayers) {
      const row = ensureRow(rankingMap, player);
      row.matches += 1;
      row.pointsFor += scoreA;
      row.pointsAgainst += scoreB;

      if (teamAWin) row.wins += 1;
      else if (teamBWin) row.losses += 1;
    }

    // cộng cho team B
    for (const player of teamBPlayers) {
      const row = ensureRow(rankingMap, player);
      row.matches += 1;
      row.pointsFor += scoreB;
      row.pointsAgainst += scoreA;

      if (teamBWin) row.wins += 1;
      else if (teamAWin) row.losses += 1;
    }
  }

  const rows: RankingRow[] = Array.from(rankingMap.values()).map((row) => {
    const pointDiff = row.pointsFor - row.pointsAgainst;
    const winRate =
      row.matches > 0 ? Math.round((row.wins / row.matches) * 1000) / 10 : 0;

    return {
      playerId: row.playerId,
      name: row.name,
      nickname: row.nickname,
      matches: row.matches,
      wins: row.wins,
      losses: row.losses,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      pointDiff,
      winRate,
    };
  });

  rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.name.localeCompare(b.name, "vi");
  });

  return rows;
}

/**
 * Lấy thống kê cơ bản của 1 thành viên
 */
export function getPlayerStats(
  playerId: string,
  players: Player[],
  matches: MatchRecord[]
): PlayerStats {
  const ranking = buildRanking(players, matches);
  const row = ranking.find((r) => r.playerId === playerId);
  const player = players.find((p) => p.id === playerId);

  if (!row) {
    return {
      playerId,
      name: player?.name ?? "Unknown",
      nickname: player?.nickname,
      matches: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      winRate: 0,
    };
  }

  return {
    playerId: row.playerId,
    name: row.name,
    nickname: row.nickname,
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    pointDiff: row.pointDiff,
    winRate: row.winRate,
  };
}

/**
 * Lấy thống kê chi tiết của 1 thành viên:
 * - summary
 * - đồng đội đánh cùng nhiều nhất
 * - đối thủ gặp nhiều nhất
 * - lịch sử trận đấu
 */
export function getPlayerDetailStats(
  playerId: string,
  players: Player[],
  matches: MatchRecord[],
  sessionDateMap?: Record<string, string>
): PlayerDetailStats {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const summary = getPlayerStats(playerId, players, matches);

  const partnerMap = new Map<string, number>();
  const opponentMap = new Map<string, number>();
  const history: PlayerHistoryItem[] = [];

  for (const match of matches) {
    const teamA = match.teamA.playerIds;
    const teamB = match.teamB.playerIds;

    const inTeamA = teamA.includes(playerId);
    const inTeamB = teamB.includes(playerId);

    if (!inTeamA && !inTeamB) continue;

    const myTeam = inTeamA ? teamA : teamB;
    const opponentTeam = inTeamA ? teamB : teamA;

    const scoreFor = inTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = inTeamA ? match.scoreB : match.scoreA;

    let result: "W" | "L" | "D" = "D";
    if (scoreFor > scoreAgainst) result = "W";
    else if (scoreFor < scoreAgainst) result = "L";

    // Thống kê đồng đội
    for (const teammateId of myTeam) {
      if (teammateId === playerId) continue;
      partnerMap.set(teammateId, (partnerMap.get(teammateId) ?? 0) + 1);
    }

    // Thống kê đối thủ
    for (const opponentId of opponentTeam) {
      opponentMap.set(opponentId, (opponentMap.get(opponentId) ?? 0) + 1);
    }

    const myTeamNames = myTeam
      .map((id) => playerMap.get(id)?.name ?? "Unknown")
      .join(" / ");

    const opponentNames = opponentTeam
      .map((id) => playerMap.get(id)?.name ?? "Unknown")
      .join(" / ");

    history.push({
      matchId: match.id,
      sessionId: match.sessionId,
      round: match.round,
      date: sessionDateMap?.[match.sessionId],
      teamLabel: myTeamNames,
      opponentLabel: opponentNames,
      scoreFor,
      scoreAgainst,
      result,
    });
  }

  const favoritePartners: PartnerCount[] = Array.from(partnerMap.entries())
    .map(([id, count]) => ({
      playerId: id,
      name: playerMap.get(id)?.name ?? "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));

  const commonOpponents: OpponentCount[] = Array.from(opponentMap.entries())
    .map(([id, count]) => ({
      playerId: id,
      name: playerMap.get(id)?.name ?? "Unknown",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));

  history.sort((a, b) => {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da !== db) return db.localeCompare(da);
    return b.round - a.round;
  });

  return {
    summary,
    favoritePartners,
    commonOpponents,
    history,
  };
}