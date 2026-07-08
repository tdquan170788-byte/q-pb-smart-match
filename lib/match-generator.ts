import type {
  GeneratedSchedule,
  ScheduleStats,
  ScheduledMatch,
  SessionMode,
  SessionRound,
} from "@/types";

/* =========================================================
   Sprint 8 - Multi-court + Team Mode
   - normal mode: công bằng theo số sân
   - team mode: Team A chỉ đấu Team B
   - tính tổng điểm cho team mode
========================================================= */

const NORMAL_ROUND_CONFIG: Record<number, number> = {
  4: 4,
  5: 8,
  6: 9,
  7: 10,
  8: 10,
  9: 12,
  10: 12,
  11: 14,
  12: 14,
  13: 16,
  14: 16,
  15: 18,
  16: 18,
};

type PairCounter = Record<string, number>;

type BuildScheduleInput = {
  sessionId: string;
  participantIds: string[];
  mode?: SessionMode;
  courtCount?: number;
  teamAPlayerIds?: string[];
  teamBPlayerIds?: string[];
};

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

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
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

function getTargetRounds(playerCount: number, courtCount: number) {
  if (playerCount <= 0 || courtCount <= 0) return 0;

  const base = NORMAL_ROUND_CONFIG[playerCount];
  if (base) return base;

  // fallback cho >16 người
  const activePerRound = courtCount * 4;
  if (playerCount <= activePerRound) return 10;

  const extra = Math.ceil((playerCount - activePerRound) / 2);
  return Math.max(12, 10 + extra * 2);
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

  score += getCounter(teammateCounter, teamA[0], teamA[1]) * 40;
  score += getCounter(teammateCounter, teamB[0], teamB[1]) * 40;

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

    if (match.teamA.length >= 2) {
      incCounter(teammateCounter, match.teamA[0], match.teamA[1]);
    }
    if (match.teamB.length >= 2) {
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
  roundNo: number;
  participantIds: string[];
  courtCount: number;
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}): SessionRound {
  const {
    roundNo,
    participantIds,
    courtCount,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers,
  } = params;

  const maxActive = courtCount * 4;
  const activeCount = Math.min(participantIds.length, maxActive);
  const restCount = Math.max(0, participantIds.length - activeCount);

  const resting = chooseRestingPlayers(participantIds, restCount, stats);
  const activePlayers = participantIds.filter((id) => !resting.includes(id));

  const matches: ScheduledMatch[] = [];
  const groups = combinations(activePlayers, 4);

  const used = new Set<string>();

  for (let court = 1; court <= Math.floor(activePlayers.length / 4); court += 1) {
    let bestGroup: string[] | null = null;
    let bestGroupScore = Number.POSITIVE_INFINITY;

    for (const group of groups) {
      if (group.some((id) => used.has(id))) continue;

      const [a, b, c, d] = group;
      const candidates = [
        { teamA: [a, b], teamB: [c, d] },
        { teamA: [a, c], teamB: [b, d] },
        { teamA: [a, d], teamB: [b, c] },
      ];

      let localBest = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        const score = scoreCandidate({
          teamA: candidate.teamA,
          teamB: candidate.teamB,
          resting,
          stats,
          teammateCounter,
          opponentCounter,
          previousRoundPlayers,
        });
        if (score < localBest) localBest = score;
      }

      if (localBest < bestGroupScore) {
        bestGroupScore = localBest;
        bestGroup = group;
      }
    }

    if (!bestGroup) break;

    bestGroup.forEach((id) => used.add(id));

    const match = buildOneMatchRound(
      bestGroup,
      resting,
      stats,
      teammateCounter,
      opponentCounter,
      previousRoundPlayers
    );

    matches.push({
      id: `r${roundNo}_m${court}`,
      round: roundNo,
      court,
      teamA: match.teamA,
      teamB: match.teamB,
      restingPlayerIds: [],
      completed: false,
    });
  }

  return {
    round: roundNo,
    matches,
    restingPlayerIds: resting,
    completed: false,
  };
}

/* =========================================================
   TEAM MODE
   - Team A chỉ đánh Team B
   - cùng team không đấu nhau
========================================================= */

type TeamPair = [string, string];

function buildPairsForTeam(teamIds: string[]): TeamPair[] {
  if (teamIds.length < 2) return [];
  return combinations(teamIds, 2) as TeamPair[];
}

