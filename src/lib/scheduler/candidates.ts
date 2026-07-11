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
function shuffleSession(
  session: SessionRecord,
  seed: number
): SessionRecord {

  const memberIds = [
    ...session.memberIds,
  ];

  seededShuffle(
    memberIds,
    seed
  );

  return {

    ...session,

    memberIds,

  };

}
function seededShuffle(
  array: string[],
  seed: number
){

  let random = seed + 1;

  for(
    let i=array.length-1;
    i>0;
    i--
  ){

    random =
      (random*9301+49297)
      %233280;

    const j =
      Math.floor(
        random/233280*(i+1)
      );

    [
      array[i],
      array[j],
    ]=
    [
      array[j],
      array[i],
    ];

  }

}