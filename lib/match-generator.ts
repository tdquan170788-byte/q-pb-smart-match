import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";

function pairSequential(ids: string[], round: number, courtCount: number) {
  const players = [...ids];
  const matches: ScheduledMatch[] = [];
  const restingPlayerIds: string[] = [];

  const maxPlayersCanPlay = courtCount * 4;
  const activePlayers = players.slice(0, maxPlayersCanPlay);
  const restPlayers = players.slice(maxPlayersCanPlay);
  restingPlayerIds.push(...restPlayers);

  for (let i = 0; i + 3 < activePlayers.length; i += 4) {
    const group = activePlayers.slice(i, i + 4);
    matches.push({
      round,
      court: Math.floor(i / 4) + 1,
      teamA: [group[0], group[1]],
      teamB: [group[2], group[3]],
    });
  }

  const leftover = activePlayers.length % 4;
  if (leftover > 0) {
    const left = activePlayers.slice(activePlayers.length - leftover);
    restingPlayerIds.push(...left);
  }

  return { matches, restingPlayerIds };
}

function rotateArray<T>(arr: T[], shift: number): T[] {
  if (arr.length === 0) return [];
  const s = ((shift % arr.length) + arr.length) % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

function buildNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const participantIds = [...session.participantIds];
  const courtCount = Math.max(1, session.courtCount ?? 1);

  if (participantIds.length < 4) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const totalRounds = Math.max(1, participantIds.length - 1);
  const rounds: GeneratedRound[] = [];

  for (let round = 1; round <= totalRounds; round += 1) {
    const rotated = rotateArray(participantIds, round - 1);
    const result = pairSequential(rotated, round, courtCount);

    rounds.push({
      round,
      matches: result.matches,
      restingPlayerIds: result.restingPlayerIds,
    });
  }

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

function buildTeamSchedule(session: SessionRecord): GeneratedSchedule {
  const courtCount = Math.max(1, session.courtCount ?? 1);
  const teamA = session.teamConfig?.teamAPlayerIds ?? [];
  const teamB = session.teamConfig?.teamBPlayerIds ?? [];

  if (teamA.length < 2 || teamB.length < 2) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const rounds: GeneratedRound[] = [];
  const totalRounds = Math.max(teamA.length, teamB.length);

  for (let round = 1; round <= totalRounds; round += 1) {
    const a = rotateArray(teamA, round - 1);
    const b = rotateArray(teamB, round - 1);

    const matches: ScheduledMatch[] = [];
    const restingPlayerIds: string[] = [];

    const maxMatches = courtCount;
    for (let court = 1; court <= maxMatches; court += 1) {
      const idx = (court - 1) * 2;
      if (idx + 1 >= a.length || idx + 1 >= b.length) break;

      matches.push({
        round,
        court,
        teamA: [a[idx], a[idx + 1]],
        teamB: [b[idx], b[idx + 1]],
      });
    }

    const used = new Set(matches.flatMap((m) => [...m.teamA, ...m.teamB]));
    for (const id of [...teamA, ...teamB]) {
      if (!used.has(id)) restingPlayerIds.push(id);
    }

    rounds.push({
      round,
      matches,
      restingPlayerIds,
    });
  }

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

export function buildSessionSchedule(session: SessionRecord): GeneratedSchedule {
  const mode = session.mode ?? "normal";
  if (mode === "team") {
    return buildTeamSchedule(session);
  }
  return buildNormalSchedule(session);
}