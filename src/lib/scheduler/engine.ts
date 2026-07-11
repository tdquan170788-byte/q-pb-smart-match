import type { GeneratedSchedule, SessionRecord } from "@/types";

import { buildSessionSchedule as legacyBuildSessionSchedule } from "@/lib/match-generator";

/**
 * Scheduler Engine
 *
 * Sprint 8.1:
 * - Chưa thay đổi thuật toán xếp lịch.
 * - Chỉ tạo façade thống nhất cho scheduler.
 * - Các bước tiếp theo sẽ di chuyển dần logic từ match-generator.ts
 *   vào các module scheduler mới.
 */
export function buildSessionSchedule(
  session: SessionRecord
): GeneratedSchedule {
  return legacyBuildSessionSchedule(session);
}
