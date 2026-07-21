import type { MatchAnalysisResult } from "../../match-analyzer";
import type { MatchRecord, SessionRecord } from "@/types";

import type { SessionHighlights } from "./types";

type BuildSessionHighlightsParams = {
  session: SessionRecord;

  savedMatches: MatchRecord[];

  analysis: MatchAnalysisResult;
};

export function buildSessionHighlights(
  _params: BuildSessionHighlightsParams
): SessionHighlights {
  return {};
}