import type {
  MatchResult,
  OpponentStatItem,
  PartnerStatItem,
  Player,
  PlayerDetailStats,
  RecentMatchItem,
  SessionMode,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";
import { buildRanking } from "./ranking.engine";

function getPlayerMap(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function sortRecentMatches(a: RecentMatchItem, b: RecentMatchItem) {
  const da = a.playedAt ? new Date(a.playedAt).getTime() : 0;
  const db = b.playedAt ? new Date(b.playedAt).getTime() : 0;

  if (db !== da) return db - da;
  if (a.round !== b.round) return b.round - a.round;

  return (b.court ?? 1) - (a.court ?? 1);
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

  const recentMatches: RecentMatchItem[] = [];
  const partnerCounter = new Map<string, PartnerStatItem>();
  const opponentCounter = new Map<string, OpponentStatItem>();

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
    const partnerNames = partnerIds.map((id) => playerMap.get(id)?.name ?? id);
    const opponentNames = opponentIds.map((id) => playerMap.get(id)?.name ?? id);

    let result: MatchResult = "draw";
    if (scoreFor > scoreAgainst) result = "win";
    else if (scoreFor < scoreAgainst) result = "loss";

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      mode: (session.mode ?? "normal") as SessionMode,
      round: match.round,
      court: match.court,
      scoreFor,
      scoreAgainst,
      result,
      partnerIds,
      partnerNames,
      opponentIds,
      opponentNames,
      playedAt: session.date ?? match.createdAt,
    });

    for (const partnerId of partnerIds) {
      const partner = playerMap.get(partnerId);
      if (!partner) continue;

      const item: PartnerStatItem = partnerCounter.get(partnerId) ?? {
        playerId: partnerId,
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

      const item: OpponentStatItem = opponentCounter.get(opponentId) ?? {
        playerId: opponentId,
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
