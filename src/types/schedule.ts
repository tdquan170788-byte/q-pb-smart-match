export type ScheduledMatch = {
  round: number;
  court: number;
  teamAMemberIds: string[];
  teamBMemberIds: string[];
};

export type GeneratedRound = {
  round: number;
  matches: ScheduledMatch[];
  restingMemberIds: string[];
};

export type GeneratedSchedule = {
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
};
