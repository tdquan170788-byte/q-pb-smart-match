import type { MatchRecord, Player, SessionRecord } from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

/* =========================================================
   TYPES
========================================================= */

export type RankingRow = {
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
  rating: number;
};

export type PlayerMatchItem = {
  matchId: string;
  sessionId: string;
  sessionDate: string;
  round: number;
  teammateNames: string[];
  opponentNames: string[];
  scoreFor: number;
  scoreAgainst: number;
  result: "W" | "L" | "D";
};

export type PlayerDetailStats = {
  player: Player | null;
  rankingRow: RankingRow | null;
  totalSessions: number;
  recentMatches: PlayerMatchItem[];
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeDate(value?: string) {
  return value || "";
}

function getPlayerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function getSessionMap(sessions: SessionRecord[]) {
  return new Map(sessions.map((s) => [s.id, s]));
}

function getPlayerName(playerMap: Map<string, Player>, playerId: string) {
  return playerMap.get(playerId)?.name ?? "Ẩn danh";
}

function isPlayerInTeam(teamPlayerIds: string[], playerId: string) {
  return teamPlayerIds.includes(playerId);
}

function getTeamScore(match: MatchRecord, side: "A" | "B") {
  return side === "A" ? match.scoreA : match.scoreB;
}

function getOpponentScore(match: MatchRecord, side: "A" | "B") {
  return side === "A" ? match.scoreB : match.scoreA;
}

/* =========================================================
   CORE: BUILD RANKING
========================================================= */

export function buildRanking(
  playersArg?: Player[],
  matchesArg?: MatchRecord[]
): RankingRow[] {
  const players = playersArg ?? getPlayers();
  const matches = matchesArg ?? getMatches();

  const rows = new Map<string, RankingRow>();

  for (const player of players) {
    rows.set(player.id, {
      playerId: player.id,
      name: player.name,
      nickname: player.nickname,
      matches: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointDiff: 0,
      winRate: 0,
      rating: player.rating ?? 1000,
    });
  }

  for (const match of matches) {
    const teamAIds = match.teamA?.playerIds ?? [];
    const teamBIds = match.teamB?.playerIds ?? [];

    const teamAScore = match.scoreA ?? 0;
    const teamBScore = match.scoreB ?? 0;

    const teamAWin = teamAScore > teamBScore;
    const teamBWin = teamBScore > teamAScore;

    for (const playerId of teamAIds) {
      const row = rows.get(playerId);
      if (!row) continue;

      row.matches += 1;
      row.pointsFor += teamAScore;
      row.pointsAgainst += teamBScore;

      if (teamAWin) row.wins += 1;
      else if (teamBWin) row.losses += 1;
    }

    for (const playerId of teamBIds) {
      const row = rows.get(playerId);
      if (!row) continue;

      row.matches += 1;
      row.pointsFor += teamBScore;
      row.pointsAgainst += teamAScore;

      if (teamBWin) row.wins += 1;
      else if (teamAWin) row.losses += 1;
    }
  }

  const result = Array.from(rows.values()).map((row) => {
    const pointDiff = row.pointsFor - row.pointsAgainst;
    const winRate = row.matches > 0 ? Math.round((row.wins / row.matches) * 100) : 0;

    return {
      ...row,
      pointDiff,
      winRate,
    };
  });

  result.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
    return a.name.localeCompare(b.name, "vi");
  });

  return result;
}

/* =========================================================
   PUBLIC: GET RANKING
========================================================= */

export function getRanking(): RankingRow[] {
  const players = getPlayers();
  const matches = getMatches();
  return buildRanking(players, matches);
}

/* =========================================================
   PLAYER DETAIL
========================================================= */

export function getPlayerDetailStats(playerId: string): PlayerDetailStats {
  const players = getPlayers();
  const matches = getMatches();
  const sessions = getSessions();

  const player = players.find((p) => p.id === playerId) ?? null;
  const ranking = buildRanking(players, matches);
  const rankingRow = ranking.find((r) => r.playerId === playerId) ?? null;

  const playerMap = getPlayerMap(players);
  const sessionMap = getSessionMap(sessions);

  const relatedMatches: PlayerMatchItem[] = [];

  for (const match of matches) {
    const teamAIds = match.teamA?.playerIds ?? [];
    const teamBIds = match.teamB?.playerIds ?? [];

    let playerSide: "A" | "B" | null = null;

    if (isPlayerInTeam(teamAIds, playerId)) {
      playerSide = "A";
    } else if (isPlayerInTeam(teamBIds, playerId)) {
      playerSide = "B";
    }

    if (!playerSide) continue;

    const myTeamIds = playerSide === "A" ? teamAIds : teamBIds;
    const opponentIds = playerSide === "A" ? teamBIds : teamAIds;

    const teammateNames = myTeamIds
      .filter((id) => id !== playerId)
      .map((id) => getPlayerName(playerMap, id));

    const opponentNames = opponentIds.map((id) => getPlayerName(playerMap, id));

    const scoreFor = getTeamScore(match, playerSide);
    const scoreAgainst = getOpponentScore(match, playerSide);

    let result: "W" | "L" | "D" = "D";
    if (scoreFor > scoreAgainst) result = "W";
    else if (scoreFor < scoreAgainst) result = "L";

    const session = sessionMap.get(match.sessionId);

    relatedMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      sessionDate: normalizeDate(session?.date),
      round: match.round,
      teammateNames,
      opponentNames,
      scoreFor,
      scoreAgainst,
      result,
    });
  }

  relatedMatches.sort((a, b) => {
    const dateCompare = normalizeDate(b.sessionDate).localeCompare(
      normalizeDate(a.sessionDate)
    );
    if (dateCompare !== 0) return dateCompare;
    return b.round - a.round;
  });

  const sessionIds = new Set(relatedMatches.map((m) => m.sessionId));

  return {
    player,
    rankingRow,
    totalSessions: sessionIds.size,
    recentMatches: relatedMatches,
  };
}