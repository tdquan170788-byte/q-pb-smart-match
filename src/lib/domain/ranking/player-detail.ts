import type {
  MatchRecord,
  Player,
  PlayerDetailStats,
  PlayerSummary,
  SessionRecord,
  PartnerStatItem,
  OpponentStatItem,
  RecentMatchItem,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

function getDefaultSummary(player: Player): PlayerSummary {
  return {
    rating: player.rating ?? 1000,
    rankScore: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointDiff: 0,
    winRate: 0,
    streakType: "none",
    streakCount: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

function buildSummaryFromMatches(
  playerId: string,
  matches: MatchRecord[],
  sessionsMap: Map<string, SessionRecord>,
  modeFilter?: "normal" | "team"
): PlayerSummary {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  const results: Array<"W" | "L" | "D"> = [];

  for (const match of matches) {
    const session = sessionsMap.get(match.sessionId);
    if (!session) continue;

    const mode = session.mode ?? "normal";
    if (modeFilter && mode !== modeFilter) continue;

    const inTeamA = match.teamA.memberIds.includes(playerId);
    const inTeamB = match.teamB.memberIds.includes(playerId);

    if (!inTeamA && !inTeamB) continue;

    const scoreFor = inTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = inTeamA ? match.scoreB : match.scoreA;

    pointsFor += scoreFor;
    pointsAgainst += scoreAgainst;

    if (scoreFor > scoreAgainst) {
      wins += 1;
      results.push("W");
    } else if (scoreFor < scoreAgainst) {
      losses += 1;
      results.push("L");
    } else {
      draws += 1;
      results.push("D");
    }
  }

  const total = wins + losses + draws;
  const pointDiff = pointsFor - pointsAgainst;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  let streakType: PlayerSummary["streakType"] = "none";
  let streakCount = 0;

  if (results.length > 0) {
    const reversed = [...results].reverse();
    const first = reversed[0];

    if (first === "W") streakType = "win";
    else if (first === "L") streakType = "loss";
    else streakType = "draw";

    for (const r of reversed) {
      if (r === first) streakCount++;
      else break;
    }
  }

  return {
    rating: 0,
    rankScore: wins * 3 + draws,
    matches: total,
    wins,
    losses,
    draws,
    pointDiff,
    winRate,
    streakType,
    streakCount,
    pointsFor,
    pointsAgainst,
  };
}

function sortRecentMatches(a: RecentMatchItem, b: RecentMatchItem) {
  if ((a.round ?? 0) !== (b.round ?? 0)) return b.round - a.round;
  return 0;
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const summary = buildSummaryFromMatches(playerId, matches, sessionMap);
  const summaryNormal = buildSummaryFromMatches(playerId, matches, sessionMap, "normal");
  const summaryTeam = buildSummaryFromMatches(playerId, matches, sessionMap, "team");

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

    recentMatches.push({
      matchId: match.id,
      round: match.round,
      scoreFor,
      scoreAgainst,
      result: scoreFor > scoreAgainst ? "W" : scoreFor < scoreAgainst ? "L" : "D",
      partnerIds,
      opponentIds,
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
    summary: {
      ...summary,
      rating: player.rating ?? 1000,
    },
    summaryNormal: {
      ...summaryNormal,
      rating: player.ratingNormal ?? 1000,
    },
    summaryTeam: {
      ...summaryTeam,
      rating: player.ratingTeam ?? 1000,
    },
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