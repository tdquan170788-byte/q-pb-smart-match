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

export function buildRanking(players: Player[], matches: MatchRecord[]): RankingRow[] {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const rankingMap = new Map<string, RankingMapItem>();

  // tạo sẵn hàng cho toàn bộ thành viên để người chưa đánh trận vẫn hiện BXH
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

    const teamAScore = match.scoreA;
    const teamBScore = match.scoreB;

    const teamAWin = teamAScore > teamBScore;
    const teamBWin = teamBScore > teamAScore;

    for (const player of teamAPlayers) {
      const row = ensureRow(rankingMap, player);
      row.matches += 1;
      row.pointsFor += teamAScore;
      row.pointsAgainst += teamBScore;
      if (teamAWin) row.wins += 1;
      else if (teamBWin) row.losses += 1;
    }

    for (const player of teamBPlayers) {
      const row = ensureRow(rankingMap, player);
      row.matches += 1;
      row.pointsFor += teamBScore;
      row.pointsAgainst += teamAScore;
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