function chooseRestingPlayersInsideTeam(
  teamIds: string[],
  restCount: number,
  stats: ScheduleStats
) {
  const sorted = [...teamIds].sort((a, b) => {
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

function scoreTeamModeMatch(params: {
  pairA: TeamPair;
  pairB: TeamPair;
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}) {
  const { pairA, pairB, stats, teammateCounter, opponentCounter, previousRoundPlayers } =
    params;

  let score = 0;

  const currentPlayers = [...pairA, ...pairB];
  score += currentPlayers.reduce(
    (sum, id) => sum + (stats.matchesByPlayer[id] ?? 0) * 20,
    0
  );

  score += getCounter(teammateCounter, pairA[0], pairA[1]) * 35;
  score += getCounter(teammateCounter, pairB[0], pairB[1]) * 35;

  for (const a of pairA) {
    for (const b of pairB) {
      score += getCounter(opponentCounter, a, b) * 12;
    }
  }

  score += currentPlayers.filter((id) => previousRoundPlayers.has(id)).length * 2;

  return score;
}

function buildTeamRound(params: {
  roundNo: number;
  teamAIds: string[];
  teamBIds: string[];
  courtCount: number;
  stats: ScheduleStats;
  teammateCounter: PairCounter;
  opponentCounter: PairCounter;
  previousRoundPlayers: Set<string>;
}): SessionRound {
  const {
    roundNo,
    teamAIds,
    teamBIds,
    courtCount,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers,
  } = params;

  const usableCourts = Math.min(
    courtCount,
    Math.floor(teamAIds.length / 2),
    Math.floor(teamBIds.length / 2)
  );

  if (usableCourts <= 0) {
    return {
      round: roundNo,
      matches: [],
      restingPlayerIds: [...teamAIds, ...teamBIds],
      completed: false,
    };
  }

  const activeA = usableCourts * 2;
  const activeB = usableCourts * 2;

  const restA = Math.max(0, teamAIds.length - activeA);
  const restB = Math.max(0, teamBIds.length - activeB);

  const restingA = chooseRestingPlayersInsideTeam(teamAIds, restA, stats);
  const restingB = chooseRestingPlayersInsideTeam(teamBIds, restB, stats);

  const playingA = teamAIds.filter((id) => !restingA.includes(id));
  const playingB = teamBIds.filter((id) => !restingB.includes(id));

  const pairCandidatesA = buildPairsForTeam(playingA);
  const pairCandidatesB = buildPairsForTeam(playingB);

  const usedA = new Set<string>();
  const usedB = new Set<string>();

  const matches: ScheduledMatch[] = [];

  for (let court = 1; court <= usableCourts; court += 1) {
    let bestPairA: TeamPair | null = null;
    let bestPairB: TeamPair | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const pairA of pairCandidatesA) {
      if (pairA.some((id) => usedA.has(id))) continue;

      for (const pairB of pairCandidatesB) {
        if (pairB.some((id) => usedB.has(id))) continue;

        const score = scoreTeamModeMatch({
          pairA,
          pairB,
          stats,
          teammateCounter,
          opponentCounter,
          previousRoundPlayers,
        });

        if (score < bestScore) {
          bestScore = score;
          bestPairA = pairA;
          bestPairB = pairB;
        }
      }
    }

    if (!bestPairA || !bestPairB) break;

    bestPairA.forEach((id) => usedA.add(id));
    bestPairB.forEach((id) => usedB.add(id));

    matches.push({
      id: `r${roundNo}_m${court}`,
      round: roundNo,
      court,
      teamA: [...bestPairA],
      teamB: [...bestPairB],
      restingPlayerIds: [],
      completed: false,
    });
  }

  return {
    round: roundNo,
    matches,
    restingPlayerIds: [...restingA, ...restingB],
    completed: false,
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

export function buildSessionSchedule(input: BuildScheduleInput): GeneratedSchedule {
  const mode = input.mode ?? "normal";
  const courtCount = Math.max(1, input.courtCount ?? 1);

  if (mode === "team") {
    const teamAIds = unique(input.teamAPlayerIds ?? []).filter(Boolean);
    const teamBIds = unique(input.teamBPlayerIds ?? []).filter(Boolean);

    const allIds = unique([...teamAIds, ...teamBIds]);

    if (teamAIds.length < 2 || teamBIds.length < 2) {
      return {
        sessionId: input.sessionId,
        rounds: [],
        totalRounds: 0,
      };
    }

    const totalRounds = getTargetRounds(allIds.length, courtCount);
    const stats = createEmptyStats(allIds);
    const teammateCounter: PairCounter = {};
    const opponentCounter: PairCounter = {};
    const rounds: SessionRound[] = [];
    let previousRoundPlayers = new Set<string>();

    for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
      const round = buildTeamRound({
        roundNo,
        teamAIds,
        teamBIds,
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
      sessionId: input.sessionId,
      rounds,
      totalRounds,
    };
  }

  const participantIds = unique(input.participantIds).filter(Boolean);
  if (participantIds.length < 4) {
    return {
      sessionId: input.sessionId,
      rounds: [],
      totalRounds: 0,
    };
  }

  const totalRounds = getTargetRounds(participantIds.length, courtCount);
  const stats = createEmptyStats(participantIds);
  const teammateCounter: PairCounter = {};
  const opponentCounter: PairCounter = {};
  const rounds: SessionRound[] = [];
  let previousRoundPlayers = new Set<string>();

  for (let roundNo = 1; roundNo <= totalRounds; roundNo += 1) {
    const round = buildNormalRound({
      roundNo,
      participantIds,
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
    sessionId: input.sessionId,
    rounds,
    totalRounds,
  };
}