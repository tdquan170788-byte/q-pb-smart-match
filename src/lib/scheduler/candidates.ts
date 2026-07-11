import type {
  GeneratedSchedule,
  SessionRecord,
} from "@/types";

import {
  buildSessionSchedule,
} from "./engine";

export type ScheduleCandidate = {
  id: number;

  seed: number;

  schedule: GeneratedSchedule;
};

export function generateScheduleCandidates(
  session: SessionRecord,
  candidateCount = 20
): ScheduleCandidate[] {

  const candidates: ScheduleCandidate[] = [];

  for (
    let seed = 0;
    seed < candidateCount;
    seed++
  ) {

    const shuffledSession = shuffleSession(
      session,
      seed
    );

    candidates.push({

      id: seed,

      seed,

      schedule:
        buildSessionSchedule(
          shuffledSession
        ),

    });

  }

  return candidates;

}