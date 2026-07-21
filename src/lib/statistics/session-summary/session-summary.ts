import type {
  GeneratedSchedule,
  MatchRecord,
  SessionRecord,
} from "@/types";

import type { SessionSummary } from "./types";

import { analyzeMatches } from "./match-analyzer";
import { buildPlayerSummaries, type PlayerRatingSnapshotMap } from "./player-summary";
import { buildSessionOverview } from "./overview";
import { buildTeamSummaries } from "./team-summary";

import { buildSessionHighlights } from "./highlights";

export interface BuildSessionSummaryInput {
  session: SessionRecord;
  schedule: GeneratedSchedule;
  savedMatches: MatchRecord[];
  ratingSnapshot?: PlayerRatingSnapshotMap;
}

export function buildSessionSummary(
  input: BuildSessionSummaryInput
): SessionSummary {
  const {
    session,
    schedule,
    savedMatches,
    ratingSnapshot,
  } = input;

  const analysis = analyzeMatches({
    session,
    schedule,
    savedMatches,
  });

  return {
  overview: buildSessionOverview({
    session,
    schedule,
    savedMatches,
  }),

  players: buildPlayerSummaries({
    analysis,
    ratingSnapshot,
  }),

  teams:
    session.mode === "team"
      ? buildTeamSummaries({
          analysis,
        })
      : undefined,

  highlights: buildSessionHighlights(
    analysis
  ),
};
}
