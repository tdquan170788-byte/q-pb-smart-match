import type { GeneratedSchedule } from "@/types";
import type {
  RepeatPartnerAnalysis,
  RepeatedPartnerItem,
} from "./types";

function createPairKey(memberIds: string[]): string {
  return [...memberIds].sort().join("__");
}

function parsePairKey(pairKey: string): [string, string] {
  const [a, b] = pairKey.split("__");
  return [a, b];
}

/**
 * Analyze duplicated teammate pairs.
 *
 * This function is completely pure:
 * - No LocalStorage
 * - No Repository
 * - No UI dependency
 * - No Ranking dependency
 */
export function analyzeRepeatPartners(
  schedule: GeneratedSchedule
): RepeatPartnerAnalysis {
  const pairCounter = new Map<string, number>();

  for (const round of schedule.rounds) {
    for (const match of round.matches) {
      const teams = [
        match.teamAMemberIds,
        match.teamBMemberIds,
      ];

      for (const team of teams) {
        // Ignore invalid team
        if (team.length !== 2) continue;

        const key = createPairKey(team);

        pairCounter.set(
          key,
          (pairCounter.get(key) ?? 0) + 1
        );
      }
    }
  }

  const repeatedPairs: RepeatedPartnerItem[] = [];

  let maxRepeat = 1;

  for (const [key, count] of pairCounter.entries()) {
    if (count <= 1) continue;

    repeatedPairs.push({
      memberIds: parsePairKey(key),
      count,
    });

    if (count > maxRepeat) {
      maxRepeat = count;
    }
  }

  repeatedPairs.sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }

    return a.memberIds.join("").localeCompare(
      b.memberIds.join("")
    );
  });

  const duplicatedPairCount = repeatedPairs.length;

  // Temporary scoring formula.
  const score = Math.max(
    0,
    100 - duplicatedPairCount * 5
  );

  return {
    repeatedPairs,
    uniquePairs: pairCounter.size,
    duplicatedPairCount,
    maxRepeat,
    score,
  };
}
