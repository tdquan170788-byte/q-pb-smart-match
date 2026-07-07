import {
  buildSessionSchedule,
  type SessionSchedule,
  type SessionRound,
  type ScheduledMatch,
} from "@/lib/scheduler";

/* =========================================================
   TYPES
========================================================= */

export type GeneratedSchedule = SessionSchedule;
export type ScheduleRound = SessionRound;

/* =========================================================
   MATCH GENERATOR
   - Wrapper để giữ tương thích với code cũ Sprint 6A
   - Thực tế sẽ dùng scheduler mới trong lib/scheduler.ts
========================================================= */

export function generateMatchSchedule(playerIds: string[]): GeneratedSchedule {
  return buildSessionSchedule(playerIds);
}

export function generateSchedule(playerIds: string[]): GeneratedSchedule {
  return buildSessionSchedule(playerIds);
}

export type { ScheduledMatch };