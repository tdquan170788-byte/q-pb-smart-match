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

  const teamA: TeamRatingMemberInput[] = [];

for (const memberId of match.teamA.memberIds) {
  const member = memberMap.get(memberId);

  if (!member) {
    return null;
  }

  teamA.push({
    memberId,
    rating: member.ratingNormal,
  });
}

  const teamB: TeamRatingMemberInput[] = [];

for (const memberId of match.teamB.memberIds) {
  const member = memberMap.get(memberId);

  if (!member) {
    return null;
  }

  teamB.push({
    memberId,
    rating: member.ratingNormal,
  });
}

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
