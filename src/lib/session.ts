import type {
  GeneratedRound,
  GeneratedSchedule,
  ScheduledMatch,
  SessionMode,
  SessionRecord,
} from "@/types";
import { getMatches } from "@/lib/storage";

/* =========================================================
   Helpers
========================================================= */

const BYE = "__BYE__";

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((id, idx) => id === bb[idx]);
}

/**
 * Round robin pairing cho danh sách người chơi.
 * Nếu số người lẻ -> thêm BYE.
 *
 * Output:
 * [
 *   [ ["p1","p8"], ["p2","p7"], ... ], // round 1
 *   [ ["p1","p7"], ["p8","p6"], ... ], // round 2
 * ]
 */
function buildRoundRobinPairs(memberIds: string[]): string[][][] {
  if (memberIds.length < 2) return [];

  const ids = [...memberIds];
  if (ids.length % 2 === 1) {
    ids.push(BYE);
  }

  const total = ids.length;
  const half = total / 2;
  const rounds: string[][][] = [];

  let current = [...ids];

  for (let round = 0; round < total - 1; round += 1) {
    const pairs: string[][] = [];

    for (let i = 0; i < half; i += 1) {
      const a = current[i];
      const b = current[total - 1 - i];
      pairs.push([a, b]);
    }

    rounds.push(pairs);

    // rotate giữ cố định phần tử đầu
    const fixed = current[0];
    const rest = current.slice(1);
    rest.unshift(rest.pop()!);
    current = [fixed, ...rest];
  }

  return rounds;
}

/* =========================================================
   NORMAL MODE
========================================================= */

/**
 * Ý tưởng:
 * - Dùng round robin để tạo các cặp 2 người
 * - Sau đó ghép 2 cặp => 1 trận pickleball đôi
 * - Nếu thiếu cặp cuối thì những người đó nghỉ
 *
 * Ví dụ:
 * pair round = [ [A,B], [C,D], [E,F], [G,H] ]
 * => match1: [A,B] vs [C,D]
 * => match2: [E,F] vs [G,H]
 */
export function generateNormalSchedule(
  session: SessionRecord
): GeneratedSchedule {
  const participantIds = [...session.participantIds];
  const courtCount = Math.max(1, session.courtCount ?? 1);

  if (participantIds.length < 4) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const rrRounds = buildRoundRobinPairs(participantIds);
  const generatedRounds: GeneratedRound[] = [];

  rrRounds.forEach((pairRound, roundIndex) => {
    const validPairs = pairRound.filter(
      ([a, b]) => a !== BYE && b !== BYE
    );

    const pairGroups = chunkArray(validPairs, 2);

    const matches: ScheduledMatch[] = [];
    const resting = new Set<string>();

    let court = 1;

    for (const group of pairGroups) {
      if (court > courtCount) {
        // vượt số sân => những người trong group này nghỉ
        group.flat().forEach((id) => resting.add(id));
        continue;
      }

      if (group.length < 2) {
        // lẻ 1 cặp => nghỉ
        group.flat().forEach((id) => resting.add(id));
        continue;
      }

      const [pair1, pair2] = group;

      matches.push({
        round: roundIndex + 1,
        court,
        teamA: [...pair1],
        teamB: [...pair2],
      });

      court += 1;
    }

    // Ai không nằm trong match của round này => nghỉ
    const playingIds = new Set(
      matches.flatMap((m) => [...m.teamA, ...m.teamB])
    );

    participantIds.forEach((id) => {
      if (!playingIds.has(id)) resting.add(id);
    });

    if (matches.length > 0) {
      generatedRounds.push({
        round: roundIndex + 1,
        matches,
        restingPlayerIds: [...resting],
      });
    }
  });

  return {
    sessionId: session.id,
    totalRounds: generatedRounds.length,
    rounds: generatedRounds,
  };
}

/* =========================================================
   TEAM MODE
========================================================= */

/**
 * Team mode:
 * - 2 đội cố định từ session.teamConfig
 * - Mặc định sinh 5 round
 * - Mỗi round tạo match teamA vs teamB
 * - Nếu nhiều court thì lặp số court tương ứng
 */
export function generateTeamSchedule(
  session: SessionRecord
): GeneratedSchedule {
  const courtCount = Math.max(1, session.courtCount ?? 1);

  const teamA = session.teamConfig?.teamAMemberIds ?? [];
  const teamB = session.teamConfig?.teamBMemberIds ?? [];

  if (teamA.length === 0 || teamB.length === 0) {
    return {
      sessionId: session.id,
      totalRounds: 0,
      rounds: [],
    };
  }

  const totalRounds = 5;

  const rounds: GeneratedRound[] = Array.from({
    length: totalRounds,
  }).map((_, idx) => {
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
  });

  return {
    sessionId: session.id,
    totalRounds,
    rounds,
  };
}

/* =========================================================
   MAIN SCHEDULER
========================================================= */

export function generateScheduleForSession(
  session: SessionRecord
): GeneratedSchedule {
  const mode: SessionMode = session.mode ?? "normal";

  if (mode === "team") {
    return generateTeamSchedule(session);
  }

  return generateNormalSchedule(session);
}

/* =========================================================
   MATCH HELPERS
========================================================= */

export function getSessionMatches(sessionId: string) {
  return getMatches()
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => {
      if (a.round !== b.round) return a.round - b.round;
      return (a.court ?? 1) - (b.court ?? 1);
    });
}

/**
 * Tìm match đã lưu trong 1 session theo round/court/team
 * Dùng cho page session detail để map score vào UI
 */
export function findSavedMatch(params: {
  sessionId: string;
  round: number;
  court?: number;
  teamA: string[];
  teamB: string[];
}) {
  const { sessionId, round, court = 1, teamA, teamB } = params;

  return getMatches().find(
    (m) =>
      m.sessionId === sessionId &&
      m.round === round &&
      (m.court ?? 1) === court &&
      sameIds(m.teamA.memberIds, teamA) &&
      sameIds(m.teamB.memberIds, teamB)
  );
}