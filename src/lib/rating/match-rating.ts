import type {
  MatchRecord,
  Member,
} from "@/types";

import {
  calculateTeamRatingResult,
  type TeamRatingResult,
} from "./team-rating";

export function calculateMatchRating(
  match: MatchRecord,
  members: Member[]
): TeamRatingResult | null {

  if (
    match.scoreA === match.scoreB
  ) {
    return null;
  }

  const memberMap = new Map(
    members.map(member => [
      member.id,
      member,
    ])
  );

  const teamA =
    match.teamA.memberIds
      .map(memberId => {

        const member =
          memberMap.get(memberId);

        if (!member) {
          return null;
        }

        return {

          memberId,

          rating:
            member.ratingNormal,

        };

      })
      .filter(Boolean);

  const teamB =
    match.teamB.memberIds
      .map(memberId => {

        const member =
          memberMap.get(memberId);

        if (!member) {
          return null;
        }

        return {

          memberId,

          rating:
            member.ratingNormal,

        };

      })
      .filter(Boolean);

  if (
    teamA.length !== 2 ||
    teamB.length !== 2
  ) {
    return null;
  }

  return calculateTeamRatingResult({

    teamA,

    teamB,

    teamAActualScore:
      match.scoreA > match.scoreB
        ? 1
        : 0,

  });

}
