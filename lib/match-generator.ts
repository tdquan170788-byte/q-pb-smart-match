import type {
  GeneratedSchedule,
  ScheduleStats,
  ScheduledMatch,
  SessionRound,
} from "@/types";

/* =========================================================
   Sprint 7C - Fair Scheduler
   Goal:
   - 5 -> 8 rounds
   - 6 -> 9 rounds
   - 7 -> 10 rounds
   - 8 -> 10 rounds
   - 9 -> 12 rounds
   - balance matches / rests
   - reduce repeated teammates/opponents
========================================================= */

const ROUND_CONFIG: Record<number, number> = {
  5: 8,
  6: 9,
  7: 10,
  8: 10,
  9: 12,
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

function getTargetRounds(playerCount: number) {
  return ROUND_CONFIG[playerCount] ?? 0;
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

  // 1) ưu tiên người đang ít trận hơn
  const matchCounts = [...teamA, ...teamB].map((id) => stats.matchesByPlayer[id] ?? 0);
  const restCounts = resting.map((id) => stats.restsByPlayer[id] ?? 0);

  score += matchCounts.reduce((sum, n) => sum + n * 20, 0);
  score += restCounts.reduce((sum, n) => sum + n * 18, 0);

  // 2) phạt nếu đồng đội bị lặp
  score += getCounter(teammateCounter, teamA[0], teamA[1]) * 40;
  score += getCounter(teammateCounter, teamB[0], teamB[1]) * 40;

  // 3) phạt nếu đối đầu bị lặp
  for (const a of teamA) {
    for (const b of teamB) {
      score += getCounter(opponentCounter, a, b) * 14;
    }
  }

  // 4) phạt nhẹ nếu 1 người vừa chơi round trước lại chơi tiếp quá nhiều
  const currentPlayers = [...teamA, ...teamB];
  const repeatFromPrev = currentPlayers.filter((id) => previousRoundPlayers.has(id)).length;
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
  const player4 = availablePlayers.slice(0, 4);

  if (availablePlayers.length !== 4) {
    throw new Error("Round 1-court requires exactly 4 active players.");
  }

  const [a, b, c, d] = player4;

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

function buildRoundFor5to7(
  allPlayerIds: string[],
  roundNo: number,
  stats: ScheduleStats,
  teammateCounter: PairCounter,
  opponentCounter: PairCounter,
  previousRoundPlayers: Set<string>
): SessionRound {
  // 5,6,7 người -> 1 sân / 1 match mỗi round
  const restCount = allPlayerIds.length - 4;
  const resting = chooseRestingPlayers(allPlayerIds, restCount, stats);
  const activePlayers = allPlayerIds.filter((id) => !resting.includes(id));

  const match = buildOneMatchRound(
    activePlayers,
    resting,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers
  );

  return {
    round: roundNo,
    restingPlayerIds: resting,
    completed: false,
    matches: [
      {
        id: `r${roundNo}_m1`,
        round: roundNo,
        court: 1,
        teamA: match.teamA,
        teamB: match.teamB,
        restingPlayerIds: resting,
        completed: false,
      },
    ],
  };
}

function buildRoundFor8or9(
  allPlayerIds: string[],
  roundNo: number,
  stats: ScheduleStats,
  teammateCounter: PairCounter,
  opponentCounter: PairCounter,
  previousRoundPlayers: Set<string>
): SessionRound {
  // 8 hoặc 9 người:
  // - 2 sân / 2 match mỗi round
  // - 8 active players
  // - nếu 9 người => 1 người nghỉ
  const restCount = Math.max(0, allPlayerIds.length - 8);
  const resting = chooseRestingPlayers(allPlayerIds, restCount, stats);
  const activePlayers = allPlayerIds.filter((id) => !resting.includes(id));

  if (activePlayers.length !== 8) {
    throw new Error("Round 2-courts requires exactly 8 active players.");
  }

  // Chia 8 người thành 2 nhóm 4 người sao cho cân bằng / ít lặp
  const groupCandidates = combinations(activePlayers, 4);
  let bestGroupA = groupCandidates[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const groupA of groupCandidates) {
    const groupB = activePlayers.filter((id) => !groupA.includes(id));

    const scoreA = groupA.reduce((sum, id) => sum + (stats.matchesByPlayer[id] ?? 0), 0);
    const scoreB = groupB.reduce((sum, id) => sum + (stats.matchesByPlayer[id] ?? 0), 0);

    const balancePenalty = Math.abs(scoreA - scoreB) * 10;

    const prevPenalty =
      groupA.filter((id) => previousRoundPlayers.has(id)).length +
      groupB.filter((id) => previousRoundPlayers.has(id)).length;

    const score = balancePenalty + prevPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestGroupA = groupA;
    }
  }

  const groupA = bestGroupA;
  const groupB = activePlayers.filter((id) => !groupA.includes(id));

  const match1 = buildOneMatchRound(
    groupA,
    resting,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers
  );

  const match2 = buildOneMatchRound(
    groupB,
    resting,
    stats,
    teammateCounter,
    opponentCounter,
    previousRoundPlayers
  );

  return {
    round: roundNo,
    restingPlayerIds: resting,
    completed: false,
    matches: [
      {
        id: `r${roundNo}_m1`,
        round: roundNo,
        court: 1,
        teamA: match1.teamA,
        teamB: match1.teamB,
        restingPlayerIds: [],
        completed: false,
      },
      {
        id: `r${roundNo}_m2`,
        round: roundNo,
        court: 2,
        teamA: match2.teamA,
        teamB: match2.teamB,
        restingPlayerIds: [],
        completed: false,
      },
    ],
  };
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

    incCounter(teammateCounter, match.teamA[0], match.teamA[1]);
    incCounter(teammateCounter, match.teamB[0], match.teamB[1]);

    for (const a of match.teamA) {
      for (const b of match.teamB) {
        incCounter(opponentCounter, a, b);
      }
    }
  }
}

export function buildSessionSchedule(
  sessionId: string,
  participantIds: string[]
): GeneratedSchedule {
  const ids = unique(participantIds).filter(Boolean);

  if (ids.length < 4) {
    return {
      sessionId,
      rounds: [],
      totalRounds: 0,
    };
  }

  const playerCount = ids.length;
  const totalRounds = getTargetRounds(playerCount);

  if (!totalRounds) {
    return {
      sessionId,
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
    let round: SessionRound;

    if (playerCount <= 7) {
      round = buildRoundFor5to7(
        ids,
        roundNo,
        stats,
        teammateCounter,
        opponentCounter,
        previousRoundPlayers
      );
    } else {
      round = buildRoundFor8or9(
        ids,
        roundNo,
        stats,
        teammateCounter,
        opponentCounter,
        previousRoundPlayers
      );
    }

    applyRoundToStats(round, stats, teammateCounter, opponentCounter);

    previousRoundPlayers = new Set(
      round.matches.flatMap((m) => [...m.teamA, ...m.teamB])
    );

    rounds.push(round);
  }

  return {
    sessionId,
    rounds,
    totalRounds,
  };
}