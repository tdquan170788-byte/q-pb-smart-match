import {
  MatchRecord,
  MatchResult,
  Player,
  PlayerDetailStats,
  PlayerSummary,
  RankingMode,
  RankingRebuildResult,
  RankingRow,
  RecentMatchItem,
  SessionMode,
  SessionRecord,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

type RebuildInput = {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
};

type MutableAgg = {
  memberId: string;
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

const BASE_RATING = 1000;
const K_FACTOR = 24;

function createEmptyAgg(player: Player, rating: number): MutableAgg {
  return {
    memberId: player.id,
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname ?? "",
    rating,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
  };
}

function expectedScore(ratingA: number, ratingB: number) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function clampRating(n: number) {
  return Math.round(n * 100) / 100;
}

function buildRowsForMode(
  players: Player[],
  sessions: SessionRecord[],
  matches: MatchRecord[],
  mode: RankingMode
): {
  rows: RankingRow[];
  ratingMap: Map<string, number>;
  statsMap: Map<string, MutableAgg>;
} {
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const initialRating = (player: Player) =>
    mode === "normal"
      ? player.ratingNormal ?? BASE_RATING
      : player.ratingTeam ?? BASE_RATING;

  const statsMap = new Map<string, MutableAgg>();
  for (const p of players) {
    statsMap.set(p.id, createEmptyAgg(p, initialRating(p)));
  }

  const modeMatches = matches
    .filter((m) => {
      const session = sessionMap.get(m.sessionId);
      const sessionMode = session?.mode ?? "normal";
      return sessionMode === mode;
    })
    .slice()
    .sort((a, b) => {
      const sa = sessionMap.get(a.sessionId)?.createdAt ?? "";
      const sb = sessionMap.get(b.sessionId)?.createdAt ?? "";
      if (sa !== sb) return sa.localeCompare(sb);
      if (a.round !== b.round) return a.round - b.round;
      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    });

  for (const match of modeMatches) {
    const teamAPlayers = match.teamA.memberIds
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];

    const teamBPlayers = match.teamB.memberIds
      .map((id) => playerMap.get(id))
      .filter(Boolean) as Player[];

    if (teamAPlayers.length === 0 || teamBPlayers.length === 0) continue;

    const aggA = teamAPlayers
      .map((p) => statsMap.get(p.id))
      .filter(Boolean) as MutableAgg[];

    const aggB = teamBPlayers
      .map((p) => statsMap.get(p.id))
      .filter(Boolean) as MutableAgg[];

    if (aggA.length === 0 || aggB.length === 0) continue;

    const teamARating =
      aggA.reduce((sum, item) => sum + item.rating, 0) / aggA.length;
    const teamBRating =
      aggB.reduce((sum, item) => sum + item.rating, 0) / aggB.length;

    let scoreResultA = 0.5;
    let scoreResultB = 0.5;

    if (match.scoreA > match.scoreB) {
      scoreResultA = 1;
      scoreResultB = 0;
    } else if (match.scoreA < match.scoreB) {
      scoreResultA = 0;
      scoreResultB = 1;
    }

    const expectedA = expectedScore(teamARating, teamBRating);
    const expectedB = expectedScore(teamBRating, teamARating);

    const deltaA = K_FACTOR * (scoreResultA - expectedA);
    const deltaB = K_FACTOR * (scoreResultB - expectedB);

    for (const item of aggA) {
      item.rating = clampRating(item.rating + deltaA);
      item.matches += 1;
      item.pointsFor += match.scoreA;
      item.pointsAgainst += match.scoreB;

      if (scoreResultA === 1) {
        item.wins += 1;
        item.last5.push("W");
      } else if (scoreResultA === 0) {
        item.losses += 1;
        item.last5.push("L");
      } else {
        item.draws += 1;
      }

      if (item.last5.length > 5) item.last5 = item.last5.slice(-5);
    }

    for (const item of aggB) {
      item.rating = clampRating(item.rating + deltaB);
      item.matches += 1;
      item.pointsFor += match.scoreB;
      item.pointsAgainst += match.scoreA;

      if (scoreResultB === 1) {
        item.wins += 1;
        item.last5.push("W");
      } else if (scoreResultB === 0) {
        item.losses += 1;
        item.last5.push("L");
      } else {
        item.draws += 1;
      }

      if (item.last5.length > 5) item.last5 = item.last5.slice(-5);
    }
  }

  const rows: RankingRow[] = players.map((player) => {
    const agg = statsMap.get(player.id)!;
    const pointDiff = agg.pointsFor - agg.pointsAgainst;
    const winRate =
      agg.matches > 0 ? Math.round((agg.wins / agg.matches) * 100) : 0;
    const rankScore =
      agg.rating + agg.wins * 3 - agg.losses * 1 + pointDiff * 0.01;

    return {
      memberId: player.id,
      playerId: player.id,
      playerName: player.name,
      nickname: player.nickname ?? "",
      rating: clampRating(agg.rating),
      wins: agg.wins,
      losses: agg.losses,
      draws: agg.draws,
      matches: agg.matches,
      winRate,
      pointsFor: agg.pointsFor,
      pointsAgainst: agg.pointsAgainst,
      pointDiff,
      rankScore: Math.round(rankScore * 100) / 100,
      last5: agg.last5,
    };
  });

  rows.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName, "vi");
  });

  const ratingMap = new Map<string, number>();
  for (const row of rows) {
    ratingMap.set(row.memberId, row.rating);
  }

  return { rows, ratingMap, statsMap };
}

