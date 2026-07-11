export type SessionProgressStatus =
  | "not-started"
  | "in-progress"
  | "completed";

export type RoundProgressStatus =
  | "waiting"
  | "in-progress"
  | "completed";

export type RoundProgressItem = {
  round: number;

  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;

  completionPercent: number;
  status: RoundProgressStatus;
};

export type SessionProgress = {
  sessionId: string;

  totalRounds: number;
  completedRounds: number;

  totalMatches: number;
  completedMatches: number;
  remainingMatches: number;

  completionPercent: number;

  currentRound: number | null;
  nextRound: number | null;

  status: SessionProgressStatus;

  rounds: RoundProgressItem[];
};