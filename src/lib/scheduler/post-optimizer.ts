import type { GeneratedSchedule } from "@/types";

export type OptimizeScheduleParams = {
  schedule: GeneratedSchedule;
};

export function optimizeSchedule({
  schedule,
}: OptimizeScheduleParams): GeneratedSchedule {
  return cloneSchedule(schedule);
}

function cloneSchedule(
  schedule: GeneratedSchedule
): GeneratedSchedule {
  return {
    sessionId: schedule.sessionId,

    totalRounds: schedule.totalRounds,

    rounds: schedule.rounds.map((round) => ({
      round: round.round,

      restingMemberIds: [
        ...round.restingMemberIds,
      ],

      matches: round.matches.map((match) => ({
        round: match.round,

        court: match.court,

        teamAMemberIds: [
          ...match.teamAMemberIds,
        ],

        teamBMemberIds: [
          ...match.teamBMemberIds,
        ],
      })),
    })),
  };
}