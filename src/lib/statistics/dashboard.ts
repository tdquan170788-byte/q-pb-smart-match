import type {
  GeneratedSchedule,
  MatchRecord,
  Member,
  SessionRecord,
} from "@/types";

export type DashboardStatistics = {
  totalMembers: number;

  totalSessions: number;

  normalSessionCount: number;

  teamSessionCount: number;

  totalSavedMatches: number;

  completedMatchCount: number;

  pendingMatchCount: number;

  normalCompletedMatchCount: number;

  teamCompletedMatchCount: number;

  totalScheduledMatches: number;

  totalRounds: number;

  frozenSessionCount: number;

  unfrozenSessionCount: number;

  completionPercent: number;
};

export type BuildDashboardStatisticsParams = {
  members: Member[];

  sessions: SessionRecord[];

  matches: MatchRecord[];

  /**
   * Có thể truyền lịch đấu đã được resolve sẵn
   * để thống kê tổng round và tổng trận theo lịch.
   *
   * Nếu không truyền, engine sẽ ưu tiên sử dụng
   * scheduleSnapshot trong SessionRecord.
   */
  schedules?: GeneratedSchedule[];
};

export function buildDashboardStatistics({
  members,
  sessions,
  matches,
  schedules = [],
}: BuildDashboardStatisticsParams): DashboardStatistics {
  const validMembers =
    normalizeMembers(members);

  const validSessions =
    normalizeSessions(sessions);

  const validMatches =
    normalizeMatches(matches);

  const sessionMap = new Map(
    validSessions.map((session) => [
      session.id,
      session,
    ])
  );

  const scheduleMap =
    buildScheduleMap({
      sessions: validSessions,
      schedules,
    });

  const normalSessionCount =
    validSessions.filter(
      (session) =>
        session.mode === "normal"
    ).length;

  const teamSessionCount =
    validSessions.filter(
      (session) =>
        session.mode === "team"
    ).length;

  const frozenSessionCount =
    validSessions.filter(
      (session) =>
        Boolean(
          session.scheduleSnapshot
        )
    ).length;

  const unfrozenSessionCount =
    Math.max(
      0,
      validSessions.length -
        frozenSessionCount
    );

  let completedMatchCount = 0;
  let normalCompletedMatchCount = 0;
  let teamCompletedMatchCount = 0;

  for (const match of validMatches) {
    if (!isCompletedMatch(match)) {
      continue;
    }

    completedMatchCount += 1;

    const session =
      sessionMap.get(
        match.sessionId
      );

    if (
      session?.mode === "team"
    ) {
      teamCompletedMatchCount += 1;
    } else {
      normalCompletedMatchCount += 1;
    }
  }

  const totalRounds =
    calculateTotalRounds(
      scheduleMap
    );

  const totalScheduledMatches =
    calculateTotalScheduledMatches(
      scheduleMap
    );

  /**
   * Một trận chưa lưu chưa tồn tại trong matches.repo,
   * vì vậy pending được tính từ tổng lịch đã sinh.
   *
   * Nếu session cũ không có snapshot thì tổng lịch có
   * thể nhỏ hơn số match đã lưu. Math.max giúp tránh âm.
   */
  const effectiveScheduledMatchCount =
    Math.max(
      totalScheduledMatches,
      validMatches.length
    );

  const pendingMatchCount =
    Math.max(
      0,
      effectiveScheduledMatchCount -
        completedMatchCount
    );

  return {
    totalMembers:
      validMembers.length,

    totalSessions:
      validSessions.length,

    normalSessionCount,

    teamSessionCount,

    totalSavedMatches:
      validMatches.length,

    completedMatchCount,

    pendingMatchCount,

    normalCompletedMatchCount,

    teamCompletedMatchCount,

    totalScheduledMatches:
      effectiveScheduledMatchCount,

    totalRounds,

    frozenSessionCount,

    unfrozenSessionCount,

    completionPercent:
      calculateCompletionPercent({
        completedMatchCount,

        totalScheduledMatches:
          effectiveScheduledMatchCount,
      }),
  };
}

function buildScheduleMap({
  sessions,
  schedules,
}: {
  sessions: SessionRecord[];

  schedules: GeneratedSchedule[];
}): Map<
  string,
  GeneratedSchedule
