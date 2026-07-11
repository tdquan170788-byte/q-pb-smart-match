import type { GeneratedRound, ScheduledMatch } from "@/types";

import { makePairKey } from "./helpers";

export type SchedulerHistory = {
  playedMatchCountByMemberId: Record<string, number>;
  restCountByMemberId: Record<string, number>;
  consecutiveRestCountByMemberId: Record<string, number>;
  teammateCountByPairKey: Record<string, number>;
  opponentCountByPairKey: Record<string, number>;
};

export type SchedulerCostWeights = {
  playCountBalance: number;
  restCountBalance: number;
  consecutiveRest: number;
  repeatedTeammate: number;
  repeatedOpponent: number;
};

export const defaultSchedulerCostWeights: SchedulerCostWeights = {
  playCountBalance: 20,
  restCountBalance: 20,
  consecutiveRest: 100,
  repeatedTeammate: 80,
  repeatedOpponent: 25,
};

export function createEmptySchedulerHistory(): SchedulerHistory {
  return {
    playedMatchCountByMemberId: {},
    restCountByMemberId: {},
    consecutiveRestCountByMemberId: {},
    teammateCountByPairKey: {},
    opponentCountByPairKey: {},
  };
}

export function buildSchedulerHistory(
  previousRounds: GeneratedRound[]
): SchedulerHistory {
  const history = createEmptySchedulerHistory();

  for (const round of previousRounds) {
    applyRoundToHistory(history, round);
  }

  return history;
}

export function calculateRoundCost(params: {
  round: GeneratedRound;
  history: SchedulerHistory;
  memberIds: string[];
  weights?: SchedulerCostWeights;
}): number {
  const {
    round,
    history,
    memberIds,
    weights = defaultSchedulerCostWeights,
  } = params;

  let cost = 0;

  cost +=
    calculatePlayCountBalanceCost(round, history, memberIds) *
    weights.playCountBalance;

  cost +=
    calculateRestCountBalanceCost(round, history, memberIds) *
    weights.restCountBalance;

  cost +=
    calculateConsecutiveRestCost(round, history) *
    weights.consecutiveRest;

  cost +=
    calculateRepeatedTeammateCost(round.matches, history) *
    weights.repeatedTeammate;

  cost +=
    calculateRepeatedOpponentCost(round.matches, history) *
    weights.repeatedOpponent;

  return cost;
}

export function applyRoundToHistory(
  history: SchedulerHistory,
  round: GeneratedRound
): void {
  const playingMemberIds = new Set(
    round.matches.flatMap((match) => [
      ...match.teamAMemberIds,
      ...match.teamBMemberIds,
    ])
  );

  const restingMemberIds = new Set(round.restingMemberIds);

  for (const memberId of playingMemberIds) {
    history.playedMatchCountByMemberId[memberId] =
      (history.playedMatchCountByMemberId[memberId] ?? 0) + 1;

    history.consecutiveRestCountByMemberId[memberId] = 0;
  }

  for (const memberId of restingMemberIds) {
    history.restCountByMemberId[memberId] =
      (history.restCountByMemberId[memberId] ?? 0) + 1;

    history.consecutiveRestCountByMemberId[memberId] =
      (history.consecutiveRestCountByMemberId[memberId] ?? 0) + 1;
  }

  for (const match of round.matches) {
    applyMatchPairsToHistory(history, match);
  }
}

function applyMatchPairsToHistory(
  history: SchedulerHistory,
  match: ScheduledMatch
): void {
  const [teamAFirst, teamASecond] = match.teamAMemberIds;
  const [teamBFirst, teamBSecond] = match.teamBMemberIds;

  if (teamAFirst && teamASecond) {
    const teamAKey = makePairKey(teamAFirst, teamASecond);

    history.teammateCountByPairKey[teamAKey] =
      (history.teammateCountByPairKey[teamAKey] ?? 0) + 1;
  }

  if (teamBFirst && teamBSecond) {
    const teamBKey = makePairKey(teamBFirst, teamBSecond);

    history.teammateCountByPairKey[teamBKey] =
      (history.teammateCountByPairKey[teamBKey] ?? 0) + 1;
  }

  for (const teamAMemberId of match.teamAMemberIds) {
    for (const teamBMemberId of match.teamBMemberIds) {
      const opponentKey = makePairKey(teamAMemberId, teamBMemberId);

      history.opponentCountByPairKey[opponentKey] =
        (history.opponentCountByPairKey[opponentKey] ?? 0) + 1;
    }
  }
}

function calculatePlayCountBalanceCost(
  round: GeneratedRound,
  history: SchedulerHistory,
  memberIds: string[]
): number {
  const playingMemberIds = new Set(
    round.matches.flatMap((match) => [
      ...match.teamAMemberIds,
      ...match.teamBMemberIds,
    ])
  );

  const projectedPlayCounts = memberIds.map(
    (memberId) =>
      (history.playedMatchCountByMemberId[memberId] ?? 0) +
      (playingMemberIds.has(memberId) ? 1 : 0)
  );

  return calculateRange(projectedPlayCounts);
}

function calculateRestCountBalanceCost(
  round: GeneratedRound,
  history: SchedulerHistory,
  memberIds: string[]
): number {
  const restingMemberIdSet = new Set(round.restingMemberIds);

  const projectedRestCounts = memberIds.map(
    (memberId) =>
      (history.restCountByMemberId[memberId] ?? 0) +
      (restingMemberIdSet.has(memberId) ? 1 : 0)
  );

  return calculateRange(projectedRestCounts);
}

function calculateConsecutiveRestCost(
  round: GeneratedRound,
  history: SchedulerHistory
): number {
  return round.restingMemberIds.reduce((sum, memberId) => {
    const previousConsecutiveRestCount =
      history.consecutiveRestCountByMemberId[memberId] ?? 0;

    return sum + previousConsecutiveRestCount;
  }, 0);
}

function calculateRepeatedTeammateCost(
  matches: ScheduledMatch[],
  history: SchedulerHistory
): number {
  let cost = 0;

  for (const match of matches) {
    const [teamAFirst, teamASecond] = match.teamAMemberIds;
    const [teamBFirst, teamBSecond] = match.teamBMemberIds;

    if (teamAFirst && teamASecond) {
      cost +=
        history.teammateCountByPairKey[
          makePairKey(teamAFirst, teamASecond)
        ] ?? 0;
    }

    if (teamBFirst && teamBSecond) {
      cost +=
        history.teammateCountByPairKey[
          makePairKey(teamBFirst, teamBSecond)
        ] ?? 0;
    }
  }

  return cost;
}

function calculateRepeatedOpponentCost(
  matches: ScheduledMatch[],
  history: SchedulerHistory
): number {
  let cost = 0;

  for (const match of matches) {
    for (const teamAMemberId of match.teamAMemberIds) {
      for (const teamBMemberId of match.teamBMemberIds) {
        cost +=
          history.opponentCountByPairKey[
            makePairKey(teamAMemberId, teamBMemberId)
          ] ?? 0;
      }
    }
  }

  return cost;
}

function calculateRange(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}
