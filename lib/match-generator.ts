import type {
  GeneratedSchedule,
  ScheduleStats,
  ScheduledMatch,
  SessionRecord,
  SessionRound,
} from "@/types";

/* =========================================================
   Sprint 8C
   - normal mode: auto by court count, fair rotation
   - team mode: fixed 2 teams, only cross-team pairing
========================================================= */

const ROUND_CONFIG: Record<number, number> = {
  4: 6,
  5: 8,
  6: 9,
  7: 10,
  8: 10,
  9: 12,
  10: 12,
  11: 14,
  12: 14,
};

type PairCounter = Record<string, number>;

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

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
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

function getTargetRounds(playerCount: number, courtCount: number) {
  if (playerCount <= 0) return 0;
  if (ROUND_CONFIG[playerCount]) return ROUND_CONFIG[playerCount];

  // fallback cho > 12 người
  return Math.max(10, Math.ceil(playerCount / Math.max(1, courtCount)) * 4);
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

function chooseRestingPlayers(
  allPlayerIds: string[],
  restCount: number,
  stats: ScheduleStats
) {
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

function scoreCandidate(params: {
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

  const matchCounts = [...teamA, ...teamB].map(
    (id) => stats.matchesByPlayer[id] ?? 0
  );
  const restCounts = resting.map((id) => stats.restsByPlayer[id] ?? 0);

  score += matchCounts.reduce((sum, n) => sum + n * 20, 0);
  score += restCounts.reduce((sum, n) => sum + n * 18, 0);

  if (teamA.length === 2) {
    score += getCounter(teammateCounter, teamA[0], teamA[1]) * 40;
  }
  if (teamB.length === 2) {
    score += getCounter(teammateCounter, teamB[0], teamB[1]) * 40;
  }

  for (const a of teamA) {
    for (const b of teamB) {
      score += getCounter(opponentCounter, a, b) * 14;
    }
  }

  const currentPlayers = [...teamA, ...teamB];
  const repeatFromPrev = currentPlayers.filter((id) =>
    previousRoundPlayers.has(id)
  ).length;
  score += repeatFromPrev * 2;

  return score;
}

function buildOneMatchRound(
  availablePlayers: string[],
  resting: string[],
  stats: ScheduleStats,
  teammateCounter: PairCounter,
  opponentCounter: PairCounter,
  previousRoundPlayers: Set<string>
): { teamA: string[]; teamB: string[] } {
  if (availablePlayers.length !== 4) {
    throw new Error("One match requires exactly 4 active players.");
  }

  const [a, b, c, d] = availablePlayers;

  const candidateTeams = [
    { teamA: [a, b], teamB: [c, d] },
    { teamA: [a, c], teamB: [b, d] },
    { teamA: [a, d], teamB: [b, c] },
  ];

  let best = candidateTeams[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidateTeams) {
    const score = scoreCandidate({
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

function applyRoundToStats(
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

    if (match.teamA.length === 2) {
      incCounter(teammateCounter, match.teamA[0], match.teamA[1]);
    }
    if (match.teamB.length === 2) {
      incCounter(teammateCounter, match.teamB[0], match.teamB[1]);
    }

    for (const a of match.teamA) {
      for (const b of match.teamB) {
        incCounter(opponentCounter, a, b);
      }
    }
  }
}

/* =========================================================
   NORMAL MODE
========================================================= */

function buildNormalRound(params: {
  allPlayerIds: string[];
  roundNo: number;
  courtCount: number;
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}): SessionRound {
  const {
    allPlayerIds,
    roundNo,
    courtCount,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers,
  } = params;

  const activeSlots = Math.min(allPlayerIds.length, courtCount * 4);
  const restCount = Math.max(0, allPlayerIds.length - activeSlots);

  const resting = chooseRestingPlayers(allPlayerIds, restCount, stats);
  const activePlayers = allPlayerIds.filter((id) => !resting.includes(id));

  const matches: ScheduledMatch[] = [];
  const activeSorted = [...activePlayers].sort((a, b) => {
    const ma = stats.matchesByPlayer[a] ?? 0;
    const mb = stats.matchesByPlayer[b] ?? 0;
    if (ma !== mb) return ma - mb;
    return a.localeCompare(b);
  });

  const groups: string[][] = [];
  for (let i = 0; i < activeSorted.length; i += 4) {
    const chunk = activeSorted.slice(i, i + 4);
    if (chunk.length === 4) groups.push(chunk);
  }

  groups.forEach((group, idx) => {
    const match = buildOneMatchRound(
      group,
      resting,
      stats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers
    );

    matches.push({
      id: `r${roundNo}_m${idx + 1}`,
      round: roundNo,
      court: idx + 1,
      teamA: match.teamA,
      teamB: match.teamB,
      restingPlayerIds: idx === 0 ? resting : [],
      completed: false,
    });
  });

  return {
    round: roundNo,
    restingPlayerIds: resting,
    completed: false,
    matches,
  };
}

/* =========================================================
   TEAM MODE
   - player cùng team không đấu với nhau
   - mỗi trận là 2 người Team A vs 2 người Team B
========================================================= */

type TeamRotationState = {
  matchCount: Record<string, number>;
};

function createTeamRotationState(playerIds: string[]): TeamRotationState {
  const matchCount: Record<string, number> = {};
  playerIds.forEach((id) => {
    matchCount[id] = 0;
  });
  return { matchCount };
}

function pickTeamPlayers(teamIds: string[], take: number, state: TeamRotationState) {
  return [...teamIds]
    .sort((a, b) => {
      const ma = state.matchCount[a] ?? 0;
      const mb = state.matchCount[b] ?? 0;
      if (ma !== mb) return ma - mb;
      return a.localeCompare(b);
    })
    .slice(0, take);
}

function buildTeamModeSchedule(session: SessionRecord): GeneratedSchedule {
  const teamAIds = unique(session.teamConfig?.teamAPlayerIds ?? []).filter(Boolean);
  const teamBIds = unique(session.teamConfig?.teamBPlayerIds ?? []).filter(Boolean);

  const courtCount = Math.max(1, session.courtCount ?? 1);
  const totalRounds = getTargetRounds(
    (session.participantIds ?? []).length,
    courtCount
  );

  if (teamAIds.length < 2 || teamBIds.length < 2) {
    return {
      sessionId: session.id,
      rounds: [],
      totalRounds: 0,
    };
  }

  const teamAState = createTeamRotationState(teamAIds);
  const teamBState = createTeamRotationState(teamBIds);

  const rounds: SessionRound[] = [];

  for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
    const matches: ScheduledMatch[] = [];
    const usedA = new Set<string>();
    const usedB = new Set<string>();

    for (let court = 1; court <= courtCount; court += 1) {
      const availableA = teamAIds.filter((id) => !usedA.has(id));
      const availableB = teamBIds.filter((id) => !usedB.has(id));

      if (availableA.length < 2 || availableB.length < 2) break;

      const pickA = pickTeamPlayers(availableA, 2, teamAState);
      const pickB = pickTeamPlayers(availableB, 2, teamBState);

      if (pickA.length < 2 || pickB.length < 2) break;

      pickA.forEach((id) => {
        usedA.add(id);
        teamAState.matchCount[id] = (teamAState.matchCount[id] ?? 0) + 1;
      });
      pickB.forEach((id) => {
        usedB.add(id);
        teamBState.matchCount[id] = (teamBState.matchCount[id] ?? 0) + 1;
      });

      matches.push({
        id: `r${roundNo}_m${court}`,
        round: roundNo,
        court,
        teamA: pickA,
        teamB: pickB,
        completed: false,
      });
    }

    const restingPlayerIds = [
      ...teamAIds.filter((id) => !usedA.has(id)),
      ...teamBIds.filter((id) => !usedB.has(id)),
    ];

    rounds.push({
      round: roundNo,
      matches,
      restingPlayerIds,
      completed: false,
    });
  }

  return {
    sessionId: session.id,
    rounds,
    totalRounds: rounds.length,
  };
}

/* =========================================================
   PUBLIC
========================================================= */

export function buildSessionSchedule(
  session: SessionRecord
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

  if (mode === "team") {
    return buildTeamModeSchedule(session);
  }

  const totalRounds = getTargetRounds(ids.length, courtCount);
  if (!totalRounds) {
    return {
      sessionId: session.id,
      rounds: [],
      totalRounds: 0,
    };
  }

  const stats = createEmptyStats(ids);
  const teammateCounter: PairCounter = {};
  const opponentCounter: PairCounter = {};
  const rounds: SessionRound[] = [];
  let previousRoundPlayers = new Set<string>();

  for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
    const round = buildNormalRound({
      allPlayerIds: ids,
      roundNo,
      courtCount,
      stats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers,
    });

    applyRoundToStats(round, stats, teammateCounter, opponentCounter);

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