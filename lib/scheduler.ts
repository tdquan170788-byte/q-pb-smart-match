import type { ScheduledMatch } from "@/types";

/**
 * Sprint 3 - scheduler đơn giản cho 4 người:
 * tạo 6 trận xoay vòng đôi cơ bản.
 *
 * Input: mảng 4 playerId
 * Output: danh sách ScheduledMatch
 */
export function generateRoundRobinSchedule(
  playerIds: string[]
): ScheduledMatch[] {
  if (playerIds.length !== 4) return [];

  const [a, b, c, d] = playerIds;

  return [
    { round: 1, teamA: [a, b], teamB: [c, d] },
    { round: 2, teamA: [a, c], teamB: [b, d] },
    { round: 3, teamA: [a, d], teamB: [b, c] },
    { round: 4, teamA: [a, b], teamB: [d, c] },
    { round: 5, teamA: [a, c], teamB: [d, b] },
    { round: 6, teamA: [a, d], teamB: [c, b] },
  ];
}