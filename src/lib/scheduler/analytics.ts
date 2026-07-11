import type {
  GeneratedSchedule,
  MemberScheduleStat,
  SchedulePairStat,
  ScheduleQualityReport,
} from "@/types";

import { makePairKey, uniqueMemberIds } from "./helpers";

type MutableMemberScheduleStat = {
  memberId: string;
  matchCount: number;
  restCount: number;
  currentConsecutiveRestCount: number;
  maxConsecutiveRestCount: number;
};

type PairCounterItem = {
  firstMemberId: string;
  secondMemberId: string;
  count: number;
};

export function analyzeSchedule(params: {
  schedule: GeneratedSchedule;
  memberIds: string[];
}): ScheduleQualityReport {
  const { schedule } = params;
  const memberIds = uniqueMemberIds(params.memberIds);

  const memberStatMap = createMemberStatMap(memberIds);
  const teammatePairCounter = new Map<string, PairCounterItem>();
  const opponentPairCounter = new Map<string, PairCounterItem>();

  const sortedRounds = [...schedule.rounds].sort(
    (firstRound, secondRound) =>
      firstRound.round - secondRound.round
  );

  let totalMatches = 0;

  for (const round of sortedRounds) {
    totalMatches += round.matches.length;

    const playingMemberIds = new Set(
      round.matches.flatMap((match) => [
        ...match.teamAMemberIds,
        ...match.teamBMemberIds,
      ])
    );

    const explicitRestingMemberIds = new Set(
      round.restingMemberIds
    );

    for (const memberId of memberIds) {
      const stat = memberStatMap.get(memberId);

      if (!stat) {
        continue;
      }

      if (playingMemberIds.has(memberId)) {
        stat.matchCount += 1;
        stat.currentConsecutiveRestCount = 0;
        continue;
      }

      if (explicitRestingMemberIds.has(memberId)) {
        stat.restCount += 1;
        stat.currentConsecutiveRestCount += 1;

        stat.maxConsecutiveRestCount = Math.max(
          stat.maxConsecutiveRestCount,
          stat.currentConsecutiveRestCount
        );
      }
    }

    for (const match of round.matches) {
      countTeammatePairs(
        teammatePairCounter,
        match.teamAMemberIds
      );

      countTeammatePairs(
        teammatePairCounter,
        match.teamBMemberIds
      );

      countOpponentPairs(
        opponentPairCounter,
        match.teamAMemberIds,
        match.teamBMemberIds
      );
    }
  }

  const memberStats = buildMemberStats(memberStatMap);

  const teammatePairStats = buildPairStats(
    teammatePairCounter
  );

  const opponentPairStats = buildPairStats(
    opponentPairCounter
  );

  const matchCountDifference = calculateDifference(
    memberStats.map((item) => item.matchCount)
  );

  const restCountDifference = calculateDifference(
    memberStats.map((item) => item.restCount)
  );

  const maxConsecutiveRestCount = getMaximum(
    memberStats.map((item) => item.maxConsecutiveRestCount)
  );

  const maxTeammateRepeatCount = getMaximum(
    teammatePairStats.map((item) => item.count)
  );

  const maxOpponentRepeatCount = getMaximum(
    opponentPairStats.map((item) => item.count)
  );

  const qualityScore = calculateQualityScore({
    matchCountDifference,
    restCountDifference,
    maxConsecutiveRestCount,
    teammatePairStats,
    opponentPairStats,
  });

  return {
    sessionId: schedule.sessionId,

    totalRounds: schedule.totalRounds,
    totalMatches,

    memberStats,

    teammatePairStats,
    opponentPairStats,

    matchCountDifference,
    restCountDifference,

    maxConsecutiveRestCount,
    maxTeammateRepeatCount,
    maxOpponentRepeatCount,

    qualityScore,
  };
}

function createMemberStatMap(
  memberIds: string[]
): Map<string, MutableMemberScheduleStat> {
  return new Map(
    memberIds.map((memberId) => [
      memberId,
      {
        memberId,
        matchCount: 0,
        restCount: 0,
        currentConsecutiveRestCount: 0,
        maxConsecutiveRestCount: 0,
      },
    ])
  );
}

