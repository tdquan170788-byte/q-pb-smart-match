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
  restingMemberIdsByRound: Record<number, string[]>;
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

function generateAllTeams(memberIds: string[]) {
  const teams: string[][] = [];

  for (let i = 0; i < memberIds.length; i += 1) {
    for (let j = i + 1; j < memberIds.length; j += 1) {
      teams.push([memberIds[i], memberIds[j]]);
    }
  }

  return teams;
}

function buildPairCountMap(previousRounds: SessionRound[]): Record<PairKey, number> {
  const pairCount: Record<PairKey, number> = {};

  for (const round of previousRounds) {
    for (const match of round.matches) {
      if (match.teamA.length >= 2) {
        const teamAKey = makePairKey(match.teamA[0], match.teamA[1]);
        pairCount[teamAKey] = (pairCount[teamAKey] ?? 0) + 1;
      }

      if (match.teamB.length >= 2) {
        const teamBKey = makePairKey(match.teamB[0], match.teamB[1]);
        pairCount[teamBKey] = (pairCount[teamBKey] ?? 0) + 1;
      }
    }
  }

  return pairCount;
}

function buildPlayCountMap(previousRounds: SessionRound[]) {
  const playCount: Record<string, number> = {};

  for (const round of previousRounds) {
    for (const match of round.matches) {
      for (const memberId of [...match.teamA, ...match.teamB]) {
        playCount[memberId] = (playCount[memberId] ?? 0) + 1;
      }
    }
  }

  return playCount;
}

/* =========================================================
   BUILD ONE ROUND
========================================================= */

function buildOneRound(
  memberIds: string[],
  roundNumber: number,
  previousRounds: SessionRound[]
): {
  round: SessionRound;
  restingMemberIds: string[];
} {
  const memberCount = memberIds.length;

  if (memberCount < 4) {
    return {
      round: {
        round: roundNumber,
        matches: [],
      },
      restingMemberIds: [...memberIds],
    };
  }

  const courts = Math.floor(memberCount / 4);
  const activeMemberCount = courts * 4;
  const restCount = Math.max(0, memberCount - activeMemberCount);

  const playCount = buildPlayCountMap(previousRounds);

  const sortedByLeastPlay = [...memberIds].sort((a, b) => {
    const diff = (playCount[a] ?? 0) - (playCount[b] ?? 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const restingMemberIds =
    restCount > 0 ? sortedByLeastPlay.slice(0, restCount) : [];

  const availableMembers = memberIds.filter(
    (id) => !restingMemberIds.includes(id)
  );

  const pairCountMap = buildPairCountMap(previousRounds);
  const allTeams = generateAllTeams(availableMembers);

  const usedMembers = new Set<string>();
  const chosenMatches: ScheduledMatch[] = [];
  const usedTeamKeys = new Set<string>();

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
    if (teamA.some((id) => usedMembers.has(id))) continue;

    const teamAKey = makeTeamKey(teamA);
    if (usedTeamKeys.has(teamAKey)) continue;

    let bestOpponent: string[] | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const teamB of sortedTeams) {
      if (teamA === teamB) continue;
      if (teamB.some((id) => usedMembers.has(id))) continue;

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

    for (const memberId of [...teamA, ...bestOpponent]) {
      usedMembers.add(memberId);
    }

    usedTeamKeys.add(teamAKey);
    usedTeamKeys.add(makeTeamKey(bestOpponent));
  }

  const matchedMemberIds = new Set(
    chosenMatches.flatMap((match) => [...match.teamA, ...match.teamB])
  );

  const extraResting = availableMembers.filter(
    (id) => !matchedMemberIds.has(id)
  );

  return {
    round: {
      round: roundNumber,
      matches: chosenMatches,
    },
    restingMemberIds: [...restingMemberIds, ...extraResting],
  };
}

/* =========================================================
   PUBLIC API
========================================================= */

export function buildSessionSchedule(memberIds: string[]): SessionSchedule {
  const cleanMemberIds = [...new Set(memberIds)].filter(Boolean);

  if (cleanMemberIds.length < 4) {
    return {
      rounds: [],
      restingMemberIdsByRound: {},
      totalRounds: 0,
    };
  }

  let totalRounds = 4;

  if (cleanMemberIds.length >= 5 && cleanMemberIds.length <= 7) {
    totalRounds = 6;
  } else if (cleanMemberIds.length >= 8) {
    totalRounds = 8;
  }

  const rounds: SessionRound[] = [];
  const restingMemberIdsByRound: Record<number, string[]> = {};

  for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber += 1) {
    const rotatedMembers = rotateArray(cleanMemberIds, roundNumber - 1);

    const { round, restingMemberIds } = buildOneRound(
      rotatedMembers,
      roundNumber,
      rounds
    );

    rounds.push(round);
    restingMemberIdsByRound[roundNumber] = restingMemberIds;
  }

  return {
    rounds,
    restingMemberIdsByRound,
    totalRounds,
  };
}

/* =========================================================
   BACKWARD COMPATIBILITY
========================================================= */

export function generateSchedule(players: Player[]) {
  const memberIds = players.map((p) => p.id);
  const schedule = buildSessionSchedule(memberIds);

  return schedule.rounds.flatMap((round) =>
    round.matches.map((match) => ({
      round: match.round,
      court: match.court,
      teamA: match.teamA,
      teamB: match.teamB,
    }))
  );
}
