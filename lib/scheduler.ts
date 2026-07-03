import type { ScheduledMatch } from "@/types";

/**
 * Sprint 3 - bản đầu:
 * - Nếu đúng 4 người: tạo 6 trận round robin chuẩn
 * - Nếu 5-8 người: tạo lịch xoay vòng đơn giản, công bằng tương đối
 */

export function generateSessionMatches(participantIds: string[]): ScheduledMatch[] {
  const ids = [...participantIds];

  if (ids.length < 4) return [];
  if (ids.length === 4) return generate4PlayerRoundRobin(ids);

  return generateRotationMatches(ids);
}

function generate4PlayerRoundRobin(ids: string[]): ScheduledMatch[] {
  const [a, b, c, d] = ids;

  return [
    { round: 1, teamA: [a, b], teamB: [c, d] },
    { round: 2, teamA: [a, c], teamB: [b, d] },
    { round: 3, teamA: [a, d], teamB: [b, c] },
    { round: 4, teamA: [a, b], teamB: [d, c] },
    { round: 5, teamA: [a, c], teamB: [d, b] },
    { round: 6, teamA: [a, d], teamB: [c, b] },
  ];
}

function generateRotationMatches(ids: string[]): ScheduledMatch[] {
  const matches: ScheduledMatch[] = [];
  const totalRounds = Math.max(4, ids.length); // tạm cho Sprint 3 phase đầu
  let rotation = [...ids];

  for (let round = 1; round <= totalRounds; round++) {
    const playing = rotation.slice(0, 4);

    if (playing.length < 4) break;

    matches.push({
      round,
      teamA: [playing[0], playing[1]],
      teamB: [playing[2], playing[3]],
    });

    rotation = rotate(rotation);
  }

  return matches;
}

function rotate(ids: string[]) {
  if (ids.length <= 1) return ids;
  return [...ids.slice(1), ids[0]];
}