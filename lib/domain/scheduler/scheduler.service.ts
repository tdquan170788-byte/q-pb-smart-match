import type { SessionRecord } from "@/types/domain";
import type { GeneratedSchedule } from "./scheduler.types";
import { generateNormalSchedule } from "./normal.scheduler";
import { generateTeamSchedule } from "./team.scheduler";

export function generateScheduleForSession(session: SessionRecord): GeneratedSchedule {
  if ((session.mode ?? "normal") === "team") {
    return generateTeamSchedule(session);
  }
  return generateNormalSchedule(session);
}