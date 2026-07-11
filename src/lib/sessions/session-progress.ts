import type {
  GeneratedSchedule,
  MatchRecord,
  RoundProgressItem,
  RoundProgressStatus,
  ScheduledMatch,
  SessionProgress,
  SessionProgressStatus,
} from "@/types";

type BuildSessionProgressParams = {
  schedule: GeneratedSchedule;
  savedMatches: MatchRecord[];
};

export function buildSessionProgress({
  schedule,
  savedMatches,
}: BuildSessionProgressParams): SessionProgress {
  const savedMatchMap = new Map<string, MatchRecord>();

  for (const savedMatch of savedMatches) {
    savedMatchMap.set(
      makeSavedMatchKey(savedMatch),
      savedMatch
    );
  }

  const sortedRounds = [...schedule.rounds].sort(
    (firstRound, secondRound) =>
      firstRound.round - secondRound.round
  );

  const rounds: RoundProgressItem[] = sortedRounds.map(
    (round) => {
      const totalMatches = round.matches.length;

      const completedMatches = round.matches.reduce(
        (count, scheduledMatch) => {
          const savedMatch = findSavedMatch({
            scheduledMatch,
            savedMatchMap,
          });

          return count + (savedMatch ? 1 : 0);
        },
        0
      );

      const remainingMatches = Math.max(
        0,
        totalMatches - completedMatches
      );

      const completionPercent =
        totalMatches > 0
          ? roundToTwoDecimals(
              (completedMatches / totalMatches) * 100
            )
          : 0;

      return {
        round: round.round,

        totalMatches,
        completedMatches,
        remainingMatches,

        completionPercent,

        status: getRoundProgressStatus({
          totalMatches,
          completedMatches,
        }),
      };
    }
  );

  const totalMatches = rounds.reduce(
    (sum, round) => sum + round.totalMatches,
    0
  );

  const completedMatches = rounds.reduce(
    (sum, round) => sum + round.completedMatches,
    0
  );

  const remainingMatches = Math.max(
    0,
    totalMatches - completedMatches
  );

  const completedRounds = rounds.filter(
    (round) => round.status === "completed"
  ).length;

  const currentRoundItem =
    rounds.find(
      (round) => round.status === "in-progress"
    ) ??
    rounds.find(
      (round) => round.status === "waiting"
    ) ??
    null;

  const nextRoundItem =
    currentRoundItem === null
      ? null
      : rounds.find(
          (round) =>
            round.round > currentRoundItem.round &&
            round.status !== "completed"
        ) ?? null;

  const completionPercent =
    totalMatches > 0
      ? roundToTwoDecimals(
          (completedMatches / totalMatches) * 100
        )
      : 0;

  return {
    sessionId: schedule.sessionId,

    totalRounds: rounds.length,
    completedRounds,

    totalMatches,
    completedMatches,
    remainingMatches,

    completionPercent,

    currentRound: currentRoundItem?.round ?? null,
    nextRound: nextRoundItem?.round ?? null,

    status: getSessionProgressStatus({
      totalMatches,
      completedMatches,
    }),

    rounds,
  };
}

export function isSessionCompleted(
  progress: SessionProgress
): boolean {
  return progress.status === "completed";
}

export function isSessionInProgress(
  progress: SessionProgress
): boolean {
  return progress.status === "in-progress";
}

export function getSessionProgressLabel(
  status: SessionProgressStatus
): string {
  if (status === "completed") {
    return "Đã hoàn thành";
  }

  if (status === "in-progress") {
    return "Đang diễn ra";
  }

  return "Chưa bắt đầu";
}

export function getRoundProgressLabel(
  status: RoundProgressStatus
): string {
  if (status === "completed") {
    return "Đã hoàn thành";
  }

  if (status === "in-progress") {
    return "Đang thi đấu";
  }

  return "Chờ thi đấu";
}

function findSavedMatch({
  scheduledMatch,
  savedMatchMap,
}: {
  scheduledMatch: ScheduledMatch;
  savedMatchMap: Map<string, MatchRecord>;
}): MatchRecord | undefined {
  return savedMatchMap.get(
    makeScheduledMatchKey(scheduledMatch)
  );
}

function makeScheduledMatchKey(
  match: ScheduledMatch
): string {
  return [
    match.round,
    match.court,
    makeTeamKey(match.teamAMemberIds),
    makeTeamKey(match.teamBMemberIds),
  ].join("::");
}

function makeSavedMatchKey(
  match: MatchRecord
): string {
  return [
    match.round,
    match.court ?? 1,
    makeTeamKey(match.teamA.memberIds),
    makeTeamKey(match.teamB.memberIds),
  ].join("::");
}

function makeTeamKey(memberIds: string[]): string {
  return [...memberIds].sort().join("__");
}

function getRoundProgressStatus({
  totalMatches,
  completedMatches,
}: {
  totalMatches: number;
  completedMatches: number;
}): RoundProgressStatus {
  if (
    totalMatches > 0 &&
    completedMatches >= totalMatches
  ) {
    return "completed";
  }

  if (completedMatches > 0) {
    return "in-progress";
  }

  return "waiting";
}

function getSessionProgressStatus({
  totalMatches,
  completedMatches,
}: {
  totalMatches: number;
  completedMatches: number;
}): SessionProgressStatus {
  if (
    totalMatches > 0 &&
    completedMatches >= totalMatches
  ) {
    return "completed";
  }

  if (completedMatches > 0) {
    return "in-progress";
  }

  return "not-started";
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}