import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionRecord,
} from "@/types";
import { getMatches } from "@/lib/storage";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function rotateRoundRobin(playerIds: string[]): string[][] {
  if (playerIds.length < 2) return [];

  const ids = [...playerIds];
  const hasBye = ids.length % 2 === 1;

  if (hasBye) ids.push("__BYE__");

  const rounds: string[][] = [];
  const total = ids.length;
  const half = total / 2;

  let current = [...ids];

  for (let round = 0; round < total - 1; round += 1) {
    const pairings: string[] = [];

    for (let i = 0; i < half; i += 1) {
      const a = current[i];
      const b = current[total - 1 - i];
      pairings.push(`${a}|${b}`);
    }

    rounds.push(pairings);

    const fixed = current[0];
    const rest = current.slice(1);
    rest.unshift(rest.pop()!);
    current = [fixed, ...rest];
  }

  return rounds;
}

/**
 * NORMAL MODE
 * - Ghép 1v1 theo round-robin
 * - Sau đó gom 2 trận đơn thành 1 trận đôi nếu đủ 4 người
 * - courtCount dùng để cắt số match mỗi round
 */
export function generateNormalSchedule(session: SessionRecord): GeneratedSchedule {
  const participants = [...session.participantIds];
  const courtCount = session.courtCount ?? 1;

  if (participants.length < 4) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const rr = rotateRoundRobin(participants);
  const rounds: GeneratedRound[] = [];

  rr.forEach((pairings, roundIndex) => {
    const validPairs = pairings
      .map((pair) => pair.split("|"))
      .filter(([a, b]) => a !== "__BYE__" && b !== "__BYE__");

    const matches: ScheduledMatch[] = [];
    const restingPlayerIds = new Set<string>();

    // ghép 2 cặp đơn => 1 trận teamA 2 người vs teamB 2 người
    const grouped = chunkArray(validPairs, 2);

    let court = 1;
    for (const group of grouped) {
      if (court > courtCount) break;
      if (group.length < 2) {
        // thiếu 1 cặp thì cho nghỉ
        group.flat().forEach((id) => restingPlayerIds.add(id));
        continue;
      }

      const [pair1, pair2] = group;
      matches.push({
        round: roundIndex + 1,
        court,
        teamA: [pair1[0], pair1[1]],
        teamB: [pair2[0], pair2[1]],
      });

      court += 1;
    }

    // player nào không nằm trong match round này thì coi là nghỉ
    const playingIds = new Set(matches.flatMap((m) => [...m.teamA, ...m.teamB]));
    participants.forEach((id) => {
      if (!playingIds.has(id)) restingPlayerIds.add(id);
    });

    if (matches.length > 0) {
      rounds.push({
        round: roundIndex + 1,
        matches,
        restingPlayerIds: [...restingPlayerIds],
      });
    }
  });

  return {
    sessionId: session.id,
    totalRounds: rounds.length,
    rounds,
  };
}

/**
 * TEAM MODE
 * - 2 đội cố định từ session.teamConfig
 * - Mỗi round: team A vs team B
 * - Nếu nhiều court thì vẫn lặp cùng cặp đội theo court
 */
export function generateTeamSchedule(session: SessionRecord): GeneratedSchedule {
  const courtCount = session.courtCount ?? 1;
  const teamA = session.teamConfig?.teamAPlayerIds ?? [];
  const teamB = session.teamConfig?.teamBPlayerIds ?? [];

  if (teamA.length === 0 || teamB.length === 0) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  // mặc định 5 round cho team mode
  const totalRounds = 5;

  const rounds: GeneratedRound[] = Array.from({ length: totalRounds }).map(
    (_, idx) => {
      const matches: ScheduledMatch[] = [];

      for (let court = 1; court <= courtCount; court += 1) {
        matches.push({
          round: idx + 1,
          court,
          teamA: [...teamA],
          teamB: [...teamB],
        });
      }

      return {
        round: idx + 1,
        matches,
        restingPlayerIds: [],
      };
    }
  );

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

export function generateScheduleForSession(
  session: SessionRecord
): GeneratedSchedule {
  if ((session.mode ?? "normal") === "team") {
    return generateTeamSchedule(session);
  }
  return generateNormalSchedule(session);
}

export function getSessionMatches(sessionId: string) {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return (a.court ?? 1) - (b.court ?? 1);
    });
}