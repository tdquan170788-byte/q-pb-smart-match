import type {
  GeneratedSchedule,
  ScheduleStats,
  ScheduledMatch,
  SessionMode,
  SessionRecord,
  SessionRound,
  SessionTeamConfig,
} from "@/types";

/* =========================================================
   Sprint 8B
   - courtCount động
   - normal mode
   - team mode (người cùng team không đấu nhau)
========================================================= */

type PairCounter = Record<string, number>;

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function incCounter(counter: PairCounter, a: string, b: string) {
  const key = pairKey(a, b);
  counter[key] = (counter[key] ?? 0) + 1;
}

function getCounter(counter: PairCounter, a: string, b: string) {
  return counter[pairKey(a, b)] ?? 0;
}

function combinations<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];

  function backtrack(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i += 1) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

function createEmptyStats(playerIds: string[]): ScheduleStats {
  const matchesByPlayer: Record<string, number> = {};
  const restsByPlayer: Record<string, number> = {};

  for (const id of playerIds) {
    matchesByPlayer[id] = 0;
    restsByPlayer[id] = 0;
  }

  return { matchesByPlayer, restsByPlayer };
}

function getTargetRounds(
  playerCount: number,
  courtCount: number,
  mode: SessionMode
) {
  const safeCourts = Math.max(1, courtCount || 1);

  if (mode === "team") {
    // team mode: ít round hơn chút để dễ kiểm soát
    if (playerCount <= 4) return 4;
    if (playerCount <= 6) return 6;
    if (playerCount <= 8) return 8;
    if (playerCount <= 10) return 10;
    return Math.max(10, Math.ceil(playerCount * 1.2));
  }

  // normal mode
  let base = 0;
  if (playerCount === 4) base = 6;
  else if (playerCount === 5) base = 8;
  else if (playerCount === 6) base = 9;
  else if (playerCount === 7) base = 10;
  else if (playerCount === 8) base = 10;
  else if (playerCount === 9) base = 12;
  else if (playerCount === 10) base = 12;
  else if (playerCount === 11) base = 14;
  else if (playerCount === 12) base = 14;
  else base = Math.max(10, Math.ceil(playerCount * 1.2));

  // nhiều sân thì có thể giảm nhẹ số round vì throughput cao hơn
  if (safeCourts >= 3) return Math.max(6, base - 2);
  if (safeCourts >= 2) return Math.max(6, base - 1);
  return base;
}

/* =========================================================
   NORMAL MODE
========================================================= */

function scoreNormalCandidate(params: {
  teamA: string[];
  teamB: string[];
  resting: string[];
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}) {
  const {
    teamA,
    teamB,
    resting,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers,
  } = params;

  let score = 0;

  const currentPlayers = [...teamA, ...teamB];
  const matchCounts = currentPlayers.map((id) => stats.matchesByPlayer[id] ?? 0);
  const restCounts = resting.map((id) => stats.restsByPlayer[id] ?? 0);

  score += matchCounts.reduce((sum, n) => sum + n * 20, 0);
  score += restCounts.reduce((sum, n) => sum + n * 18, 0);

  score += getCounter(teammateCounter, teamA[0], teamA[1]) * 40;
  score += getCounter(teammateCounter, teamB[0], teamB[1]) * 40;

  for (const a of teamA) {
    for (const b of teamB) {
      score += getCounter(opponentCounter, a, b) * 14;
    }
  }

  const repeatFromPrev = currentPlayers.filter((id) =>
    previousRoundPlayers.has(id)
  ).length;
  score += repeatFromPrev * 2;

  return score;
}

function chooseRestingPlayers(
  allPlayerIds: string[],
  restCount: number,
  stats: ScheduleStats
) {
  if (restCount <= 0) return [];

  const sorted = [...allPlayerIds].sort((a, b) => {
    const restA = stats.restsByPlayer[a] ?? 0;
    const restB = stats.restsByPlayer[b] ?? 0;
    if (restA !== restB) return restA - restB;

    const matchA = stats.matchesByPlayer[a] ?? 0;
    const matchB = stats.matchesByPlayer[b] ?? 0;
    if (matchA !== matchB) return matchA - matchB;

    return a.localeCompare(b);
  });

  return sorted.slice(0, restCount);
}

