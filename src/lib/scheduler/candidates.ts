import type {
  GeneratedSchedule,
  SessionRecord,
} from "@/types";

import { buildSessionSchedule } from "./engine";

export type ScheduleCandidate = {
  id: number;
  seed: number;
  schedule: GeneratedSchedule;
};

export function generateScheduleCandidates(
  session: SessionRecord,
  candidateCount = 20
): ScheduleCandidate[] {
  const safeCandidateCount = Math.max(
    1,
    Math.floor(candidateCount)
  );

  const candidates: ScheduleCandidate[] = [];

  for (
    let seed = 0;
    seed < safeCandidateCount;
    seed += 1
  ) {
    const shuffledSession = shuffleSession(
      session,
      seed
    );

    candidates.push({
      id: seed,
      seed,
      schedule: buildSessionSchedule(
        shuffledSession
      ),
    });
  }

  return candidates;
}

function shuffleSession(
  session: SessionRecord,
  seed: number
): SessionRecord {
  const memberIds = [...session.memberIds];

  seededShuffle(memberIds, seed);

  return {
    ...session,
    memberIds,
    scheduleSnapshot: undefined,
    schedulerVersion: undefined,
    scheduleCreatedAt: undefined,
  };
}

function seededShuffle(
  items: string[],
  seed: number
): void {
  let randomState = seed + 1;

  for (
    let index = items.length - 1;
    index > 0;
    index -= 1
  ) {
    randomState =
      (randomState * 9301 + 49297) % 233280;

    const targetIndex = Math.floor(
      (randomState / 233280) * (index + 1)
    );

    [items[index], items[targetIndex]] = [
      items[targetIndex],
      items[index],
    ];
  }
}