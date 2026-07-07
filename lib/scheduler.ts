import type { Player } from "@/types";

/* =========================================================
   TYPES
========================================================= */

export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};

export type SessionRound = {
  round: number;
  matches: ScheduledMatch[];
};

export type SessionSchedule = {
  rounds: SessionRound[];
  restingPlayerIdsByRound: Record<number, string[]>;
  totalRounds: number;
};

type PairKey = string;

/* =========================================================
   HELPERS
========================================================= */

function makePairKey(a: string, b: string) {
  return [a, b].sort().join("__");
}

function makeTeamKey(team: string[]) {
  return [...team].sort().join("__");
}

function chunkArray<T>(arr: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function rotateArray<T>(arr: T[], startIndex: number) {
  if (arr.length === 0) return [];
  const normalized = ((startIndex % arr.length) + arr.length) % arr.length;
  return [...arr.slice(normalized), ...arr.slice(0, normalized)];
}

function countSharedPlayers(a: string[], b: string[]) {
  const setB = new Set(b);
  return a.filter((id) => setB.has(id)).length;
}

/* =========================================================
   GENERATE TEAM CANDIDATES
========================================================= */

function generateAllTeams(playerIds: string[]) {
  const teams: string[][] = [];

  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      teams.push([playerIds[i], playerIds[j]]);
    }
  }

  return teams;
}

function buildPairCountMap(
  previousRounds: SessionRound[]
): Record<PairKey, number> {
  const pairCount: Record<PairKey, number> = {};

  for (const round of previousRounds) {
    for (const match of round.matches) {
      const teamAKey = makePairKey(match.teamA[0], match.teamA[1]);
      const teamBKey = makePairKey(match.teamB[0], match.teamB[1]);

      pairCount[teamAKey] = (pairCount[teamAKey] ?? 0) + 1;
      pairCount[teamBKey] = (pairCount[teamBKey] ?? 0) + 1;
    }
  }

  return pairCount;
}

function buildPlayCountMap(previousRounds: SessionRound[]) {
  const playCount: Record<string, number> = {};

  for (const round of previousRounds) {
    for (const match of round.matches) {
      for (const playerId of [...match.teamA, ...match.teamB]) {
        playCount[playerId] = (playCount[playerId] ?? 0) + 1;
      }
    }
  }

  return playCount;
}

/* =========================================================
   BUILD ONE ROUND
========================================================= */

