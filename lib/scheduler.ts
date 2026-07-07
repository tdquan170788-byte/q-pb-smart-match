import type { ScheduledMatch } from "@/types";

/**
 * Sprint 6A
 * Scheduler cơ bản cho đánh đôi pickleball.
 *
 * Mục tiêu:
 * - Sinh danh sách trận cho 4 người / 6 người / 8 người
 * - Tương thích type ScheduledMatch mới:
 *   {
 *     round: number;
 *     court: number;
 *     teamA: string[];
 *     teamB: string[];
 *   }
 */

/* =========================================================
   TYPES
========================================================= */

type PlayerId = string;

/* =========================================================
   HELPERS
========================================================= */

function createMatch(
  round: number,
  court: number,
  teamA: PlayerId[],
  teamB: PlayerId[]
): ScheduledMatch {
  return {
    round,
    court,
    teamA,
    teamB,
  };
}

/* =========================================================
   4 PLAYERS
   1 sân / 6 trận vòng đôi chuẩn
========================================================= */

function buildScheduleFor4(playerIds: PlayerId[]): ScheduledMatch[] {
  const [a, b, c, d] = playerIds;

  return [
    createMatch(1, 1, [a, b], [c, d]),
    createMatch(2, 1, [a, c], [b, d]),
    createMatch(3, 1, [a, d], [b, c]),
    createMatch(4, 1, [a, b], [d, c]),
    createMatch(5, 1, [a, c], [d, b]),
    createMatch(6, 1, [a, d], [c, b]),
  ];
}

/* =========================================================
   6 PLAYERS
   Mỗi round chọn 4 người vào sân, 2 người nghỉ.
   Đây là bản xoay tua đơn giản để app chạy ổn định.
========================================================= */

function buildScheduleFor6(playerIds: PlayerId[]): ScheduledMatch[] {
  const [a, b, c, d, e, f] = playerIds;

  return [
    createMatch(1, 1, [a, b], [c, d]), // e,f nghỉ
    createMatch(2, 1, [a, e], [b, f]), // c,d nghỉ
    createMatch(3, 1, [c, e], [d, f]), // a,b nghỉ
    createMatch(4, 1, [a, c], [e, f]), // b,d nghỉ
    createMatch(5, 1, [b, d], [c, e]), // a,f nghỉ
    createMatch(6, 1, [a, f], [b, d]), // c,e nghỉ
  ];
}

/* =========================================================
   8 PLAYERS
   2 sân song song
========================================================= */

function buildScheduleFor8(playerIds: PlayerId[]): ScheduledMatch[] {
  const [a, b, c, d, e, f, g, h] = playerIds;

  return [
    // Round 1
    createMatch(1, 1, [a, b], [c, d]),
    createMatch(1, 2, [e, f], [g, h]),

    // Round 2
    createMatch(2, 1, [a, c], [b, d]),
    createMatch(2, 2, [e, g], [f, h]),

    // Round 3
    createMatch(3, 1, [a, d], [b, c]),
    createMatch(3, 2, [e, h], [f, g]),

    // Round 4
    createMatch(4, 1, [a, e], [b, f]),
    createMatch(4, 2, [c, g], [d, h]),

    // Round 5
    createMatch(5, 1, [a, f], [c, e]),
    createMatch(5, 2, [b, h], [d, g]),

    // Round 6
    createMatch(6, 1, [a, g], [d, e]),
    createMatch(6, 2, [b, c], [f, h]),
  ];
}

/* =========================================================
   PUBLIC API
========================================================= */

export function generateSchedule(playerIds: PlayerId[]): ScheduledMatch[] {
  const normalized = Array.from(new Set(playerIds.filter(Boolean)));

  if (normalized.length < 4) return [];

  if (normalized.length === 4) {
    return buildScheduleFor4(normalized);
  }

  if (normalized.length === 6) {
    return buildScheduleFor6(normalized);
  }

  if (normalized.length >= 8) {
    return buildScheduleFor8(normalized.slice(0, 8));
  }

  // fallback cho 5 hoặc 7 người:
  // tạm lấy 4 người đầu để app không vỡ build
  return buildScheduleFor4(normalized.slice(0, 4));
}