export function rebuildRankingData(input: RebuildInput): RankingRebuildResult {
  const { players, sessions, matches } = input;

  const normal = buildRowsForMode(players, sessions, matches, "normal");
  const team = buildRowsForMode(players, sessions, matches, "team");

  const updatedPlayers: Player[] = players.map((player) => {
    const normalAgg = normal.statsMap.get(player.id);
    const teamAgg = team.statsMap.get(player.id);

    const wins = (normalAgg?.wins ?? 0) + (teamAgg?.wins ?? 0);
    const losses = (normalAgg?.losses ?? 0) + (teamAgg?.losses ?? 0);
    const matchesTotal = (normalAgg?.matches ?? 0) + (teamAgg?.matches ?? 0);

    const overallRating =
      Math.round(
        (((normal.ratingMap.get(player.id) ?? BASE_RATING) +
          (team.ratingMap.get(player.id) ?? BASE_RATING)) /
          2) *
          100
      ) / 100;

    return {
      ...player,

      rating: overallRating,
      wins,
      losses,
      matches: matchesTotal,

      ratingNormal: normal.ratingMap.get(player.id) ?? BASE_RATING,
      winsNormal: normalAgg?.wins ?? 0,
      lossesNormal: normalAgg?.losses ?? 0,
      matchesNormal: normalAgg?.matches ?? 0,
      pointsForNormal: normalAgg?.pointsFor ?? 0,
      pointsAgainstNormal: normalAgg?.pointsAgainst ?? 0,

      ratingTeam: team.ratingMap.get(player.id) ?? BASE_RATING,
      winsTeam: teamAgg?.wins ?? 0,
      lossesTeam: teamAgg?.losses ?? 0,
      matchesTeam: teamAgg?.matches ?? 0,
      pointsForTeam: teamAgg?.pointsFor ?? 0,
      pointsAgainstTeam: teamAgg?.pointsAgainst ?? 0,
    };
  });

  return {
    players: updatedPlayers,
    normalRows: normal.rows,
    teamRows: team.rows,
  };
}

export function getRanking(mode: RankingMode = "normal"): RankingRow[] {
  const result = rebuildRankingData({
    players: getPlayers(),
    sessions: getSessions(),
    matches: getMatches(),
  });

  return mode === "normal" ? result.normalRows : result.teamRows;
}

