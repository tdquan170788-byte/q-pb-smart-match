import type {
  LastResult,
  MatchRecord,
  MatchResult,
  Member,
  MemberDetailStats,
  MemberSummary,
  RankingMode,
  RankingRebuildResult,
  RankingRow,
  RecentMatchItem,
  SessionMode,
  SessionRecord,
} from "@/types";

import { getMatches, getMembers, getSessions } from "@/lib/storage";

type RebuildInput = {
  members: Member[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
};

type MutableAgg = {
  memberId: string;
  memberName: string;
  nickname: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;
  pointsFor: number;
  pointsAgainst: number;
  last5: LastResult[];
};

const BASE_RATING = 1000;
const K_FACTOR = 24;

function createEmptyAgg(member: Member, rating: number): MutableAgg {
  return {
    memberId: member.id,
    memberName: member.name,
    nickname: member.nickname ?? "",
    rating,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    last5: [],
  };
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function clampRating(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildRowsForMode(
  members: Member[],
  sessions: SessionRecord[],
  matches: MatchRecord[],
  mode: RankingMode
): {
  rows: RankingRow[];
  ratingMap: Map<string, number>;
  statsMap: Map<string, MutableAgg>;
} {
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const memberMap = new Map(members.map((member) => [member.id, member]));

  const getInitialRating = (member: Member): number =>
    mode === "normal"
      ? member.ratingNormal ?? BASE_RATING
      : member.ratingTeam ?? BASE_RATING;

  const statsMap = new Map<string, MutableAgg>();

  for (const member of members) {
    statsMap.set(member.id, createEmptyAgg(member, getInitialRating(member)));
  }

  const modeMatches = matches
    .filter((match) => {
      const session = sessionMap.get(match.sessionId);
      const sessionMode = session?.mode ?? "normal";

      return sessionMode === mode;
    })
    .slice()
    .sort((a, b) => {
      const sessionA = sessionMap.get(a.sessionId)?.createdAt ?? "";
      const sessionB = sessionMap.get(b.sessionId)?.createdAt ?? "";

      if (sessionA !== sessionB) {
        return sessionA.localeCompare(sessionB);
      }

      if (a.round !== b.round) {
        return a.round - b.round;
      }

      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    });

  for (const match of modeMatches) {
    const teamAMembers = match.teamA.memberIds
      .map((memberId) => memberMap.get(memberId))
      .filter((member): member is Member => Boolean(member));

    const teamBMembers = match.teamB.memberIds
      .map((memberId) => memberMap.get(memberId))
      .filter((member): member is Member => Boolean(member));

    if (teamAMembers.length === 0 || teamBMembers.length === 0) {
      continue;
    }

    const teamAAggs = teamAMembers
      .map((member) => statsMap.get(member.id))
      .filter((agg): agg is MutableAgg => Boolean(agg));

    const teamBAggs = teamBMembers
      .map((member) => statsMap.get(member.id))
      .filter((agg): agg is MutableAgg => Boolean(agg));

    if (teamAAggs.length === 0 || teamBAggs.length === 0) {
      continue;
    }

    const teamARating =
      teamAAggs.reduce((sum, item) => sum + item.rating, 0) /
      teamAAggs.length;

    const teamBRating =
      teamBAggs.reduce((sum, item) => sum + item.rating, 0) /
      teamBAggs.length;

    let resultA = 0.5;
    let resultB = 0.5;

    if (match.scoreA > match.scoreB) {
      resultA = 1;
      resultB = 0;
    } else if (match.scoreA < match.scoreB) {
      resultA = 0;
      resultB = 1;
    }

    const expectedA = expectedScore(teamARating, teamBRating);
    const expectedB = expectedScore(teamBRating, teamARating);

    const deltaA = K_FACTOR * (resultA - expectedA);
    const deltaB = K_FACTOR * (resultB - expectedB);

    for (const item of teamAAggs) {
      item.rating = clampRating(item.rating + deltaA);
      item.matches += 1;
      item.pointsFor += match.scoreA;
      item.pointsAgainst += match.scoreB;

      if (resultA === 1) {
        item.wins += 1;
        item.last5.push("W");
      } else if (resultA === 0) {
        item.losses += 1;
        item.last5.push("L");
      } else {
        item.draws += 1;
        item.last5.push("D");
      }

      if (item.last5.length > 5) {
        item.last5 = item.last5.slice(-5);
      }
    }

    for (const item of teamBAggs) {
      item.rating = clampRating(item.rating + deltaB);
      item.matches += 1;
      item.pointsFor += match.scoreB;
      item.pointsAgainst += match.scoreA;

      if (resultB === 1) {
        item.wins += 1;
        item.last5.push("W");
      } else if (resultB === 0) {
        item.losses += 1;
        item.last5.push("L");
      } else {
        item.draws += 1;
        item.last5.push("D");
      }

      if (item.last5.length > 5) {
        item.last5 = item.last5.slice(-5);
      }
    }
  }

  const rows: RankingRow[] = members.map((member) => {
    const agg = statsMap.get(member.id)!;

    const pointDiff = agg.pointsFor - agg.pointsAgainst;
    const winRate =
      agg.matches > 0 ? Math.round((agg.wins / agg.matches) * 100) : 0;

    const rankScore =
      agg.rating + agg.wins * 3 - agg.losses + pointDiff * 0.01;

    return {
      memberId: member.id,
      memberName: member.name,
      nickname: member.nickname ?? "",

      rating: clampRating(agg.rating),
      rankScore: Math.round(rankScore * 100) / 100,

      wins: agg.wins,
      losses: agg.losses,
      draws: agg.draws,
      matches: agg.matches,

      winRate,
      pointsFor: agg.pointsFor,
      pointsAgainst: agg.pointsAgainst,
      pointDiff,

      last5: agg.last5,
    };
  });

  rows.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;

    return a.memberName.localeCompare(b.memberName, "vi");
  });

  const ratingMap = new Map<string, number>();

  for (const row of rows) {
    ratingMap.set(row.memberId, row.rating);
  }

  return {
    rows,
    ratingMap,
    statsMap,
  };
}

export function rebuildRankingData(input: RebuildInput): RankingRebuildResult {
  const { members, sessions, matches } = input;

  const normal = buildRowsForMode(members, sessions, matches, "normal");
  const team = buildRowsForMode(members, sessions, matches, "team");

  const updatedMembers: Member[] = members.map((member) => {
    const normalAgg = normal.statsMap.get(member.id);
    const teamAgg = team.statsMap.get(member.id);

    const wins = (normalAgg?.wins ?? 0) + (teamAgg?.wins ?? 0);
    const losses = (normalAgg?.losses ?? 0) + (teamAgg?.losses ?? 0);
    const matchesTotal =
      (normalAgg?.matches ?? 0) + (teamAgg?.matches ?? 0);

    const ratingNormal = normal.ratingMap.get(member.id) ?? BASE_RATING;
    const ratingTeam = team.ratingMap.get(member.id) ?? BASE_RATING;

    const overallRating = clampRating((ratingNormal + ratingTeam) / 2);

    return {
      ...member,

      rating: overallRating,
      wins,
      losses,
      matches: matchesTotal,

      ratingNormal,
      winsNormal: normalAgg?.wins ?? 0,
      lossesNormal: normalAgg?.losses ?? 0,
      matchesNormal: normalAgg?.matches ?? 0,
      pointsForNormal: normalAgg?.pointsFor ?? 0,
      pointsAgainstNormal: normalAgg?.pointsAgainst ?? 0,

      ratingTeam,
      winsTeam: teamAgg?.wins ?? 0,
      lossesTeam: teamAgg?.losses ?? 0,
      matchesTeam: teamAgg?.matches ?? 0,
      pointsForTeam: teamAgg?.pointsFor ?? 0,
      pointsAgainstTeam: teamAgg?.pointsAgainst ?? 0,
    };
  });

  return {
    members: updatedMembers,
    normalRows: normal.rows,
    teamRows: team.rows,
  };
}

export function getRanking(mode: RankingMode = "normal"): RankingRow[] {
  const result = rebuildRankingData({
    members: getMembers(),
    sessions: getSessions(),
    matches: getMatches(),
  });

  return mode === "normal" ? result.normalRows : result.teamRows;
}

function emptySummary(rating = BASE_RATING): MemberSummary {
  return {
    rating,
    rankScore: rating,

    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,

    winRate: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDiff: 0,

    streakType: "none",
    streakCount: 0,
  };
}

function rowToSummary(
  row: RankingRow | undefined,
  fallbackRating = BASE_RATING
): MemberSummary {
  if (!row) {
    return emptySummary(fallbackRating);
  }

  const lastResult = row.last5[row.last5.length - 1];

  return {
    rating: row.rating,
    rankScore: row.rankScore,

    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    matches: row.matches,

    winRate: row.matches > 0 ? row.wins / row.matches : 0,
    pointsFor: row.pointsFor,
    pointsAgainst: row.pointsAgainst,
    pointDiff: row.pointDiff,

    streakType:
      row.last5.length === 0
        ? "none"
        : lastResult === "W"
        ? "win"
        : lastResult === "L"
        ? "loss"
        : "draw",

    streakCount: (() => {
      if (row.last5.length === 0) {
        return 0;
      }

      let count = 0;

      for (let i = row.last5.length - 1; i >= 0; i--) {
        if (row.last5[i] === lastResult) {
          count++;
        } else {
          break;
        }
      }

      return count;
    })(),
  };
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

  const rebuilt = rebuildRankingData({
    members,
    sessions,
    matches,
  });

  const summaryNormalRow = rebuilt.normalRows.find(
    (row) => row.memberId === memberId
  );

  const summaryTeamRow = rebuilt.teamRows.find(
    (row) => row.memberId === memberId
  );

  const summaryNormal = rowToSummary(summaryNormalRow, member.ratingNormal);
  const summaryTeam = rowToSummary(summaryTeamRow, member.ratingTeam);

  const totalMatches = summaryNormal.matches + summaryTeam.matches;
  const totalWins = summaryNormal.wins + summaryTeam.wins;
  const totalLosses = summaryNormal.losses + summaryTeam.losses;
  const totalDraws = summaryNormal.draws + summaryTeam.draws;
  const totalPointsFor = summaryNormal.pointsFor + summaryTeam.pointsFor;
  const totalPointsAgainst =
    summaryNormal.pointsAgainst + summaryTeam.pointsAgainst;

  const summary: MemberSummary = {
    rating: member.rating,
    rankScore:
      Math.round(((summaryNormal.rankScore + summaryTeam.rankScore) / 2) * 100) /
      100,

    wins: totalWins,
    losses: totalLosses,
    draws: totalDraws,
    matches: totalMatches,

    winRate: totalMatches > 0 ? totalWins / totalMatches : 0,
    pointsFor: totalPointsFor,
    pointsAgainst: totalPointsAgainst,
    pointDiff: totalPointsFor - totalPointsAgainst,

    streakType:
      summaryNormal.streakCount >= summaryTeam.streakCount
        ? summaryNormal.streakType
        : summaryTeam.streakType,
    streakCount: Math.max(summaryNormal.streakCount, summaryTeam.streakCount),
  };

  const memberMap = new Map(members.map((item) => [item.id, item]));
  const sessionMap = new Map(sessions.map((session) => [session.id, session]));
  const sessionModeMap = new Map(
    sessions.map((session) => [
      session.id,
      (session.mode ?? "normal") as SessionMode,
    ])
  );

  const memberMatches = matches.filter(
    (match) =>
      match.teamA.memberIds.includes(memberId) ||
      match.teamB.memberIds.includes(memberId)
  );

  const recentMatches: RecentMatchItem[] = memberMatches
    .map((match) => {
      const mode: SessionMode = sessionModeMap.get(match.sessionId) ?? "normal";

      const teamAMemberIds = match.teamA.memberIds;
      const teamBMemberIds = match.teamB.memberIds;

      const isInTeamA = teamAMemberIds.includes(memberId);
      const isInTeamB = teamBMemberIds.includes(memberId);

      if (!isInTeamA && !isInTeamB) {
        return null;
      }

      const myTeamMemberIds = isInTeamA ? teamAMemberIds : teamBMemberIds;
      const opponentMemberIds = isInTeamA ? teamBMemberIds : teamAMemberIds;

      const partnerMemberIds = myTeamMemberIds.filter((id) => id !== memberId);

      const partnerNames = partnerMemberIds.map(
        (id) => memberMap.get(id)?.name ?? id
      );

      const opponentNames = opponentMemberIds.map(
        (id) => memberMap.get(id)?.name ?? id
      );

      let result: MatchResult = "draw";
      let scoreFor = 0;
      let scoreAgainst = 0;

      if (isInTeamA) {
        scoreFor = match.scoreA;
        scoreAgainst = match.scoreB;

        if (match.scoreA > match.scoreB) result = "win";
        else if (match.scoreA < match.scoreB) result = "loss";
      } else {
        scoreFor = match.scoreB;
        scoreAgainst = match.scoreA;

        if (match.scoreB > match.scoreA) result = "win";
        else if (match.scoreB < match.scoreA) result = "loss";
      }

      const session = sessionMap.get(match.sessionId);

      return {
        matchId: match.id,
        sessionId: match.sessionId,
        mode,
        round: match.round,
        court: match.court,

        scoreFor,
        scoreAgainst,
        result,

        partnerMemberIds,
        partnerNames,
        opponentMemberIds,
        opponentNames,

        playedAt: session?.date ?? match.createdAt,
      };
    })
    .filter((item): item is RecentMatchItem => item !== null)
    .sort((a, b) => {
      const dateA = a.playedAt ? new Date(a.playedAt).getTime() : 0;
      const dateB = b.playedAt ? new Date(b.playedAt).getTime() : 0;

      return dateB - dateA;
    })
    .slice(0, 20);

  const partnerMap = new Map<
    string,
    {
      memberId: string;
      name: string;
      count: number;
      winsTogether: number;
      lossesTogether: number;
    }
  >();

  const opponentMap = new Map<
    string,
    {
      memberId: string;
      name: string;
      count: number;
      winsAgainst: number;
      lossesAgainst: number;
    }
  >();

  for (const match of matches) {
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

    const myScore = isInTeamA ? match.scoreA : match.scoreB;
    const opponentScore = isInTeamA ? match.scoreB : match.scoreA;

    for (const partnerMemberId of myTeamMemberIds) {
      if (partnerMemberId === memberId) {
        continue;
      }

      const current = partnerMap.get(partnerMemberId) ?? {
        memberId: partnerMemberId,
        name: memberMap.get(partnerMemberId)?.name ?? partnerMemberId,
        count: 0,
        winsTogether: 0,
        lossesTogether: 0,
      };

      current.count += 1;

      if (myScore > opponentScore) {
        current.winsTogether += 1;
      } else if (myScore < opponentScore) {
        current.lossesTogether += 1;
      }

      partnerMap.set(partnerMemberId, current);
    }

    for (const opponentMemberId of opponentMemberIds) {
      const current = opponentMap.get(opponentMemberId) ?? {
        memberId: opponentMemberId,
        name: memberMap.get(opponentMemberId)?.name ?? opponentMemberId,
        count: 0,
        winsAgainst: 0,
        lossesAgainst: 0,
      };

      current.count += 1;

      if (myScore > opponentScore) {
        current.winsAgainst += 1;
      } else if (myScore < opponentScore) {
        current.lossesAgainst += 1;
      }

      opponentMap.set(opponentMemberId, current);
    }
  }

  const topPartners = [...partnerMap.values()]
    .sort((a, b) => b.count - a.count || b.winsTogether - a.winsTogether)
    .slice(0, 10);

  const topOpponents = [...opponentMap.values()]
    .sort((a, b) => b.count - a.count || b.winsAgainst - a.winsAgainst)
    .slice(0, 10);

  return {
    member,
    summary,
    summaryNormal,
    summaryTeam,
    recentMatches,
    topPartners,
    topOpponents,
  };
}
