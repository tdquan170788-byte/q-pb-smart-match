import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule } from "@/lib/scheduler";
import { getMatchesBySessionId } from "@/lib/storage";

export function generateScheduleForSession(
  session: SessionRecord
): GeneratedSchedule {
  return buildSessionSchedule(session);
}

export function getSessionMatches(sessionId: string): MatchRecord[] {
  return getMatchesBySessionId(sessionId).sort((firstMatch, secondMatch) => {
    if (firstMatch.round !== secondMatch.round) {
      return firstMatch.round - secondMatch.round;
    }

    return (firstMatch.court ?? 1) - (secondMatch.court ?? 1);
  });
}
