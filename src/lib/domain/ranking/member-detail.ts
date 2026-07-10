import type {
  MatchResult,
  Member,
  MemberDetailStats,
  OpponentStatItem,
  PartnerStatItem,
  RecentMatchItem,
  SessionMode,
} from "@/types";

import { getMatches, getMembers, getSessions } from "@/lib/storage";
import { buildRanking } from "./ranking.engine";

function getMemberMap(members: Member[]): Map<string, Member> {
  return new Map(members.map((member) => [member.id, member]));
}

function sortRecentMatches(a: RecentMatchItem, b: RecentMatchItem): number {
  const dateA = a.playedAt ? new Date(a.playedAt).getTime() : 0;
  const dateB = b.playedAt ? new Date(b.playedAt).getTime() : 0;

  if (dateB !== dateA) return dateB - dateA;
  if (a.round !== b.round) return b.round - a.round;

  return (b.court ?? 1) - (a.court ?? 1);
}

export function getMemberDetailStats(
  memberId: string
): MemberDetailStats | null {
  const members = getMembers();
  const sessions = getSessions();
  const matches = getMatches();

  const member = members.find((item) => item.id === memberId);

  if (!member) {
    return null;
  }

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const memberMap = getMemberMap(members);

  const ranking = buildRanking({
    members,
    sessions,
    matches,
  });

  const { summary, summaryNormal, summaryTeam } =
    ranking.getSummaryForMember(memberId);

  const recentMatches: RecentMatchItem[] = [];
  const partnerCounter = new Map<string, PartnerStatItem>();
  const opponentCounter = new Map<string, OpponentStatItem>();

  for (const match of matches) {
    const session = sessionMap.get(match.sessionId);

    if (!session) {
      continue;
    }

    const isInTeamA = match.teamA.memberIds.includes(memberId);
    const isInTeamB = match.teamB.memberIds.includes(memberId);

    if (!isInTeamA && !isInTeamB) {
      continue;
    }

    const myTeamMemberIds = isInTeamA
      ? match.teamA.memberIds
      : match.teamB.memberIds;

    const opponentMemberIds = isInTeamA
      ? match.teamB.memberIds
      : match.teamA.memberIds;

    const scoreFor = isInTeamA ? match.scoreA : match.scoreB;
    const scoreAgainst = isInTeamA ? match.scoreB : match.scoreA;

    const partnerMemberIds = myTeamMemberIds.filter((id) => id !== memberId);

    const partnerNames = partnerMemberIds.map(
      (id) => memberMap.get(id)?.name ?? id
    );

    const opponentNames = opponentMemberIds.map(
      (id) => memberMap.get(id)?.name ?? id
    );

    let result: MatchResult = "draw";

    if (scoreFor > scoreAgainst) {
      result = "win";
    } else if (scoreFor < scoreAgainst) {
      result = "loss";
    }

    recentMatches.push({
      matchId: match.id,
      sessionId: match.sessionId,
      mode: (session.mode ?? "normal") as SessionMode,
      round: match.round,
      court: match.court,

      scoreFor,
      scoreAgainst,
      result,

      partnerMemberIds,
      partnerNames,
      opponentMemberIds,
      opponentNames,

      playedAt: session.date ?? match.createdAt,
    });

    for (const partnerMemberId of partnerMemberIds) {
      const partner = memberMap.get(partnerMemberId);

      if (!partner) {
        continue;
      }

      const item: PartnerStatItem = partnerCounter.get(partnerMemberId) ?? {
        memberId: partnerMemberId,
        name: partner.name,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      item.count += 1;

      if (scoreFor > scoreAgainst) {
        item.winsTogether += 1;
      }

      if (scoreFor < scoreAgainst) {
        item.lossesTogether += 1;
      }

      partnerCounter.set(partnerMemberId, item);
    }

    for (const opponentMemberId of opponentMemberIds) {
      const opponent = memberMap.get(opponentMemberId);

      if (!opponent) {
        continue;
      }

      const item: OpponentStatItem =
        opponentCounter.get(opponentMemberId) ?? {
          memberId: opponentMemberId,
          name: opponent.name,
          count: 0,
          winsAgainst: 0,
          lossesAgainst: 0,
        };

      item.count += 1;

      if (scoreFor > scoreAgainst) {
        item.winsAgainst += 1;
      }

      if (scoreFor < scoreAgainst) {
        item.lossesAgainst += 1;
      }

      opponentCounter.set(opponentMemberId, item);
    }
  }

  return {
    member,
    summary,
    summaryNormal,
    summaryTeam,

    recentMatches: recentMatches.sort(sortRecentMatches).slice(0, 20),

    topPartners: [...partnerCounter.values()]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.winsTogether - a.winsTogether;
      })
      .slice(0, 10),

    topOpponents: [...opponentCounter.values()]
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return b.winsAgainst - a.winsAgainst;
      })
      .slice(0, 10),
  };
}
