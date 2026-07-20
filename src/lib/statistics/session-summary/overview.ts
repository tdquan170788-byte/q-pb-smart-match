import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

import type {
  SessionOverview,
} from "./types";

/* =========================================================
   Build Session Overview
========================================================= */

export function buildSessionOverview(params: {
  session: SessionRecord;
  schedule: GeneratedSchedule;
  savedMatches: MatchRecord[];
}): SessionOverview {
  const {
    session,
    schedule,
    savedMatches,
  } = params;

  const totalMatches =
    schedule.rounds.reduce(
      (total, round) =>
        total + round.matches.length,
      0
    );

  const completedMatches =
    savedMatches.filter(
      (match) =>
        match.scoreA !== undefined &&
        match.scoreB !== undefined
    ).length;

  const unfinishedMatches =
    totalMatches - completedMatches;

  const completionRate =
    totalMatches === 0
      ? 0
      : Number(
          (
            (completedMatches /
              totalMatches) *
            100
          ).toFixed(1)
        );

  let winnerTeam:
    | "A"
    | "B"
    | undefined;

  if (session.mode === "team") {
    let teamAWins = 0;
    let teamBWins = 0;

    for (const match of savedMatches) {
      if (
        match.scoreA === undefined ||
        match.scoreB === undefined
      ) {
        continue;
      }

      if (match.scoreA > match.scoreB) {
        teamAWins++;
      } else if (
        match.scoreB > match.scoreA
      ) {
        teamBWins++;
      }
    }

    if (teamAWins > teamBWins) {
      winnerTeam = "A";
    } else if (
      teamBWins > teamAWins
    ) {
      winnerTeam = "B";
    }
  }

  return {
    sessionId: session.id,

    mode: session.mode,

    totalMembers:
      session.memberIds.length,

    totalRounds:
      schedule.totalRounds,

    totalMatches,

    completedMatches,

    unfinishedMatches,

    completionRate,

    winnerTeam,

    createdAt:
      session.createdAt,
  };
}