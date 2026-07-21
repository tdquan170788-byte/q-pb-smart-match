import type { MatchOutcome } from "../internal/types";

export interface StreakSummary {
  currentWinStreak: number;
  longestWinStreak: number;
  currentLoseStreak: number;
  longestLoseStreak: number;
}

export function calculateStreakSummary(
  resultSequence: MatchOutcome[]
): StreakSummary {
  let currentWinStreak = 0;
  let longestWinStreak = 0;
  let currentLoseStreak = 0;
  let longestLoseStreak = 0;

  for (const result of resultSequence) {
    if (result === "W") {
      currentWinStreak += 1;
      currentLoseStreak = 0;
      longestWinStreak = Math.max(
        longestWinStreak,
        currentWinStreak
      );
      continue;
    }

    if (result === "L") {
      currentLoseStreak += 1;
      currentWinStreak = 0;
      longestLoseStreak = Math.max(
        longestLoseStreak,
        currentLoseStreak
      );
      continue;
    }

    currentWinStreak = 0;
    currentLoseStreak = 0;
  }

  return {
    currentWinStreak,
    longestWinStreak,
    currentLoseStreak,
    longestLoseStreak,
  };
}