function emptySummary(rating = 1000): PlayerSummary {
  return {
    rating,
    rankScore: rating,
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

function rowToSummary(
  row: RankingRow | undefined,
  fallbackRating = 1000
): PlayerSummary {
  if (!row) return emptySummary(fallbackRating);

  return {
    rating: row.rating,
    rankScore: row.rankScore,
    matches: row.matches,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    pointDiff: row.pointDiff,
    winRate: row.matches > 0 ? row.wins / row.matches : 0,
    streakType:
      row.last5.length === 0
        ? "none"
        : row.last5[row.last5.length - 1] === "W"
        ? "win"
        : "loss",
    streakCount: (() => {
      if (row.last5.length === 0) return 0;
      const last = row.last5[row.last5.length - 1];
      let count = 0;
      for (let i = row.last5.length - 1; i >= 0; i -= 1) {
        if (row.last5[i] === last) count += 1;
        else break;
      }
      return count;
    })(),
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
  };
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const player = players.find((p) => p.id === playerId);
  if (!player) return null;

  const rebuilt = rebuildRankingData({ players, sessions, matches });
  const summaryNormalRow = rebuilt.normalRows.find((r) => r.memberId === playerId);
  const summaryTeamRow = rebuilt.teamRows.find((r) => r.memberId === playerId);

  const summaryNormal = rowToSummary(summaryNormalRow, player.ratingNormal);
  const summaryTeam = rowToSummary(summaryTeamRow, player.ratingTeam);

  const totalMatches = summaryNormal.matches + summaryTeam.matches;
  const totalWins = summaryNormal.wins + summaryTeam.wins;
  const totalLosses = summaryNormal.losses + summaryTeam.losses;
  const totalDraws = summaryNormal.draws + summaryTeam.draws;
  const totalPF = summaryNormal.pointsFor + summaryTeam.pointsFor;
  const totalPA = summaryNormal.pointsAgainst + summaryTeam.pointsAgainst;
  const totalDiff = totalPF - totalPA;
  const totalWinRate = totalMatches > 0 ? totalWins / totalMatches : 0;

  const summary: PlayerSummary = {
    rating: player.rating,
    rankScore: Math.round(
      (((summaryNormal.rankScore ?? 0) + (summaryTeam.rankScore ?? 0)) / 2) * 100
    ) / 100,
    matches: totalMatches,
    wins: totalWins,
    losses: totalLosses,
    draws: totalDraws,
    pointDiff: totalDiff,
    winRate: totalWinRate,
    streakType:
      summaryNormal.streakCount >= summaryTeam.streakCount
        ? summaryNormal.streakType
        : summaryTeam.streakType,
    streakCount: Math.max(summaryNormal.streakCount, summaryTeam.streakCount),
    pointsFor: totalPF,
    pointsAgainst: totalPA,
  };

  const playerMap = new Map(players.map((p) => [p.id, p]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const sessionModeMap = new Map(
    sessions.map((s) => [s.id, (s.mode ?? "normal") as SessionMode])
  );

  const playerMatches = matches.filter(
    (m) =>
      m.teamA.memberIds.includes(playerId) ||
      m.teamB.memberIds.includes(playerId)
  );

  const recentMatches: RecentMatchItem[] = playerMatches
    .map((match) => {
      const mode: SessionMode = sessionModeMap.get(match.sessionId) ?? "normal";

      const teamAIds = match.teamA.memberIds;
      const teamBIds = match.teamB.memberIds;

      const isInTeamA = teamAIds.includes(playerId);
      const isInTeamB = teamBIds.includes(playerId);

      if (!isInTeamA && !isInTeamB) return null;

      const myTeam = isInTeamA ? teamAIds : teamBIds;
      const oppTeam = isInTeamA ? teamBIds : teamAIds;

      const partnerIds = myTeam.filter((id) => id !== playerId);
      const opponentIds = [...oppTeam];

      const partnerNames = partnerIds.map(
        (id) => playerMap.get(id)?.name ?? id
      );
      const opponentNames = opponentIds.map(
        (id) => playerMap.get(id)?.name ?? id
      );

      let result: MatchResult = "draw";
      let scoreFor = 0;
      let scoreAgainst = 0;

      if (isInTeamA) {
        scoreFor = match.scoreA;
        scoreAgainst = match.scoreB;
        if (match.scoreA > match.scoreB) result = "win";
        else if (match.scoreA < match.scoreB) result = "loss";
      } else {
        scoreFor = match.scoreB;
        scoreAgainst = match.scoreA;
        if (match.scoreB > match.scoreA) result = "win";
        else if (match.scoreB < match.scoreA) result = "loss";
      }

      const session = sessionMap.get(match.sessionId);

      return {
        matchId: match.id,
        sessionId: match.sessionId,
        mode,
        round: match.round,
        court: match.court,
        result,
        scoreFor,
        scoreAgainst,
        partnerIds,
        partnerNames,
        opponentIds,
        opponentNames,
        playedAt: session?.date ?? match.createdAt,
      };
    })
    .filter((item): item is RecentMatchItem => item !== null)
    .sort((a, b) => {
      const da = a.playedAt ? new Date(a.playedAt).getTime() : 0;
      const db = b.playedAt ? new Date(b.playedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 20);

  const partnerMap = new Map<
    string,
    {
      playerId: string;
      memberId: string;
      name: string;
      count: number;
      winsTogether: number;
      lossesTogether: number;
    }
  >();

  const opponentMap = new Map<
    string,
    {
      playerId: string;
      memberId: string;
      name: string;
      count: number;
      winsAgainst: number;
      lossesAgainst: number;
    }
  >();

  for (const match of matches) {
    const inTeamA = match.teamA.memberIds.includes(playerId);
    const inTeamB = match.teamB.memberIds.includes(playerId);
    if (!inTeamA && !inTeamB) continue;

    const myTeam = inTeamA ? match.teamA.memberIds : match.teamB.memberIds;
    const enemyTeam = inTeamA ? match.teamB.memberIds : match.teamA.memberIds;

    const myScore = inTeamA ? match.scoreA : match.scoreB;
    const enemyScore = inTeamA ? match.scoreB : match.scoreA;

    for (const partnerId of myTeam) {
      if (partnerId === playerId) continue;

      const current = partnerMap.get(partnerId) ?? {
        playerId: partnerId,
        memberId: partnerId,
        name: playerMap.get(partnerId)?.name ?? partnerId,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      current.count += 1;
      if (myScore > enemyScore) current.winsTogether += 1;
      else if (myScore < enemyScore) current.lossesTogether += 1;

      partnerMap.set(partnerId, current);
    }

    for (const oppId of enemyTeam) {
      const current = opponentMap.get(oppId) ?? {
        playerId: oppId,
        memberId: oppId,
        name: playerMap.get(oppId)?.name ?? oppId,
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      current.count += 1;
      if (myScore > enemyScore) current.winsAgainst += 1;
      else if (myScore < enemyScore) current.lossesAgainst += 1;

      opponentMap.set(oppId, current);
    }
  }

  const topPartners = [...partnerMap.values()]
    .sort((a, b) => b.count - a.count || b.winsTogether - a.winsTogether)
    .slice(0, 10);

  const topOpponents = [...opponentMap.values()]
    .sort((a, b) => b.count - a.count || b.winsAgainst - a.winsAgainst)
    .slice(0, 10);

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