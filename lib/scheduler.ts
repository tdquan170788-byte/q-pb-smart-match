import type { ScheduledMatch } from "@/types";

/**
 * Sprint 6A
 * - Scheduler đơn giản cho 4–8 người
 * - Mỗi round tạo 1 trận 2v2
 * - Có court mặc định = 1
 */

function rotateArray<T>(arr: T[], step: number) {
  if (arr.length === 0) return arr;
  const s = step % arr.length;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

function makeMatch(
  round: number,
  court: number,
  teamA: string[],
  teamB: string[]
): ScheduledMatch {
  return { round, court, teamA, teamB };
}

function scheduleFor4(ids: string[]): ScheduledMatch[] {
  const [a, b, c, d] = ids;

  return [
    makeMatch(1, 1, [a, b], [c, d]),
    makeMatch(2, 1, [a, c], [b, d]),
    makeMatch(3, 1, [a, d], [b, c]),
    makeMatch(4, 1, [a, b], [d, c]),
  ];
}

function scheduleGeneric(ids: string[]): ScheduledMatch[] {
  const players = [...ids];
  const rounds = Math.max(4, players.length);
  const matches: ScheduledMatch[] = [];

  for (let round = 1; round <= rounds; round++) {
    const rotated = rotateArray(players, round - 1);

    const p1 = rotated[0];
    const p2 = rotated[1];
    const p3 = rotated[2];
    const p4 = rotated[3];

    if (!p1 || !p2 || !p3 || !p4) continue;

    matches.push(makeMatch(round, 1, [p1, p2], [p3, p4]));
  }

  return matches;
}

export function generateSchedule(playerIds: string[]): ScheduledMatch[] {
  const ids = [...playerIds];

  if (ids.length < 4) return [];
  if (ids.length === 4) return scheduleFor4(ids);

  return scheduleGeneric(ids);
}