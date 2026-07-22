import type {
  GeneratedRound,
  GeneratedSchedule,
} from "@/types";

export function cloneSchedule(
  schedule: GeneratedSchedule
): GeneratedSchedule {
  return {
    sessionId: schedule.sessionId,

    totalRounds: schedule.totalRounds,

    rounds: schedule.rounds.map(cloneRound),
  };
}

export function cloneRound(
  round: GeneratedRound
): GeneratedRound {
  return {
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
  };
}

export function swapRounds(
  schedule: GeneratedSchedule,
  firstRoundIndex: number,
  secondRoundIndex: number
): GeneratedSchedule {
  const clonedSchedule = cloneSchedule(schedule);

  if (
    firstRoundIndex === secondRoundIndex ||
    firstRoundIndex < 0 ||
    secondRoundIndex < 0 ||
    firstRoundIndex >= clonedSchedule.rounds.length ||
    secondRoundIndex >= clonedSchedule.rounds.length
  ) {
    return clonedSchedule;
  }

  [
    clonedSchedule.rounds[firstRoundIndex],
    clonedSchedule.rounds[secondRoundIndex],
  ] = [
    clonedSchedule.rounds[secondRoundIndex],
    clonedSchedule.rounds[firstRoundIndex],
  ];

  clonedSchedule.rounds.forEach(
    (round, index) => {
      round.round = index + 1;

      round.matches.forEach((match) => {
        match.round = index + 1;
      });
    }
  );

  return clonedSchedule;
}