function chooseBestPairingFor4(
  players4: string[],
  resting: string[],
  stats: ScheduleStats,
  teammateCounter: PairCounter,
  opponentCounter: PairCounter,
  previousRoundPlayers: Set<string>
) {
  const [a, b, c, d] = players4;

  const candidateTeams = [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];

  let best = candidateTeams[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidateTeams) {
    const score = scoreNormalCandidate({
      teamA: candidate.teamA,
      teamB: candidate.teamB,
      resting,
      stats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers,
    });

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function buildNormalRound(params: {
  roundNo: number;
  allPlayerIds: string[];
  courtCount: number;
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}): SessionRound {
  const {
    roundNo,
    allPlayerIds,
    courtCount,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers,
  } = params;

  const maxActive = Math.min(allPlayerIds.length, courtCount * 4);
  const restCount = Math.max(0, allPlayerIds.length - maxActive);
  const resting = chooseRestingPlayers(allPlayerIds, restCount, stats);

  const activePlayers = allPlayerIds.filter((id) => !resting.includes(id));

  const matches: ScheduledMatch[] = [];
  const activePool = [...activePlayers];

  let court = 1;
  while (activePool.length >= 4 && court <= courtCount) {
    const players4 = activePool.splice(0, 4);
    const best = chooseBestPairingFor4(
      players4,
      resting,
      stats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers
    );

    matches.push({
      id: `r${roundNo}_c${court}`,
      round: roundNo,
      court,
      teamA: best.teamA,
      teamB: best.teamB,
      restingPlayerIds: resting,
      completed: false,
    });

    court += 1;
  }

  return {
    round: roundNo,
    matches,
    restingPlayerIds: resting,
    completed: false,
  };
}

function applyNormalRoundToStats(
  round: SessionRound,
  stats: ScheduleStats,
  teammateCounter: PairCounter,
  opponentCounter: PairCounter
) {
  for (const restId of round.restingPlayerIds) {
    stats.restsByPlayer[restId] = (stats.restsByPlayer[restId] ?? 0) + 1;
  }

  for (const match of round.matches) {
    for (const id of [...match.teamA, ...match.teamB]) {
      stats.matchesByPlayer[id] = (stats.matchesByPlayer[id] ?? 0) + 1;
    }

    incCounter(teammateCounter, match.teamA[0], match.teamA[1]);
    incCounter(teammateCounter, match.teamB[0], match.teamB[1]);

    for (const a of match.teamA) {
      for (const b of match.teamB) {
        incCounter(opponentCounter, a, b);
      }
    }
  }
}

/* =========================================================
   TEAM MODE
   - Team A players chỉ đứng cùng Team A
   - Team B players chỉ đứng cùng Team B
   - 1 match = 2 người A vs 2 người B
========================================================= */

type TeamModeStats = {
  pairCountA: PairCounter;
  pairCountB: PairCounter;
  playerUse: Record<string, number>;
};

function createTeamModeStats(allIds: string[]): TeamModeStats {
  const playerUse: Record<string, number> = {};
  for (const id of allIds) {
    playerUse[id] = 0;
  }

  return {
    pairCountA: {},
    pairCountB: {},
    playerUse,
  };
}

function scoreTeamPair(
  pair: string[],
  pairCounter: PairCounter,
  playerUse: Record<string, number>
) {
  const [a, b] = pair;
  return (
    (pairCounter[pairKey(a, b)] ?? 0) * 50 +
    (playerUse[a] ?? 0) * 10 +
    (playerUse[b] ?? 0) * 10
  );
}

function pickBestPairsFromTeam(
  teamIds: string[],
  pairCounter: PairCounter,
  playerUse: Record<string, number>,
  pairCountNeeded: number
) {
  const available = [...teamIds].sort((a, b) => {
    const ua = playerUse[a] ?? 0;
    const ub = playerUse[b] ?? 0;
    if (ua !== ub) return ua - ub;
    return a.localeCompare(b);
  });

  const result: string[][] = [];
  const used = new Set<string>();

  while (result.length < pairCountNeeded) {
    const remaining = available.filter((id) => !used.has(id));
    if (remaining.length < 2) break;

    const pairCandidates = combinations(remaining, 2);
    let bestPair = pairCandidates[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const pair of pairCandidates) {
      const score = scoreTeamPair(pair, pairCounter, playerUse);
      if (score < bestScore) {
        bestScore = score;
        bestPair = pair;
      }
    }

    result.push(bestPair);
    used.add(bestPair[0]);
    used.add(bestPair[1]);
  }

  return {
    pairs: result,
    usedIds: Array.from(used),
  };
}

function chooseTeamRestingPlayers(
  teamIds: string[],
  needActiveCount: number,
  playerUse: Record<string, number>
) {
  if (needActiveCount >= teamIds.length) {
    return {
      active: [...teamIds],
      resting: [],
    };
  }

  const sorted = [...teamIds].sort((a, b) => {
    const ua = playerUse[a] ?? 0;
    const ub = playerUse[b] ?? 0;
    if (ua !== ub) return ua - ub;
    return a.localeCompare(b);
  });

  const active = sorted.slice(0, needActiveCount);
  const resting = teamIds.filter((id) => !active.includes(id));

  return { active, resting };
}

function buildTeamRound(params: {
  roundNo: number;
  courtCount: number;
  teamConfig: SessionTeamConfig;
  stats: TeamModeStats;
}): SessionRound {
  const { roundNo, courtCount, teamConfig, stats } = params;

  const teamAIds = unique(teamConfig.teamAPlayerIds).filter(Boolean);
  const teamBIds = unique(teamConfig.teamBPlayerIds).filter(Boolean);

  const maxMatchesByCourts = Math.max(1, courtCount);
  const maxMatchesByTeamA = Math.floor(teamAIds.length / 2);
  const maxMatchesByTeamB = Math.floor(teamBIds.length / 2);
  const matchCount = Math.max(
    1,
    Math.min(maxMatchesByCourts, maxMatchesByTeamA, maxMatchesByTeamB)
  );

  const activeNeedA = matchCount * 2;
  const activeNeedB = matchCount * 2;

  const pickA = chooseTeamRestingPlayers(teamAIds, activeNeedA, stats.playerUse);
  const pickB = chooseTeamRestingPlayers(teamBIds, activeNeedB, stats.playerUse);

  const pairAResult = pickBestPairsFromTeam(
    pickA.active,
    stats.pairCountA,
    stats.playerUse,
    matchCount
  );

  const pairBResult = pickBestPairsFromTeam(
    pickB.active,
    stats.pairCountB,
    stats.playerUse,
    matchCount
  );

  const matches: ScheduledMatch[] = [];
  const actualMatchCount = Math.min(
    pairAResult.pairs.length,
    pairBResult.pairs.length,
    matchCount
  );

  for (let i = 0; i < actualMatchCount; i += 1) {
    matches.push({
      id: `r${roundNo}_c${i + 1}`,
      round: roundNo,
      court: i + 1,
      teamA: pairAResult.pairs[i],
      teamB: pairBResult.pairs[i],
      restingPlayerIds: [],
      completed: false,
    });
  }

  const usedA = new Set(pairAResult.usedIds);
  const usedB = new Set(pairBResult.usedIds);

  const restingA = teamAIds.filter((id) => !usedA.has(id));
  const restingB = teamBIds.filter((id) => !usedB.has(id));

  return {
    round: roundNo,
    matches,
    restingPlayerIds: [...restingA, ...restingB],
    completed: false,
  };
}

function applyTeamRoundToStats(round: SessionRound, stats: TeamModeStats) {
  for (const match of round.matches) {
    if (match.teamA.length === 2) {
      incCounter(stats.pairCountA, match.teamA[0], match.teamA[1]);
    }
    if (match.teamB.length === 2) {
      incCounter(stats.pairCountB, match.teamB[0], match.teamB[1]);
    }

    for (const id of [...match.teamA, ...match.teamB]) {
      stats.playerUse[id] = (stats.playerUse[id] ?? 0) + 1;
    }
  }
}

/* =========================================================
   PUBLIC
========================================================= */

export function buildSessionSchedule(
  session: Pick<
    SessionRecord,
    "id" | "participantIds" | "mode" | "courtCount" | "teamConfig"
  >
): GeneratedSchedule {
  const ids = unique(session.participantIds).filter(Boolean);
  const mode = session.mode ?? "normal";
  const courtCount = Math.max(1, session.courtCount ?? 1);

  if (ids.length < 4) {
    return {
      sessionId: session.id,
      rounds: [],
      totalRounds: 0,
    };
  }

  const totalRounds = getTargetRounds(ids.length, courtCount, mode);
  if (!totalRounds) {
    return {
      sessionId: session.id,
      rounds: [],
      totalRounds: 0,
    };
  }

  const rounds: SessionRound[] = [];

  if (mode === "team" && session.teamConfig) {
    const allTeamIds = [
      ...session.teamConfig.teamAPlayerIds,
      ...session.teamConfig.teamBPlayerIds,
    ];
    const teamStats = createTeamModeStats(allTeamIds);

    for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
      const round = buildTeamRound({
        roundNo,
        courtCount,
        teamConfig: session.teamConfig,
        stats: teamStats,
      });

      applyTeamRoundToStats(round, teamStats);
      rounds.push(round);
    }

    return {
      sessionId: session.id,
      rounds,
      totalRounds,
    };
  }

  // normal mode
  const normalStats = createEmptyStats(ids);
  const teammateCounter: PairCounter = {};
  const opponentCounter: PairCounter = {};
  let previousRoundPlayers = new Set<string>();

  for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
    const round = buildNormalRound({
      roundNo,
      allPlayerIds: ids,
      courtCount,
      stats: normalStats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers,
    });

    applyNormalRoundToStats(
      round,
      normalStats,
      teammateCounter,
      opponentCounter
    );

    previousRoundPlayers = new Set(
      round.matches.flatMap((m) => [...m.teamA, ...m.teamB])
    );

    rounds.push(round);
  }

  return {
    sessionId: session.id,
    rounds,
    totalRounds,
  };
}