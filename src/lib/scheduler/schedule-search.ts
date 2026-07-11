import type {
  GeneratedSchedule,
  ScheduleQualityReport,
} from "@/types";

import { analyzeSchedule } from "./analytics";

export type ScoredScheduleCandidate = {
  schedule: GeneratedSchedule;
  report: ScheduleQualityReport;
};

type ScoreScheduleCandidatesParams = {
  schedules: GeneratedSchedule[];
  memberIds: string[];
};

type SelectBestScheduleCandidateParams = {
  schedules: GeneratedSchedule[];
  memberIds: string[];
};

export function scoreScheduleCandidates({
  schedules,
  memberIds,
}: ScoreScheduleCandidatesParams): ScoredScheduleCandidate[] {
  const uniqueSchedules = removeDuplicateSchedules(schedules);

  return uniqueSchedules
    .map((schedule) => ({
      schedule,
      report: analyzeSchedule({
        schedule,
        memberIds,
      }),
    }))
    .sort(compareScoredScheduleCandidates);
}

export function selectBestScheduleCandidate({
  schedules,
  memberIds,
}: SelectBestScheduleCandidateParams): ScoredScheduleCandidate | null {
  const scoredCandidates = scoreScheduleCandidates({
    schedules,
    memberIds,
  });

  return scoredCandidates[0] ?? null;
}

export function compareScheduleQuality(
  firstReport: ScheduleQualityReport,
  secondReport: ScheduleQualityReport
): number {
  if (secondReport.qualityScore !== firstReport.qualityScore) {
    return secondReport.qualityScore - firstReport.qualityScore;
  }

  if (
    firstReport.matchCountDifference !==
    secondReport.matchCountDifference
  ) {
    return (
      firstReport.matchCountDifference -
      secondReport.matchCountDifference
    );
  }

  if (
    firstReport.restCountDifference !==
    secondReport.restCountDifference
  ) {
    return (
      firstReport.restCountDifference -
      secondReport.restCountDifference
    );
  }

  if (
    firstReport.maxConsecutiveRestCount !==
    secondReport.maxConsecutiveRestCount
  ) {
    return (
      firstReport.maxConsecutiveRestCount -
      secondReport.maxConsecutiveRestCount
    );
  }

  if (
    firstReport.maxTeammateRepeatCount !==
    secondReport.maxTeammateRepeatCount
  ) {
    return (
      firstReport.maxTeammateRepeatCount -
      secondReport.maxTeammateRepeatCount
    );
  }

  if (
    firstReport.maxOpponentRepeatCount !==
    secondReport.maxOpponentRepeatCount
  ) {
    return (
      firstReport.maxOpponentRepeatCount -
      secondReport.maxOpponentRepeatCount
    );
  }

  return 0;
}

function compareScoredScheduleCandidates(
  firstCandidate: ScoredScheduleCandidate,
  secondCandidate: ScoredScheduleCandidate
): number {
  const qualityComparison = compareScheduleQuality(
    firstCandidate.report,
    secondCandidate.report
  );

  if (qualityComparison !== 0) {
    return qualityComparison;
  }

  return makeScheduleKey(firstCandidate.schedule).localeCompare(
    makeScheduleKey(secondCandidate.schedule)
  );
}

function removeDuplicateSchedules(
  schedules: GeneratedSchedule[]
): GeneratedSchedule[] {
  const scheduleMap = new Map<string, GeneratedSchedule>();

  for (const schedule of schedules) {
    const scheduleKey = makeScheduleKey(schedule);

    if (!scheduleMap.has(scheduleKey)) {
      scheduleMap.set(scheduleKey, schedule);
    }
  }

  return [...scheduleMap.values()];
}

function makeScheduleKey(schedule: GeneratedSchedule): string {
  const roundKeys = [...schedule.rounds]
    .sort(
      (firstRound, secondRound) =>
        firstRound.round - secondRound.round
    )
    .map((round) => {
      const matchKeys = [...round.matches]
        .sort(
          (firstMatch, secondMatch) =>
            firstMatch.court - secondMatch.court
        )
        .map((match) => {
          const teamAKey = [...match.teamAMemberIds]
            .sort()
            .join("-");

          const teamBKey = [...match.teamBMemberIds]
            .sort()
            .join("-");

          return [teamAKey, teamBKey]
            .sort()
            .join("_vs_");
        });

      const restingMemberKey = [
        ...round.restingMemberIds,
      ]
        .sort()
        .join("-");

      return [
        `round-${round.round}`,
        matchKeys.join("|"),
        `rest-${restingMemberKey}`,
      ].join("__");
    });

  return [
    schedule.sessionId,
    schedule.totalRounds,
    roundKeys.join("###"),
  ].join("::");
}
