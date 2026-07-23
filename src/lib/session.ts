import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule } from "@/lib/scheduler";
import { getMatchesBySessionId } from "@/lib/storage";

/**
 * Trả về lịch thi đấu của session.
 *
 * Ưu tiên:
 * 1. scheduleSnapshot đã được lưu và đóng băng.
 * 2. Sinh lịch lại chỉ dành cho session cũ chưa có snapshot.
 */
export function generateScheduleForSession(
  session: SessionRecord
): GeneratedSchedule {
  if (session.scheduleSnapshot) {
    return normalizeSnapshotSessionId(
      session.scheduleSnapshot,
      session.id
    );
  }


  return buildSessionSchedule(session);
}

/**
 * Kiểm tra session đã có lịch đóng băng hay chưa.
 */
export function hasFrozenSchedule(
  session: SessionRecord
): boolean {
  return Boolean(
    session.scheduleSnapshot &&
      Array.isArray(session.scheduleSnapshot.rounds)
  );
}

/**
 * Lấy phiên bản Scheduler đã tạo lịch.
 */
export function getSessionSchedulerVersion(
  session: SessionRecord
): string {
  if (session.schedulerVersion?.trim()) {
    return session.schedulerVersion;
  }

  return hasFrozenSchedule(session)
    ? "unknown-frozen-version"
    : "legacy-dynamic-schedule";
}

/**
 * Lấy danh sách kết quả đã lưu của một session,
 * sắp xếp theo round rồi đến court.
 */
export function getSessionMatches(
  sessionId: string
): MatchRecord[] {
  return getMatchesBySessionId(sessionId).sort(
    (firstMatch, secondMatch) => {
      if (firstMatch.round !== secondMatch.round) {
        return firstMatch.round - secondMatch.round;
      }

      return (
        (firstMatch.court ?? 1) -
        (secondMatch.court ?? 1)
      );
    }
  );
}

/**
 * Bảo đảm sessionId bên trong snapshot luôn khớp
 * với session hiện tại.
 *
 * Hàm này không thay đổi object gốc trong localStorage.
 */
function normalizeSnapshotSessionId(
  scheduleSnapshot: GeneratedSchedule,
  sessionId: string
): GeneratedSchedule {
  if (scheduleSnapshot.sessionId === sessionId) {
    return scheduleSnapshot;
  }

  return {
    ...scheduleSnapshot,
    sessionId,
  };
}
