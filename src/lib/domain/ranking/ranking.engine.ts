import type {
  LastResult,
  MatchRecord,
  Member,
  MemberSummary,
  RankingRow,
  SessionRecord,
  StreakType,
} from "@/types";

type StatsAccumulator = {
  memberId: string;
  memberName: string;
  nickname?: string;

  rating: number;
  wins: number;
  losses: number;
  draws: number;
  matches: number;

  pointsFor: number;
  pointsAgainst: number;

  lastResults: LastResult[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyAccumulator(member: Member): StatsAccumulator {
  return {
    memberId: member.id,
    memberName: member.name,
    nickname: member.nickname ?? "",

    rating: 1000,
    wins: 0,
    losses: 0,
    draws: 0,
    matches: 0,

    pointsFor: 0,
    pointsAgainst: 0,

    lastResults: [],
  };
}

function calcExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calcEloDelta(params: {
  ratingA: number;
  ratingB: number;
  scoreA: number;
  k?: number;
}): number {
  const k = params.k ?? 24;
  const expectedA = calcExpectedScore(params.ratingA, params.ratingB);

  return k * (params.scoreA - expectedA);
}

function getMatchResult(scoreFor: number, scoreAgainst: number): LastResult {
  if (scoreFor > scoreAgainst) return "W";
  if (scoreFor < scoreAgainst) return "L";
  return "D";
}

function applyMatchToStats(params: {
  match: MatchRecord;
  statsMap: Map<string, StatsAccumulator>;
}): void {
  const { match, statsMap } = params;

  const teamAMemberIds = match.teamA.memberIds;
  const teamBMemberIds = match.teamB.memberIds;

  if (teamAMemberIds.length === 0 || teamBMemberIds.length === 0) {
    return;
  }

  const avgA =
    teamAMemberIds.reduce(
      (sum, memberId) => sum + (statsMap.get(memberId)?.rating ?? 1000),
      0
    ) / teamAMemberIds.length;

  const avgB =
    teamBMemberIds.reduce(
      (sum, memberId) => sum + (statsMap.get(memberId)?.rating ?? 1000),
      0
    ) / teamBMemberIds.length;

  let scoreAResult = 0.5;
  let scoreBResult = 0.5;

  if (match.scoreA > match.scoreB) {
    scoreAResult = 1;
    scoreBResult = 0;
  } else if (match.scoreA < match.scoreB) {
    scoreAResult = 0;
    scoreBResult = 1;
  }

  const deltaA = calcEloDelta({
    ratingA: avgA,
    ratingB: avgB,
    scoreA: scoreAResult,
  });

  const deltaB = calcEloDelta({
    ratingA: avgB,
    ratingB: avgA,
    scoreA: scoreBResult,
  });

  for (const memberId of teamAMemberIds) {
    const row = statsMap.get(memberId);

    if (!row) {
      continue;
    }

    row.matches += 1;
    row.pointsFor += match.scoreA;
    row.pointsAgainst += match.scoreB;
    row.rating += deltaA;

    if (match.scoreA > match.scoreB) {
      row.wins += 1;
    } else if (match.scoreA < match.scoreB) {
      row.losses += 1;
    } else {
      row.draws += 1;
    }

    row.lastResults.push(getMatchResult(match.scoreA, match.scoreB));

    if (row.lastResults.length > 5) {
      row.lastResults.shift();
    }
  }

  for (const memberId of teamBMemberIds) {
    const row = statsMap.get(memberId);

    if (!row) {
      continue;
    }

    row.matches += 1;
    row.pointsFor += match.scoreB;
    row.pointsAgainst += match.scoreA;
    row.rating += deltaB;

    if (match.scoreB > match.scoreA) {
      row.wins += 1;
    } else if (match.scoreB < match.scoreA) {
      row.losses += 1;
    } else {
      row.draws += 1;
    }

    row.lastResults.push(getMatchResult(match.scoreB, match.scoreA));

    if (row.lastResults.length > 5) {
      row.lastResults.shift();
    }
  }
}

function finalizeRows(statsMap: Map<string, StatsAccumulator>): RankingRow[] {
  return [...statsMap.values()]
    .map((row) => {
      const pointDiff = row.pointsFor - row.pointsAgainst;
      const winRate = row.matches > 0 ? (row.wins / row.matches) * 100 : 0;

      return {
        memberId: row.memberId,
        memberName: row.memberName,
        nickname: row.nickname,

        rating: round2(row.rating),
        rankScore: round2(row.rating),

        wins: row.wins,
        losses: row.losses,
        draws: row.draws,
        matches: row.matches,

        winRate: round2(winRate),
        pointsFor: row.pointsFor,
        pointsAgainst: row.pointsAgainst,
        pointDiff,

        last5: row.lastResults,
      };
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
      if (b.wins !== a.wins) return b.wins - a.wins;

      return a.memberName.localeCompare(b.memberName, "vi");
    });
}

function buildSummaryFromRows(row?: RankingRow): MemberSummary {
  if (!row) {
    return {
      rating: 1000,
      rankScore: 1000,

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

  const { streakType, streakCount } = calcStreak(row.last5);

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

    streakType,
    streakCount,
  };
}

export function calcStreak(last5: LastResult[]): {
  streakType: StreakType;
  streakCount: number;
} {
  if (last5.length === 0) {
    return {
      streakType: "none",
      streakCount: 0,
    };
  }

  const reversed = [...last5].reverse();
  const first = reversed[0];

  let count = 0;

  for (const result of reversed) {
    if (result === first) {
      count += 1;
    } else {
      break;
    }
  }

  if (first === "W") {
    return {
      streakType: "win",
      streakCount: count,
    };
  }

  if (first === "L") {
    return {
      streakType: "loss",
      streakCount: count,
    };
  }

  return {
    streakType: "draw",
    streakCount: count,
  };
}

function mergeSummaries(
  normalSummary: MemberSummary,
  teamSummary: MemberSummary
): MemberSummary {
  const matches = normalSummary.matches + teamSummary.matches;
  const wins = normalSummary.wins + teamSummary.wins;
  const losses = normalSummary.losses + teamSummary.losses;
  const draws = normalSummary.draws + teamSummary.draws;
  const pointsFor = normalSummary.pointsFor + teamSummary.pointsFor;
  const pointsAgainst =
    normalSummary.pointsAgainst + teamSummary.pointsAgainst;

  const pointDiff = pointsFor - pointsAgainst;
  const rating = round2((normalSummary.rating + teamSummary.rating) / 2);
  const rankScore = rating;
  const winRate = matches > 0 ? wins / matches : 0;

  const streakSource =
    normalSummary.streakCount >= teamSummary.streakCount
      ? normalSummary
      : teamSummary;

  return {
    rating,
    rankScore,

    wins,
    losses,
    draws,
    matches,

    winRate,
    pointsFor,
    pointsAgainst,
    pointDiff,

    streakType: streakSource.streakType,
    streakCount: streakSource.streakCount,
  };
}

export function buildRanking(params: {
  members: Member[];
  sessions: SessionRecord[];
  matches: MatchRecord[];
}): {
  normalRows: RankingRow[];
  teamRows: RankingRow[];
  getSummaryForMember: (memberId: string) => {
    summary: MemberSummary;
    summaryNormal: MemberSummary;
    summaryTeam: MemberSummary;
  };
} {
  const { members, sessions, matches } = params;

  const sessionMap = new Map(sessions.map((session) => [session.id, session]));

  const normalStats = new Map(
    members.map((member) => [member.id, createEmptyAccumulator(member)])
  );

  const teamStats = new Map(
    members.map((member) => [member.id, createEmptyAccumulator(member)])
  );

  const sortedMatches = [...matches].sort((a, b) => {
    const sessionA = sessionMap.get(a.sessionId);
    const sessionB = sessionMap.get(b.sessionId);

    const dateA = sessionA?.date ?? "";
    const dateB = sessionB?.date ?? "";

    if (dateA !== dateB) return dateA.localeCompare(dateB);
    if (a.sessionId !== b.sessionId) {
      return a.sessionId.localeCompare(b.sessionId);
    }

    if (a.round !== b.round) return a.round - b.round;

    return (a.court ?? 1) - (b.court ?? 1);
  });

  for (const match of sortedMatches) {
    const session = sessionMap.get(match.sessionId);

    if (!session) {
      continue;
    }

    if (session.mode === "team") {
      applyMatchToStats({
        match,
        statsMap: teamStats,
      });
    } else {
      applyMatchToStats({
        match,
        statsMap: normalStats,
      });
    }
  }

  const normalRows = finalizeRows(normalStats);
  const teamRows = finalizeRows(teamStats);

  return {
    normalRows,
    teamRows,

    getSummaryForMember(memberId: string) {
      const normal = normalRows.find((row) => row.memberId === memberId);
      const team = teamRows.find((row) => row.memberId === memberId);

      const summaryNormal = buildSummaryFromRows(normal);
      const summaryTeam = buildSummaryFromRows(team);

      return {
        summary: mergeSummaries(summaryNormal, summaryTeam),
        summaryNormal,
        summaryTeam,
      };
    },
  };
}
