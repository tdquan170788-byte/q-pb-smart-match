import type {
  MatchAnalysisResult,
} from "../match-analyzer";

import type {
  MatchRecord,
  SessionRecord,
} from "@/types";

import type {
  SessionHighlights,
} from "./types";

export interface BuildSessionHighlightsInput {
  session: SessionRecord;

  savedMatches: MatchRecord[];

  analysis: MatchAnalysisResult;
}

export function buildSessionHighlights(
  _input: BuildSessionHighlightsInput
): SessionHighlights {
  return {};
}