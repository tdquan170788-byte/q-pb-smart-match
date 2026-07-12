import type {
  MatchRecord,
  Member,
  SessionMode,
  SessionRecord,
} from "@/types";

export type RecentActivityWinner =
  | "team-a"
  | "team-b";

export type RecentMatchActivity = {
  id: string;

  matchId: string;
  sessionId: string;

  sessionDate: string;
  createdAt: string;

  round: number;
  court: number;

  mode: SessionMode;

  scoreA: number;
  scoreB: number;

  winner: RecentActivityWinner;

  teamAMemberIds: string[];
  teamBMemberIds: string[];

  teamAMemberNames: string[];
  teamBMemberNames: string[];

  winnerMemberIds: string[];
  loserMemberIds: string[];

  winnerMemberNames: string[];
  loserMemberNames: string[];

  title: string;
  description: string;
};

export type RecentActivityStatistics = {
  activities: RecentMatchActivity[];

  totalCompletedMatches: number;

  latestActivity:
    | RecentMatchActivity
    | null;
};

export type BuildRecentActivityStatisticsParams = {
  members: Member[];

  sessions: SessionRecord[];

  matches: MatchRecord[];

  /**
   * Số hoạt động tối đa trả về.
   *
   * Mặc định 8.
   */
  limit?: number;
};

const DEFAULT_ACTIVITY_LIMIT = 8;

export function buildRecentActivityStatistics({
  members,
  sessions,
  matches,
  limit = DEFAULT_ACTIVITY_LIMIT,
}: BuildRecentActivityStatisticsParams): RecentActivityStatistics {
  const safeLimit =
    normalizePositiveInteger(
      limit,
      DEFAULT_ACTIVITY_LIMIT
    );

  const memberNameMap =
    new Map<string, string>();

  for (const member of members) {
    if (
      !member ||
      typeof member.id !== "string" ||
      !member.id.trim()
    ) {
      continue;
    }

    memberNameMap.set(
      member.id,
      member.name?.trim() ||
        "Không xác định"
    );
  }

  const sessionMap =
    new Map<
      string,
      SessionRecord
    >();

  for (const session of sessions) {
    if (
      !session ||
      typeof session.id !== "string" ||
      !session.id.trim()
    ) {
      continue;
    }

    sessionMap.set(
      session.id,
      session
    );
  }

  const completedMatches =
    matches
      .filter(isCompletedMatch)
      .filter((match) =>
        sessionMap.has(match.sessionId)
      )
      .sort(compareMatchesNewestFirst);

  const activities =
    completedMatches
      .slice(0, safeLimit)
      .map((match) => {
        const session =
          sessionMap.get(
            match.sessionId
          );

        if (!session) {
          return null;
        }

        return createRecentActivity({
          match,
          session,
          memberNameMap,
        });
      })
      .filter(
        (
          activity
        ): activity is RecentMatchActivity =>
          activity !== null
      );

  return {
    activities,

    totalCompletedMatches:
      completedMatches.length,

    latestActivity:
      activities[0] ?? null,
  };
}

function createRecentActivity({
  match,
  session,
  memberNameMap,
}: {
  match: MatchRecord;

  session: SessionRecord;

  memberNameMap: Map<
    string,
    string
  >;
}): RecentMatchActivity {
  const teamAMemberIds = [
    ...match.teamA.memberIds,
  ];

  const teamBMemberIds = [
    ...match.teamB.memberIds,
  ];

  const teamAMemberNames =
    teamAMemberIds.map(
      (memberId) =>
        memberNameMap.get(
          memberId
        ) ?? "Không xác định"
    );

  const teamBMemberNames =
    teamBMemberIds.map(
      (memberId) =>
        memberNameMap.get(
          memberId
        ) ?? "Không xác định"
    );

  const winner:
    RecentActivityWinner =
    match.scoreA > match.scoreB
      ? "team-a"
      : "team-b";

  const winnerMemberIds =
    winner === "team-a"
      ? teamAMemberIds
      : teamBMemberIds;

  const loserMemberIds =
    winner === "team-a"
      ? teamBMemberIds
      : teamAMemberIds;

  const winnerMemberNames =
    winner === "team-a"
      ? teamAMemberNames
      : teamBMemberNames;

  const loserMemberNames =
    winner === "team-a"
      ? teamBMemberNames
      : teamAMemberNames;

  return {
    id: `activity_${match.id}`,

    matchId: match.id,

    sessionId:
      match.sessionId,

    sessionDate:
      session.date,

    createdAt:
      match.createdAt ??
      session.createdAt,

    round:
      match.round,

    court:
      match.court ?? 1,

    mode:
      session.mode,

    scoreA:
      match.scoreA,

    scoreB:
      match.scoreB,

    winner,

    teamAMemberIds,

    teamBMemberIds,

    teamAMemberNames,

    teamBMemberNames,

    winnerMemberIds,

    loserMemberIds,

    winnerMemberNames,

    loserMemberNames,

    title: `${formatTeamNames(
      winnerMemberNames
    )} thắng ${formatTeamNames(
      loserMemberNames
    )}`,

    description: `${match.scoreA}–${match.scoreB} • ${
      session.mode === "team"
        ? "Team"
        : "Normal"
    } • Round ${match.round}`,
  };
}

function isCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(match.scoreA) ||
    !Number.isFinite(match.scoreB)
  ) {
    return false;
  }

  if (
    match.scoreA < 0 ||
    match.scoreB < 0
  ) {
    return false;
  }

  if (
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  return (
    match.scoreA !==
    match.scoreB
  );
}

function compareMatchesNewestFirst(
  firstMatch: MatchRecord,
  secondMatch: MatchRecord
): number {
  const firstTimestamp =
    parseTimestamp(
      firstMatch.createdAt
    );

  const secondTimestamp =
    parseTimestamp(
      secondMatch.createdAt
    );

  if (
    secondTimestamp !==
    firstTimestamp
  ) {
    return (
      secondTimestamp -
      firstTimestamp
    );
  }

  if (
    firstMatch.sessionId !==
    secondMatch.sessionId
  ) {
    return secondMatch.sessionId.localeCompare(
      firstMatch.sessionId
    );
  }

  if (
    secondMatch.round !==
    firstMatch.round
  ) {
    return (
      secondMatch.round -
      firstMatch.round
    );
  }

  const firstCourt =
    firstMatch.court ?? 1;

  const secondCourt =
    secondMatch.court ?? 1;

  if (
    secondCourt !== firstCourt
  ) {
    return (
      secondCourt -
      firstCourt
    );
  }

  return secondMatch.id.localeCompare(
    firstMatch.id
  );
}

function formatTeamNames(
  names: string[]
): string {
  if (names.length === 0) {
    return "Đội không xác định";
  }

  return names.join(" / ");
}

function normalizePositiveInteger(
  value: number,
  fallback: number
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return fallback;
  }

  return Math.max(
    1,
    Math.floor(value)
  );
}

function parseTimestamp(
  value?: string
): number {
  if (!value) {
    return 0;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? 0
    : timestamp;
}
