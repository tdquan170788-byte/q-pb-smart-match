import type { Player } from "@/types";
import type {
  OpponentStat,
  PartnerStat,
  PlayerDetailStats,
  RecentMatchRow,
} from "@/types/ranking";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import { buildRanking } from "./ranking.engine";

function getPlayerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function sortRecentMatches(a: RecentMatchRow, b: RecentMatchRow) {
  if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
  if (a.round !== b.round) return b.round - a.round;
  return b.court - a.court;
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const playerMap = getPlayerMap(players);

  const ranking = buildRanking({ players, sessions, matches });
  const { summary, summaryNormal, summaryTeam } =
    ranking.getSummaryForPlayer(playerId);

  const recentMatches: RecentMatchRow[] = [];
  const partnerCounter = new Map<string, PartnerStat>();
  const opponentCounter = new Map<string, OpponentStat>();

  for (const match of matches) {
    const session = sessionMap.get(match.sessionId);
    if (!session) continue;

    const inTeamA = match.teamA.memberIds.includes(playerId);
    const inTeamB = match.teamB.memberIds.includes(playerId);

    if (!inTeamA && !inTeamB) continue;

    const myTeamIds = inTeamA ? match.teamA.memberIds : match.teamB.memberIds;
    const opponentIds = inTeamA ? match.teamB.memberIds : match.teamA.memberIds;
    const scoreFor = inTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = inTeamA ? match.scoreB : match.scoreA;

    const partnerIds = myTeamIds.filter((id) => id !== playerId);

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      mode: session.mode ?? "normal",
      round: match.round,
      court: match.court ?? 1,
      scoreFor,
      scoreAgainst,
      result: scoreFor > scoreAgainst ? "W" : scoreFor < scoreAgainst ? "L" : "D",
      partnerIds,
      opponentIds,
      createdAt: match.createdAt ?? "",
    });

    for (const partnerId of partnerIds) {
      const partner = playerMap.get(partnerId);
      if (!partner) continue;

      const item = partnerCounter.get(partnerId) ?? {
        playerId: partnerId,
        memberId: partnerId,
        name: partner.name,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      item.count += 1;
      if (scoreFor > scoreAgainst) item.winsTogether += 1;
      if (scoreFor < scoreAgainst) item.lossesTogether += 1;

      partnerCounter.set(partnerId, item);
    }

    for (const opponentId of opponentIds) {
      const opponent = playerMap.get(opponentId);
      if (!opponent) continue;

      const item = opponentCounter.get(opponentId) ?? {
        playerId: opponentId,
        memberId: opponentId,
        name: opponent.name,
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      item.count += 1;
      if (scoreFor > scoreAgainst) item.winsAgainst += 1;
      if (scoreFor < scoreAgainst) item.lossesAgainst += 1;

      opponentCounter.set(opponentId, item);
    }
  }

  return {
    player,
    summary,
    summaryNormal,
    summaryTeam,
    recentMatches: recentMatches.sort(sortRecentMatches).slice(0, 20),
    topPartners: [...partnerCounter.values()]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.winsTogether - a.winsTogether;
      })
      .slice(0, 10),
    topOpponents: [...opponentCounter.values()]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.winsAgainst - a.winsAgainst;
      })
      .slice(0, 10),
  };
}