function countTeammatePairs(
  counter: Map<string, PairCounterItem>,
  teamMemberIds: string[]
): void {
  for (
    let firstIndex = 0;
    firstIndex < teamMemberIds.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < teamMemberIds.length;
      secondIndex += 1
    ) {
      incrementPairCounter(
        counter,
        teamMemberIds[firstIndex],
        teamMemberIds[secondIndex]
      );
    }
  }
}

function countOpponentPairs(
  counter: Map<string, PairCounterItem>,
  teamAMemberIds: string[],
  teamBMemberIds: string[]
): void {
  for (const teamAMemberId of teamAMemberIds) {
    for (const teamBMemberId of teamBMemberIds) {
      incrementPairCounter(
        counter,
        teamAMemberId,
        teamBMemberId
      );
    }
  }
}

function incrementPairCounter(
  counter: Map<string, PairCounterItem>,
  firstMemberId: string,
  secondMemberId: string
): void {
  const pairKey = makePairKey(
    firstMemberId,
    secondMemberId
  );

  const existingItem = counter.get(pairKey);

  if (existingItem) {
    existingItem.count += 1;
    return;
  }

  const sortedMemberIds = [
    firstMemberId,
    secondMemberId,
  ].sort();

  counter.set(pairKey, {
    firstMemberId: sortedMemberIds[0],
    secondMemberId: sortedMemberIds[1],
    count: 1,
  });
}

function buildMemberStats(
  memberStatMap: Map<string, MutableMemberScheduleStat>
): MemberScheduleStat[] {
  return [...memberStatMap.values()]
    .map((item) => ({
      memberId: item.memberId,
      matchCount: item.matchCount,
      restCount: item.restCount,
      maxConsecutiveRestCount:
        item.maxConsecutiveRestCount,
    }))
    .sort((firstItem, secondItem) =>
      firstItem.memberId.localeCompare(
        secondItem.memberId
      )
    );
}

function buildPairStats(
  counter: Map<string, PairCounterItem>
): SchedulePairStat[] {
  return [...counter.entries()]
    .map(([pairKey, item]) => ({
      pairKey,
      firstMemberId: item.firstMemberId,
      secondMemberId: item.secondMemberId,
      count: item.count,
    }))
    .sort((firstItem, secondItem) => {
      if (secondItem.count !== firstItem.count) {
        return secondItem.count - firstItem.count;
      }

      return firstItem.pairKey.localeCompare(
        secondItem.pairKey
      );
    });
}

function calculateQualityScore(params: {
  matchCountDifference: number;
  restCountDifference: number;
  maxConsecutiveRestCount: number;
  teammatePairStats: SchedulePairStat[];
  opponentPairStats: SchedulePairStat[];
}): number {
  const {
    matchCountDifference,
    restCountDifference,
    maxConsecutiveRestCount,
    teammatePairStats,
    opponentPairStats,
  } = params;

  const repeatedTeammateCount =
    teammatePairStats.reduce(
      (sum, item) =>
        sum + Math.max(0, item.count - 1),
      0
    );

  const excessiveOpponentRepeatCount =
    opponentPairStats.reduce(
      (sum, item) =>
        sum + Math.max(0, item.count - 2),
      0
    );

  const matchBalancePenalty =
    matchCountDifference * 10;

  const restBalancePenalty =
    restCountDifference * 10;

  const consecutiveRestPenalty =
    Math.max(0, maxConsecutiveRestCount - 1) * 15;

  const teammateRepeatPenalty =
    repeatedTeammateCount * 3;

  const opponentRepeatPenalty =
    excessiveOpponentRepeatCount * 1.5;

  const totalPenalty =
    matchBalancePenalty +
    restBalancePenalty +
    consecutiveRestPenalty +
    teammateRepeatPenalty +
    opponentRepeatPenalty;

  return roundToTwoDecimals(
    Math.max(0, 100 - totalPenalty)
  );
}

function calculateDifference(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}

function getMaximum(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values);
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
