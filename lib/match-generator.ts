import type {
  GeneratedSchedule,
  ScheduleRound,
  ScheduledMatch,
} from "@/types";

/* =========================================================
   Sprint 7B - Match Generator
========================================================= */

function rotate<T>(arr: T[], shift: number) {
  const n = arr.length;
  if (n === 0) return arr;
  const s = ((shift % n) + n) % n;
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

function schedule4(ids: string[]): GeneratedSchedule {
  const [a, b, c, d] = ids;

  const rounds: ScheduleRound[] = [
    {
      round: 1,
      matches: [makeMatch(1, 1, [a, b], [c, d])],
    },
    {
      round: 2,
      matches: [makeMatch(2, 1, [a, c], [b, d])],
    },
    {
      round: 3,
      matches: [makeMatch(3, 1, [a, d], [b, c])],
    },
    {
      round: 4,
      matches: [makeMatch(4, 1, [a, b], [d, c])],
    },
    {
      round: 5,
      matches: [makeMatch(5, 1, [a, c], [d, b])],
    },
    {
      round: 6,
      matches: [makeMatch(6, 1, [a, d], [c, b])],
    },
  ];

  return { rounds };
}

function schedule5(ids: string[]): GeneratedSchedule {
  const rounds: ScheduleRound[] = [];

  for (let r = 0; r < 5; r++) {
    const arr = rotate(ids, r);
    const playing = arr.slice(0, 4);
    const [a, b, c, d] = playing;

    rounds.push({
      round: r + 1,
      matches: [makeMatch(r + 1, 1, [a, b], [c, d])],
    });
  }

  return { rounds };
}

function schedule6Plus(ids: string[]): GeneratedSchedule {
  const rounds: ScheduleRound[] = [];
  const totalRounds = Math.max(ids.length, 6);

  for (let r = 0; r < totalRounds; r++) {
    const arr = rotate(ids, r);

    const matches: ScheduledMatch[] = [];

    if (arr.length >= 4) {
      matches.push(makeMatch(r + 1, 1, [arr[0], arr[1]], [arr[2], arr[3]]));
    }

    if (arr.length >= 8) {
      matches.push(makeMatch(r + 1, 2, [arr[4], arr[5]], [arr[6], arr[7]]));
    } else if (arr.length >= 6) {
      matches.push(makeMatch(r + 1, 2, [arr[2], arr[4]], [arr[3], arr[5]]));
    }

    rounds.push({
      round: r + 1,
      matches,
    });
  }

  return { rounds };
}

export function buildSessionSchedule(participantIds: string[]): GeneratedSchedule {
  const ids = participantIds.filter(Boolean);

  if (ids.length < 4) {
    return { rounds: [] };
  }

  if (ids.length === 4) return schedule4(ids);
  if (ids.length === 5) return schedule5(ids);

  return schedule6Plus(ids);
}