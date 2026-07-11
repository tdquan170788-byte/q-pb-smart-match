import type {
  GeneratedSchedule,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule } from "@/lib/scheduler";
import {
  getSessionById,
  updateSession,
} from "@/lib/storage";

export const CURRENT_SCHEDULER_VERSION =
  "smart-scheduler-2.2";

export type FreezeSessionScheduleResult =
  | {
      success: true;
      session: SessionRecord;
      schedule: GeneratedSchedule;
      alreadyFrozen: boolean;
    }
  | {
      success: false;
      reason: "session-not-found" | "update-failed";
    };

/**
 * Đóng băng lịch của một session cũ.
 *
 * Nếu session đã có snapshot, hàm trả lại snapshot hiện tại
 * và không sinh lịch mới.
 */
export function freezeSessionSchedule(
  sessionId: string
): FreezeSessionScheduleResult {
  const session = getSessionById(sessionId);

  if (!session) {
    return {
      success: false,
      reason: "session-not-found",
    };
  }

  if (session.scheduleSnapshot) {
    return {
      success: true,
      session,
      schedule: normalizeScheduleSessionId(
        session.scheduleSnapshot,
        session.id
      ),
      alreadyFrozen: true,
    };
  }

  const generatedSchedule = buildSessionSchedule(session);
  const scheduleCreatedAt = new Date().toISOString();

  const frozenSchedule: GeneratedSchedule = {
    ...generatedSchedule,
    sessionId: session.id,
  };

  const updatedSession = updateSession(session.id, {
    scheduleSnapshot: frozenSchedule,
    schedulerVersion: CURRENT_SCHEDULER_VERSION,
    scheduleCreatedAt,
  });

  if (!updatedSession) {
    return {
      success: false,
      reason: "update-failed",
    };
  }

  return {
    success: true,
    session: updatedSession,
    schedule: frozenSchedule,
    alreadyFrozen: false,
  };
}

/**
 * Chỉ kiểm tra trạng thái, không ghi dữ liệu.
 */
export function isSessionScheduleFrozen(
  session: SessionRecord
): boolean {
  return Boolean(
    session.scheduleSnapshot &&
      Array.isArray(session.scheduleSnapshot.rounds)
  );
}

function normalizeScheduleSessionId(
  schedule: GeneratedSchedule,
  sessionId: string
): GeneratedSchedule {
  if (schedule.sessionId === sessionId) {
    return schedule;
  }

  return {
    ...schedule,
    sessionId,
  };
}