> {
  const scheduleMap =
    new Map<
      string,
      GeneratedSchedule
    >();

  for (
    const session of sessions
  ) {
    if (
      session.scheduleSnapshot
    ) {
      scheduleMap.set(
        session.id,
        session.scheduleSnapshot
      );
    }
  }

  /**
   * Lịch được truyền trực tiếp có quyền ưu tiên
   * hơn snapshot trong session.
   */
  for (
    const schedule of schedules
  ) {
    if (
      !schedule ||
      !schedule.sessionId
    ) {
      continue;
    }

    scheduleMap.set(
      schedule.sessionId,
      schedule
    );
  }

  return scheduleMap;
}

function calculateTotalRounds(
  scheduleMap: Map<
    string,
    GeneratedSchedule
  >
): number {
  let totalRounds = 0;

  for (
    const schedule of
    scheduleMap.values()
  ) {
    totalRounds +=
      Array.isArray(
        schedule.rounds
      )
        ? schedule.rounds.length
        : Math.max(
            0,
            Number(
              schedule.totalRounds ??
                0
            )
          );
  }

  return totalRounds;
}

function calculateTotalScheduledMatches(
  scheduleMap: Map<
    string,
    GeneratedSchedule
  >
): number {
  let totalMatches = 0;

  for (
    const schedule of
    scheduleMap.values()
  ) {
    if (
      !Array.isArray(
        schedule.rounds
      )
    ) {
      continue;
    }

    for (
      const round of
      schedule.rounds
    ) {
      totalMatches +=
        Array.isArray(
          round.matches
        )
          ? round.matches.length
          : 0;
    }
  }

  return totalMatches;
}

function isCompletedMatch(
  match: MatchRecord
): boolean {
  if (
    !Number.isFinite(
      match.scoreA
    ) ||
    !Number.isFinite(
      match.scoreB
    )
  ) {
    return false;
  }

  if (
    match.scoreA < 0 ||
    match.scoreB < 0
  ) {
    return false;
  }

  /**
   * 0–0 là trạng thái mặc định,
   * chưa được tính là đã hoàn thành.
   */
  if (
    match.scoreA === 0 &&
    match.scoreB === 0
  ) {
    return false;
  }

  /**
   * Pickleball không có kết quả hòa.
   */
  if (
    match.scoreA ===
    match.scoreB
  ) {
    return false;
  }

  return true;
}

function calculateCompletionPercent({
  completedMatchCount,
  totalScheduledMatches,
}: {
  completedMatchCount: number;

  totalScheduledMatches: number;
}): number {
  if (
    totalScheduledMatches <= 0
  ) {
    return 0;
  }

  return clampNumber(
    Math.round(
      (completedMatchCount /
        totalScheduledMatches) *
        100
    ),
    0,
    100
  );
}

function normalizeMembers(
  members: Member[]
): Member[] {
  if (!Array.isArray(members)) {
    return [];
  }

  const memberMap =
    new Map<string, Member>();

  for (const member of members) {
    if (
      !member ||
      !member.id
    ) {
      continue;
    }

    memberMap.set(
      member.id,
      member
    );
  }

  return [
    ...memberMap.values(),
  ];
}

function normalizeSessions(
  sessions: SessionRecord[]
): SessionRecord[] {
  if (
    !Array.isArray(sessions)
  ) {
    return [];
  }

  const sessionMap =
    new Map<
      string,
      SessionRecord
    >();

  for (
    const session of sessions
  ) {
    if (
      !session ||
      !session.id
    ) {
      continue;
    }

    sessionMap.set(
      session.id,
      session
    );
  }

  return [
    ...sessionMap.values(),
  ];
}

function normalizeMatches(
  matches: MatchRecord[]
): MatchRecord[] {
  if (
    !Array.isArray(matches)
  ) {
    return [];
  }

  const matchMap =
    new Map<
      string,
      MatchRecord
    >();

  for (
    const match of matches
  ) {
    if (
      !match ||
      !match.id
    ) {
      continue;
    }

    matchMap.set(
      match.id,
      match
    );
  }

  return [
    ...matchMap.values(),
  ];
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}
