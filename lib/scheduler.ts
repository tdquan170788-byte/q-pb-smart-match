import type { ScheduledMatch } from "@/types";

/**
 * Sprint 6B - Smart Scheduler
 *
 * Mục tiêu:
 * - Hỗ trợ tốt 4 -> 9 người
 * - 7 người không còn bị cố định 4 round
 * - Mỗi round = 1 sân = 4 người chơi
 * - Tự tăng số round theo số người
 * - Dễ build, dễ đọc, dễ nâng cấp tiếp
 */

/* =========================================================
   PUBLIC API
========================================================= */

export function generateSchedule(playerIds: string[]): ScheduledMatch[] {
  const ids = [...playerIds].filter(Boolean);

  if (ids.length < 4) return [];

  // Trường hợp đúng 4 người: dùng preset đẹp, đủ 4 round
  if (ids.length === 4) {
    return buildFourPlayerPreset(ids);
  }

  // 5+ người: dùng smart rotation
  return buildSmartRotation(ids);
}

/* =========================================================
   SMART ROTATION CONFIG
========================================================= */

function getRecommendedRounds(playerCount: number): number {
  if (playerCount <= 4) return 4;
  if (playerCount === 5) return 5;
  if (playerCount === 6) return 6;
  if (playerCount === 7) return 7;
  if (playerCount === 8) return 8;
  if (playerCount >= 9) return 9;

  return Math.max(4, playerCount);
}

/* =========================================================
   4-PLAYER PRESET
========================================================= */

function buildFourPlayerPreset(playerIds: string[]): ScheduledMatch[] {
  const [a, b, c, d] = playerIds;

  return [
    {
      round: 1,
      court: 1,
      teamA: [a, b],
      teamB: [c, d],
    },
    {
      round: 2,
      court: 1,
      teamA: [a, c],
      teamB: [b, d],
    },
    {
      round: 3,
      court: 1,
      teamA: [a, d],
      teamB: [b, c],
    },
    {
      round: 4,
      court: 1,
      teamA: [a, b],
      teamB: [d, c],
    },
  ];
}

/* =========================================================
   SMART ROTATION FOR 5-9 PLAYERS
========================================================= */

/**
 * Ý tưởng:
 * - Chạy nhiều round theo số người
 * - Mỗi round chọn ra 4 người
 * - Dùng "vòng quay" để 4 người thay đổi liên tục
 * - Xen kẽ pattern bắt cặp để giảm trùng
 */
function buildSmartRotation(playerIds: string[]): ScheduledMatch[] {
  const rounds = getRecommendedRounds(playerIds.length);
  const matches: ScheduledMatch[] = [];

  // offset để xoay cửa sổ 4 người qua từng round
  for (let round = 1; round <= rounds; round += 1) {
    const selected = pickFourPlayersForRound(playerIds, round);

    const [p1, p2, p3, p4] = selected;

    const pairing = getPairingForRound(round, p1, p2, p3, p4);

    matches.push({
      round,
      court: 1,
      teamA: pairing.teamA,
      teamB: pairing.teamB,
    });
  }

  return matches;
}

/* =========================================================
   PICK 4 PLAYERS
========================================================= */

/**
 * Chọn 4 người cho mỗi round bằng cửa sổ trượt:
 * round 1: [0,1,2,3]
 * round 2: [1,2,3,4]
 * round 3: [2,3,4,5]
 * ...
 * nếu vượt quá độ dài thì quay vòng.
 *
 * Cách này giúp:
 * - người chơi được xoay tua
 * - với 7 người sẽ không chỉ có 4 round
 * - mỗi round có tổ hợp khác nhau tương đối đều
 */
function pickFourPlayersForRound(
  playerIds: string[],
  round: number
): [string, string, string, string] {
  const n = playerIds.length;
  const start = (round - 1) % n;

  const picked: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    picked.push(playerIds[(start + i) % n]);
  }

  return [picked[0], picked[1], picked[2], picked[3]];
}

/* =========================================================
   PAIRING PATTERNS
========================================================= */

/**
 * Luân phiên 3 kiểu bắt cặp để tránh quá nhàm:
 *
 * pattern 1: (1,2) vs (3,4)
 * pattern 2: (1,3) vs (2,4)
 * pattern 3: (1,4) vs (2,3)
 */
function getPairingForRound(
  round: number,
  p1: string,
  p2: string,
  p3: string,
  p4: string
): { teamA: string[]; teamB: string[] } {
  const mod = round % 3;

  if (mod === 1) {
    return {
      teamA: [p1, p2],
      teamB: [p3, p4],
    };
  }

  if (mod === 2) {
    return {
      teamA: [p1, p3],
      teamB: [p2, p4],
    };
  }

  return {
    teamA: [p1, p4],
    teamB: [p2, p3],
  };
}