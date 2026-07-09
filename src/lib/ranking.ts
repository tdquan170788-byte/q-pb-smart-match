import type {
  MatchRecord,
  MatchResult,
  OpponentStat,
  PartnerStat,
  Player,
  PlayerDetailStats,
  PlayerSummary,
  RankingRow,
  RankingSnapshot,
  RecentMatchItem,
  SessionMode,
  SessionRecord,
} from "@/types";
import { getMatches, getPlayers, getSessions } from "@/lib/storage";

type ModeStats = {
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  pointsFor: number;
  pointsAgainst: number;
  last5: Array<"W" | "L">;
  streakType: "win" | "loss" | "draw" | "none";
  streakCount: number;
};

type WorkingPlayer = {
  id: string;
  name: string;
  nickname?: string;
  normal: ModeStats;
  team: ModeStats;
};

type RebuildInput = {
  players: Player[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
};

const BASE_RATING = 1000;
const ELO_K = 24;

function createEmptyModeStats(): ModeStats {
  return {
    rating: BASE_RATING,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
    streakType: "none",
    streakCount: 0,
  };
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

function getModeKey(mode: SessionMode) {
  return mode === "team" ? "team" : "normal";
}

function getExpectedScore(teamRating: number, oppRating: number) {
  return 1 / (1 + Math.pow(10, (oppRating - teamRating) / 400));
}

function getActualScore(scoreFor: number, scoreAgainst: number) {
  if (scoreFor > scoreAgainst) return 1;
  if (scoreFor < scoreAgainst) return 0;
  return 0.5;
}

function pushLast5(stats: ModeStats, result: MatchResult) {
  if (result === "D") return;
  stats.last5.push(result);
  if (stats.last5.length > 5) {
    stats.last5 = stats.last5.slice(stats.last5.length - 5);
  }
}

function applyStreak(stats: ModeStats, result: MatchResult) {
  const nextType =
    result === "W" ? "win" : result === "L" ? "loss" : "draw";

  if (stats.streakType === nextType) {
    stats.streakCount += 1;
  } else {
    stats.streakType = nextType;
    stats.streakCount = 1;
  }
}

function toResult(scoreFor: number, scoreAgainst: number): MatchResult {
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "D";
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

function toRankScore(summary: PlayerSummary) {
  return (
    summary.rating +
    summary.wins * 8 +
    summary.pointDiff * 0.35 +
    summary.winRate * 100
  );
}

function toSummary(stats: ModeStats): PlayerSummary {
  const pointDiff = stats.pointsFor - stats.pointsAgainst;
  const winRate = stats.matches > 0 ? stats.wins / stats.matches : 0;

  const base: PlayerSummary = {
    rating: Number(stats.rating.toFixed(2)),
    rankScore: 0,
    matches: stats.matches,
    wins: stats.wins,
    losses: stats.losses,
    draws: stats.draws,
    winRate,
    pointsFor: stats.pointsFor,
    pointsAgainst: stats.pointsAgainst,
    pointDiff,
    streakType: stats.streakType,
    streakCount: stats.streakCount,
  };

  return {
    ...base,
    rankScore: toRankScore(base),
  };
}

function combineSummary(a: PlayerSummary, b: PlayerSummary): PlayerSummary {
  const matches = a.matches + b.matches;
  const wins = a.wins + b.wins;
  const losses = a.losses + b.losses;
  const draws = a.draws + b.draws;
  const pointsFor = a.pointsFor + b.pointsFor;
  const pointsAgainst = a.pointsAgainst + b.pointsAgainst;
  const pointDiff = pointsFor - pointsAgainst;
  const winRate = matches > 0 ? wins / matches : 0;

  const summary: PlayerSummary = {
    rating: Number((((a.rating || 0) + (b.rating || 0)) / 2).toFixed(2)),
    rankScore: 0,
    matches,
    wins,
    losses,
    draws,
    winRate,
    pointsFor,
    pointsAgainst,
    pointDiff,
    streakType:
      b.matches > 0
        ? b.streakType
        : a.matches > 0
        ? a.streakType
        : "none",
    streakCount:
      b.matches > 0
        ? b.streakCount
        : a.matches > 0
        ? a.streakCount
        : 0,
  };

  return {
    ...summary,
    rankScore: toRankScore(summary),
  };
}

function toRankingRow(
  player: WorkingPlayer,
  mode: SessionMode
): RankingRow {
  const stats = mode === "team" ? player.team : player.normal;
  const pointDiff = stats.pointsFor - stats.pointsAgainst;
  const winRate =
    stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;

  return {
    playerId: player.id,
    playerName: player.name,
    nickname: player.nickname,
    rating: Number(stats.rating.toFixed(2)),
    wins: stats.wins,
    losses: stats.losses,
    matches: stats.matches,
    winRate,
    pointsFor: stats.pointsFor,
    pointsAgainst: stats.pointsAgainst,
    pointDiff,
    last5: [...stats.last5],
  };
}

function createWorkingPlayers(players: Player[]) {
  const map = new Map<string, WorkingPlayer>();

  players.forEach((player) => {
    map.set(player.id, {
      id: player.id,
      name: player.name,
      nickname: player.nickname,
      normal: createEmptyModeStats(),
      team: createEmptyModeStats(),
    });
  });

  return map;
}

function ensureWorkingPlayer(
  map: Map<string, WorkingPlayer>,
  playerId: string,
  fallbackName?: string
) {
  let player = map.get(playerId);
  if (!player) {
    player = {
      id: playerId,
      name: fallbackName ?? playerId,
      nickname: "",
      normal: createEmptyModeStats(),
      team: createEmptyModeStats(),
    };
    map.set(playerId, player);
  }
  return player;
}

function averageRating(players: WorkingPlayer[], mode: SessionMode) {
  if (players.length === 0) return BASE_RATING;
  const total = players.reduce((sum, p) => {
    return sum + (mode === "team" ? p.team.rating : p.normal.rating);
  }, 0);
  return total / players.length;
}

function applyMatchToStats(
  workingPlayers: Map<string, WorkingPlayer>,
  mode: SessionMode,
  match: MatchRecord
) {
  const teamAIds = match.teamA.memberIds ?? [];
  const teamBIds = match.teamB.memberIds ?? [];

  if (teamAIds.length === 0 || teamBIds.length === 0) return;

  const teamAPlayers = teamAIds.map((id) =>
    ensureWorkingPlayer(workingPlayers, id)
  );
  const teamBPlayers = teamBIds.map((id) =>
    ensureWorkingPlayer(workingPlayers, id)
  );

  const teamARating = averageRating(teamAPlayers, mode);
  const teamBRating = averageRating(teamBPlayers, mode);

  const actualA = getActualScore(match.scoreA, match.scoreB);
  const actualB = getActualScore(match.scoreB, match.scoreA);

  const expectedA = getExpectedScore(teamARating, teamBRating);
  const expectedB = getExpectedScore(teamBRating, teamARating);

  const deltaA = ELO_K * (actualA - expectedA);
  const deltaB = ELO_K * (actualB - expectedB);

  const resultA = toResult(match.scoreA, match.scoreB);
  const resultB = toResult(match.scoreB, match.scoreA);

  for (const player of teamAPlayers) {
    const stats = mode === "team" ? player.team : player.normal;

    stats.matches += 1;
    stats.pointsFor += match.scoreA;
    stats.pointsAgainst += match.scoreB;
    stats.rating = Number((stats.rating + deltaA).toFixed(2));

    if (resultA === "W") stats.wins += 1;
    else if (resultA === "L") stats.losses += 1;
    else stats.draws += 1;

    pushLast5(stats, resultA);
    applyStreak(stats, resultA);
  }

  for (const player of teamBPlayers) {
    const stats = mode === "team" ? player.team : player.normal;

    stats.matches += 1;
    stats.pointsFor += match.scoreB;
    stats.pointsAgainst += match.scoreA;
    stats.rating = Number((stats.rating + deltaB).toFixed(2));

    if (resultB === "W") stats.wins += 1;
    else if (resultB === "L") stats.losses += 1;
    else stats.draws += 1;

    pushLast5(stats, resultB);
    applyStreak(stats, resultB);
  }
}

function hydratePlayersWithStats(
  sourcePlayers: Player[],
  workingPlayers: Map<string, WorkingPlayer>
): Player[] {
  return sourcePlayers.map((player) => {
    const current = workingPlayers.get(player.id);
    if (!current) return player;

    return {
      ...player,

      rating: Number(
        ((current.normal.rating + current.team.rating) / 2).toFixed(2)
      ),
      wins: current.normal.wins + current.team.wins,
      losses: current.normal.losses + current.team.losses,
      matches: current.normal.matches + current.team.matches,

      ratingNormal: Number(current.normal.rating.toFixed(2)),
      winsNormal: current.normal.wins,
      lossesNormal: current.normal.losses,
      matchesNormal: current.normal.matches,
      pointsForNormal: current.normal.pointsFor,
      pointsAgainstNormal: current.normal.pointsAgainst,

      ratingTeam: Number(current.team.rating.toFixed(2)),
      winsTeam: current.team.wins,
      lossesTeam: current.team.losses,
      matchesTeam: current.team.matches,
      pointsForTeam: current.team.pointsFor,
      pointsAgainstTeam: current.team.pointsAgainst,
    };
  });
}

export function rebuildRankingData(input: RebuildInput): RankingSnapshot {
  const { players, sessions, matches } = input;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const workingPlayers = createWorkingPlayers(players);

  const sortedMatches = [...matches].sort((a, b) => {
    const sa = sessionMap.get(a.sessionId);
    const sb = sessionMap.get(b.sessionId);

    const da = sa?.date ?? "";
    const db = sb?.date ?? "";

    if (da !== db) return da.localeCompare(db);
    if (a.round !== b.round) return a.round - b.round;
    return (a.court ?? 1) - (b.court ?? 1);
  });

  sortedMatches.forEach((match) => {
    const session = sessionMap.get(match.sessionId);
    if (!session) return;

    const mode = (session.mode ?? "normal") as SessionMode;
    applyMatchToStats(workingPlayers, mode, match);
  });

  const nextPlayers = hydratePlayersWithStats(players, workingPlayers);

  const refreshedWorkingPlayers = createWorkingPlayers(nextPlayers);
  nextPlayers.forEach((player) => {
    const target = refreshedWorkingPlayers.get(player.id);
    if (!target) return;

    target.normal.rating = player.ratingNormal;
    target.normal.wins = player.winsNormal;
    target.normal.losses = player.lossesNormal;
    target.normal.matches = player.matchesNormal;
    target.normal.pointsFor = player.pointsForNormal;
    target.normal.pointsAgainst = player.pointsAgainstNormal;

    target.team.rating = player.ratingTeam;
    target.team.wins = player.winsTeam;
    target.team.losses = player.lossesTeam;
    target.team.matches = player.matchesTeam;
    target.team.pointsFor = player.pointsForTeam;
    target.team.pointsAgainst = player.pointsAgainstTeam;
  });

  // lấy last5/streak từ workingPlayers gốc vì hydratePlayers chỉ ghi số tổng
  for (const [id, source] of workingPlayers.entries()) {
    const target = refreshedWorkingPlayers.get(id);
    if (!target) continue;

    target.normal.last5 = [...source.normal.last5];
    target.normal.streakType = source.normal.streakType;
    target.normal.streakCount = source.normal.streakCount;
    target.normal.draws = source.normal.draws;

    target.team.last5 = [...source.team.last5];
    target.team.streakType = source.team.streakType;
    target.team.streakCount = source.team.streakCount;
    target.team.draws = source.team.draws;
  }

  const normalRows = sortRows(
    [...refreshedWorkingPlayers.values()].map((p) => toRankingRow(p, "normal"))
  );

  const teamRows = sortRows(
    [...refreshedWorkingPlayers.values()].map((p) => toRankingRow(p, "team"))
  );

  return {
    normalRows,
    teamRows,
    players: nextPlayers,
  };
}

function buildPlayerSummaryFromPlayer(
  player: Player,
  mode: SessionMode
): PlayerSummary {
  if (mode === "team") {
    const summary = toSummary({
      rating: player.ratingTeam,
      wins: player.winsTeam,
      losses: player.lossesTeam,
      draws: 0,
      matches: player.matchesTeam,
      pointsFor: player.pointsForTeam,
      pointsAgainst: player.pointsAgainstTeam,
      last5: [],
      streakType: "none",
      streakCount: 0,
    });
    return summary;
  }

  return toSummary({
    rating: player.ratingNormal,
    wins: player.winsNormal,
    losses: player.lossesNormal,
    draws: 0,
    matches: player.matchesNormal,
    pointsFor: player.pointsForNormal,
    pointsAgainst: player.pointsAgainstNormal,
    last5: [],
    streakType: "none",
    streakCount: 0,
  });
}

function findMatchPerspective(
  playerId: string,
  match: MatchRecord
): {
  side: "A" | "B";
  partnerIds: string[];
  opponentIds: string[];
} | null {
  const a = match.teamA.memberIds ?? [];
  const b = match.teamB.memberIds ?? [];

  if (a.includes(playerId)) {
    return {
      side: "A",
      partnerIds: a.filter((id) => id !== playerId),
      opponentIds: b,
    };
  }

  if (b.includes(playerId)) {
    return {
      side: "B",
      partnerIds: b.filter((id) => id !== playerId),
      opponentIds: a,
    };
  }

  return null;
}

export function getPlayerDetailStats(playerId: string): PlayerDetailStats | null {
  const players = getPlayers();
  const sessions = getSessions();
  const matches = getMatches();

  const rebuilt = rebuildRankingData({ players, sessions, matches });
  const player = rebuilt.players.find((p) => p.id === playerId);
  if (!player) return null;

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const playerMap = new Map(rebuilt.players.map((p) => [p.id, p]));

  const partnerMap = new Map<string, PartnerStat>();
  const opponentMap = new Map<string, OpponentStat>();
  const recentMatches: RecentMatchItem[] = [];

  const relatedMatches = [...matches]
    .filter((match) => {
      const ids = [
        ...(match.teamA.memberIds ?? []),
        ...(match.teamB.memberIds ?? []),
      ];
      return ids.includes(playerId);
    })
    .sort((a, b) => {
      const sa = sessionMap.get(a.sessionId);
      const sb = sessionMap.get(b.sessionId);
      const da = sa?.date ?? "";
      const db = sb?.date ?? "";

      if (da !== db) return db.localeCompare(da);
      if (a.round !== b.round) return b.round - a.round;
      return (b.court ?? 1) - (a.court ?? 1);
    });

  for (const match of relatedMatches) {
    const perspective = findMatchPerspective(playerId, match);
    if (!perspective) continue;

    const session = sessionMap.get(match.sessionId);
    const mode = (session?.mode ?? "normal") as SessionMode;

    const scoreFor = perspective.side === "A" ? match.scoreA : match.scoreB;
    const scoreAgainst = perspective.side === "A" ? match.scoreB : match.scoreA;
    const result = toResult(scoreFor, scoreAgainst);

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      round: match.round,
      mode,
      scoreFor,
      scoreAgainst,
      result,
      partnerIds: perspective.partnerIds.map(
        (id) => playerMap.get(id)?.name ?? id
      ),
      opponentIds: perspective.opponentIds.map(
        (id) => playerMap.get(id)?.name ?? id
      ),
    });

    for (const partnerId of perspective.partnerIds) {
      const current =
        partnerMap.get(partnerId) ??
        ({
          playerId: partnerId,
          name: playerMap.get(partnerId)?.name ?? partnerId,
          count: 0,
          winsTogether: 0,
          lossesTogether: 0,
        } satisfies PartnerStat);

      current.count += 1;
      if (result === "W") current.winsTogether += 1;
      if (result === "L") current.lossesTogether += 1;

      partnerMap.set(partnerId, current);
    }

    for (const opponentId of perspective.opponentIds) {
      const current =
        opponentMap.get(opponentId) ??
        ({
          playerId: opponentId,
          name: playerMap.get(opponentId)?.name ?? opponentId,
          count: 0,
          winsAgainst: 0,
          lossesAgainst: 0,
        } satisfies OpponentStat);

      current.count += 1;
      if (result === "W") current.winsAgainst += 1;
      if (result === "L") current.lossesAgainst += 1;

      opponentMap.set(opponentId, current);
    }
  }

  const topPartners = [...partnerMap.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.winsTogether - a.winsTogether;
    })
    .slice(0, 10);

  const topOpponents = [...opponentMap.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.winsAgainst - a.winsAgainst;
    })
    .slice(0, 10);

  const summaryNormal = buildPlayerSummaryFromPlayer(player, "normal");
  const summaryTeam = buildPlayerSummaryFromPlayer(player, "team");
  const summary = combineSummary(summaryNormal, summaryTeam);

  // cập nhật streak tổng từ trận gần nhất
  if (recentMatches.length > 0) {
    const first = recentMatches[0];
    let streakCount = 0;
    for (const item of recentMatches) {
      if (item.result !== first.result) break;
      streakCount += 1;
    }

    summary.streakType =
      first.result === "W" ? "win" : first.result === "L" ? "loss" : "draw";
    summary.streakCount = streakCount;
  }

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