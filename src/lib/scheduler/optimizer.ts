import type { GeneratedRound } from "@/types";

import {
  calculateRoundCost,
  type SchedulerCostWeights,
  type SchedulerHistory,
} from "./cost";
import {
  includesEveryMemberExactlyOnce,
  isValidGeneratedRound,
  usesOnlyAllowedMembers,
} from "./validator";

export type ScoredRoundCandidate = {
  round: GeneratedRound;
  cost: number;
};

export function scoreRoundCandidates(params: {
  candidates: GeneratedRound[];
  history: SchedulerHistory;
  memberIds: string[];
  weights?: SchedulerCostWeights;
}): ScoredRoundCandidate[] {
  const { candidates, history, memberIds, weights } = params;

  return candidates
    .filter((candidate) =>
      isAllowedRoundCandidate(candidate, memberIds)
    )
    .map((candidate) => ({
      round: candidate,
      cost: calculateRoundCost({
        round: candidate,
        history,
        memberIds,
        weights,
      }),
    }))
    .sort((a, b) => {
  if (a.cost !== b.cost) {
    return a.cost - b.cost;
  }

  return (
    a.round.restingMemberIds.length -
    b.round.restingMemberIds.length
  );
});
}

export function selectBestRoundCandidate(params: {
  candidates: GeneratedRound[];
  history: SchedulerHistory;
  memberIds: string[];
  weights?: SchedulerCostWeights;
}): GeneratedRound | null {
  const scoredCandidates = scoreRoundCandidates(params);

  return scoredCandidates[0]?.round ?? null;
}

export function selectFirstValidRoundCandidate(
  candidates: GeneratedRound[],
  memberIds: string[]
): GeneratedRound | null {
  return (
    candidates.find((candidate) =>
      isAllowedRoundCandidate(candidate, memberIds)
    ) ?? null
  );
}

function isAllowedRoundCandidate(
  candidate: GeneratedRound,
  memberIds: string[]
): boolean {
  return (
    isValidGeneratedRound(candidate) &&
    usesOnlyAllowedMembers(candidate, memberIds) &&
    includesEveryMemberExactlyOnce(candidate, memberIds)
  );
}
