import type {
  GeneratedSchedule,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule as legacyBuildSessionSchedule } from "@/lib/match-generator";

/**
 * Scheduler Engine
 *
 * Sprint 8.1:
 * Chưa thay đổi thuật toán.
 * Chỉ đóng vai trò façade cho scheduler hiện tại.
 *
 * Các sprint tiếp theo sẽ thay thế dần logic bên trong.
 */
export function buildSessionSchedule(
  session: SessionRecord
): GeneratedSchedule {
  return legacyBuildSessionSchedule(session);
}
