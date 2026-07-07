import type { GeneratedSchedule, ScheduleRound, ScheduledMatch } from "@/types";

/* =========================================================
   Sprint 6A - Match Generator
   Mục tiêu:
   - Tạo lịch đấu đề xuất cho 4 -> 16 người
   - Mỗi trận là 2v2
   - Mỗi round có thể có nhiều sân
   - Nếu lẻ người thì có byePlayerIds
========================================================= */

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function rotateLeft<T>(arr: T[], offset: number) {
  if (arr.length === 0) return [];
  const n = ((offset % arr.length) + arr.length) % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

function pairSequential(playerIds: string[]): string[][] {
  const pairs: string[][] = [];
  for (let i = 0; i + 1 < playerIds.length; i += 2) {
    pairs.push([playerIds[i], playerIds[i + 1]]);
  }
  return pairs;
}

function buildRoundFromActivePlayers(
  round: number,
  activePlayerIds: string[]
): ScheduleRound {
  const pairs = pairSequential(activePlayerIds);
  const matches: ScheduledMatch[] = [];

  let court = 1;
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    matches.push({
      round,
      court,
      teamA: pairs[i],
      teamB: pairs[i + 1],
    });
    court += 1;
  }

  return {
    round,
    matches,
    byePlayerIds: [],
  };
}

/**
 * Chọn người nghỉ cho round hiện tại:
 * - ưu tiên người chưa nghỉ lần nào
 * - nếu bằng nhau thì lấy theo thứ tự xuất hiện
 */
function pickByePlayers(
  playerIds: string[],
  byeCount: number,
  byeCounter: Map<string, number>,
  offset = 0
): string[] {
  const rotated = rotateLeft(playerIds, offset);

  return rotated
    .slice()
    .sort((a, b) => {
      const ca = byeCounter.get(a) ?? 0;
      const cb = byeCounter.get(b) ?? 0;
      if (ca !== cb) return ca - cb;
      return 0;
    })
    .slice(0, byeCount);
}

/**
 * Tạo lịch đấu cơ bản:
 * - 4 người => 1 sân / round
 * - 8 người => 2 sân / round
 * - 12 người => 3 sân / round
 * - 16 người => 4 sân / round
 * - số lẻ / không chia hết cho 4 => sẽ có người nghỉ
 */
export function generateSessionSchedule(
  participantIds: string[],
  requestedRounds?: number
): GeneratedSchedule {
  const players = unique(participantIds).filter(Boolean);
  const totalPlayers = players.length;

  if (totalPlayers < 4) {
    return {
      totalPlayers,
      totalRounds: 0,
      rounds: [],
    };
  }

  /**
   * Số round mặc định:
   * - 4 -> 6 người: 3 round
   * - 7 -> 10 người: 4 round
   * - 11 -> 16 người: 5 round
   */
  const totalRounds =
    requestedRounds ??
    (totalPlayers <= 6 ? 3 : totalPlayers <= 10 ? 4 : 5);

  const rounds: ScheduleRound[] = [];
  const byeCounter = new Map<string, number>();

  for (const id of players) {
    byeCounter.set(id, 0);
  }

  for (let round = 1; round <= totalRounds; round += 1) {
    const mod = totalPlayers % 4;
    const byeCount = mod === 0 ? 0 : mod;

    const byePlayerIds =
      byeCount > 0
        ? pickByePlayers(players, byeCount, byeCounter, round - 1)
        : [];

    for (const id of byePlayerIds) {
      byeCounter.set(id, (byeCounter.get(id) ?? 0) + 1);
    }

    const activePlayers = players.filter((id) => !byePlayerIds.includes(id));

    /**
     * Mỗi round xoay danh sách để tạo cặp khác nhau
     */
    const rotated = rotateLeft(activePlayers, round - 1);

    const roundData = buildRoundFromActivePlayers(round, rotated);

    rounds.push({
      ...roundData,
      byePlayerIds,
    });
  }

  return {
    totalPlayers,
    totalRounds,
    rounds,
  };
}