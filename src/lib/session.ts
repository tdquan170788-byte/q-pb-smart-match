import type { GeneratedSchedule, MatchRecord, SessionRecord } from "@/types";

import { getMatchesBySessionId } from "@/lib/storage";
import { buildSessionSchedule } from "./match-generator";

export function generateScheduleForSession(
  session: SessionRecord
): GeneratedSchedule {
  return buildSessionSchedule(session);
}

export function getSessionMatches(sessionId: string): MatchRecord[] {
  return getMatchesBySessionId(sessionId).sort((a, b) => {
    if (a.round !== b.round) {
      return a.round - b.round;
    }

    return (a.court ?? 1) - (b.court ?? 1);
  });
}