function buildOneRound(
  playerIds: string[],
  roundNumber: number,
  previousRounds: SessionRound[]
): {
  round: SessionRound;
  restingPlayerIds: string[];
} {
  const playerCount = playerIds.length;

  if (playerCount < 4) {
    return {
      round: {
        round: roundNumber,
        matches: [],
      },
      restingPlayerIds: [...playerIds],
    };
  }

  const courts = Math.floor(playerCount / 4);
  const activePlayerCount = courts * 4;
  const restCount = playerCount - activePlayerCount;

  const playCount = buildPlayCountMap(previousRounds);

  const sortedByLeastPlay = [...playerIds].sort((a, b) => {
    const diff = (playCount[a] ?? 0) - (playCount[b] ?? 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const restingPlayerIds =
    restCount > 0 ? sortedByLeastPlay.slice(0, restCount) : [];

  const availablePlayers = playerIds.filter((id) => !restingPlayerIds.includes(id));

  const pairCountMap = buildPairCountMap(previousRounds);
  const allTeams = generateAllTeams(availablePlayers);

  const usedPlayers = new Set<string>();
  const chosenMatches: ScheduledMatch[] = [];
  const usedTeamKeys = new Set<string>();

  // sắp team ưu tiên cặp chưa đi cùng nhau nhiều
  const sortedTeams = [...allTeams].sort((teamA, teamB) => {
    const keyA = makePairKey(teamA[0], teamA[1]);
    const keyB = makePairKey(teamB[0], teamB[1]);

    const pairA = pairCountMap[keyA] ?? 0;
    const pairB = pairCountMap[keyB] ?? 0;

    if (pairA !== pairB) return pairA - pairB;
    return keyA.localeCompare(keyB);
  });

  for (const teamA of sortedTeams) {
    if (chosenMatches.length >= courts) break;

    if (teamA.some((id) => usedPlayers.has(id))) continue;

    const teamAKey = makeTeamKey(teamA);
    if (usedTeamKeys.has(teamAKey)) continue;

    let bestOpponent: string[] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const teamB of sortedTeams) {
      if (teamA === teamB) continue;
      if (teamB.some((id) => usedPlayers.has(id))) continue;

      const teamBKey = makeTeamKey(teamB);
      if (usedTeamKeys.has(teamBKey)) continue;

      if (countSharedPlayers(teamA, teamB) > 0) continue;

      const pairAKey = makePairKey(teamA[0], teamA[1]);
      const pairBKey = makePairKey(teamB[0], teamB[1]);

      const pairScore =
        (pairCountMap[pairAKey] ?? 0) + (pairCountMap[pairBKey] ?? 0);

      const teamAPlay = (playCount[teamA[0]] ?? 0) + (playCount[teamA[1]] ?? 0);
      const teamBPlay = (playCount[teamB[0]] ?? 0) + (playCount[teamB[1]] ?? 0);

      const balanceScore = Math.abs(teamAPlay - teamBPlay);

      const totalScore = pairScore * 100 + balanceScore;

      if (totalScore < bestScore) {
        bestScore = totalScore;
        bestOpponent = teamB;
      }
    }

    if (!bestOpponent) continue;

    const court = chosenMatches.length + 1;

    chosenMatches.push({
      round: roundNumber,
      court,
      teamA,
      teamB: bestOpponent,
    });

    for (const playerId of [...teamA, ...bestOpponent]) {
      usedPlayers.add(playerId);
    }

    usedTeamKeys.add(teamAKey);
    usedTeamKeys.add(makeTeamKey(bestOpponent));
  }

  return {
    round: {
      round: roundNumber,
      matches: chosenMatches,
    },
    restingPlayerIds,
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

/**
 * Scheduler thông minh cho Sprint 6B/6C
 * - 4 người  -> 4 round
 * - 5-7 người -> 6 round
 * - 8+ người -> 8 round
 */
export function buildSessionSchedule(playerIds: string[]): SessionSchedule {
  const cleanPlayerIds = [...new Set(playerIds)].filter(Boolean);

  if (cleanPlayerIds.length < 4) {
    return {
      rounds: [],
      restingPlayerIdsByRound: {},
      totalRounds: 0,
    };
  }

  let totalRounds = 4;

  if (cleanPlayerIds.length >= 5 && cleanPlayerIds.length <= 7) {
    totalRounds = 6;
  } else if (cleanPlayerIds.length >= 8) {
    totalRounds = 8;
  }

  const rounds: SessionRound[] = [];
  const restingPlayerIdsByRound: Record<number, string[]> = {};

  // xoay danh sách đầu vào mỗi round để tăng độ đa dạng
  for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber++) {
    const rotatedPlayers = rotateArray(cleanPlayerIds, roundNumber - 1);

    const { round, restingPlayerIds } = buildOneRound(
      rotatedPlayers,
      roundNumber,
      rounds
    );

    rounds.push(round);
    restingPlayerIdsByRound[roundNumber] = restingPlayerIds;
  }

  return {
    rounds,
    restingPlayerIdsByRound,
    totalRounds,
  };
}

/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

/**
 * Giữ tương thích với code cũ nếu đâu đó còn gọi generateSchedule()
 */
export function generateSchedule(players: Player[]) {
  const playerIds = players.map((p) => p.id);
  const schedule = buildSessionSchedule(playerIds);

  return schedule.rounds.flatMap((round) =>
    round.matches.map((match) => ({
      round: match.round,
      court: match.court,
      teamA: match.teamA,
      teamB: match.teamB,
    }))
  );
}