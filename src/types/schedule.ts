export type ScheduledMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
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
