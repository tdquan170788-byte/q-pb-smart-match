export type GeneratedMatch = {
  round: number;
  court: number;
  teamA: string[];
  teamB: string[];
};

export type GeneratedRound = {
  round: number;
  matches: GeneratedMatch[];
  restingPlayerIds: string[];
};

export type GeneratedSchedule = {
  sessionId: string;
  totalRounds: number;
  rounds: GeneratedRound[];
};