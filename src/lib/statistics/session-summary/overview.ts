import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

import type {
  SessionOverview,
  SessionWinner,
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

  let winner: SessionWinner = "pending";

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

    let winner: SessionWinner = "pending";

if (session.mode === "team") {
    ...
    if (completedMatches !== totalMatches) {
        winner = "pending";
    } else if (teamAWins > teamBWins) {
        winner = "team-a";
    } else if (teamBWins > teamAWins) {
        winner = "team-b";
    } else {
        winner = "draw";
    }
} else {
    winner =
        completedMatches === totalMatches
            ? "draw"
            : "pending";
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

winner,

    createdAt:
      session.createdAt,
  };
}