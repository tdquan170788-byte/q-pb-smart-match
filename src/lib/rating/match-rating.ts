import type {
  MatchRecord,
  Member,
} from "@/types";

import {
  calculateTeamRatingResult,
  type TeamRatingMemberInput,
  type TeamRatingResult,
} from "./team-rating";

export function calculateMatchRating(
  match: MatchRecord,
  members: Member[]
): TeamRatingResult | null {
  if (match.scoreA === match.scoreB) {
    return null;
  }

  if (
    match.teamA.memberIds.length !== 2 ||
    match.teamB.memberIds.length !== 2
  ) {
    return null;
  }

  const memberMap = new Map(
    members.map((member) => [
      member.id,
      member,
    ])
  );

  const teamA =
    buildTeamRatingMembers({
      memberIds:
        match.teamA.memberIds,

      memberMap,

      mode:
        getMatchRatingMode(match),
    });

  const teamB =
    buildTeamRatingMembers({
      memberIds:
        match.teamB.memberIds,

      memberMap,

      mode:
        getMatchRatingMode(match),
    });

  if (!teamA || !teamB) {
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

function buildTeamRatingMembers({
  memberIds,
  memberMap,
  mode,
}: {
  memberIds: string[];

  memberMap: Map<string, Member>;

  mode: "normal" | "team";
}): TeamRatingMemberInput[] | null {
  const teamMembers:
    TeamRatingMemberInput[] = [];

  for (const memberId of memberIds) {
    const member =
      memberMap.get(memberId);

    if (!member) {
      return null;
    }

    teamMembers.push({
      memberId,

      rating:
        mode === "team"
          ? member.ratingTeam
          : member.ratingNormal,
    });
  }

  return teamMembers;
}

function getMatchRatingMode(
  match: MatchRecord
): "normal" | "team" {
  /**
   * MatchRecord hiện chưa lưu mode trực tiếp.
   *
   * Vì vậy tạm thời dùng Normal Rating.
   * Khi tích hợp với SessionRecord ở bước sau,
   * mode sẽ được truyền rõ ràng vào calculator.
   */
  void match;

  return "normal";
}
