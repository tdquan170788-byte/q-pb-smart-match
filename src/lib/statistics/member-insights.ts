import type {
  MatchRecord,
  Member,
  SessionMode,
  SessionRecord,
} from "@/types";

export type MemberMatchResult =
  | "win"
  | "loss";

export type MemberInsightPerson = {
  memberId: string;

  memberName: string;

  nickname?: string;
};

export type MemberModeStatistics = {
  mode: SessionMode;

  matches: number;

  wins: number;

  losses: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDifference: number;

  rating: number;
};

export type MemberRecentFormItem = {
  matchId: string;

  sessionId: string;

  sessionDate: string;

  mode: SessionMode;

  round: number;

  court: number;

  result: MemberMatchResult;

  scoreFor: number;

  scoreAgainst: number;
};

export type MemberPartnershipInsight = {
  partner: MemberInsightPerson;

  matches: number;

  wins: number;

  losses: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDifference: number;
};

export type MemberOpponentInsight = {
  opponent: MemberInsightPerson;

  meetings: number;

  wins: number;

  losses: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDifference: number;
};

export type MemberMatchHistoryItem = {
  matchId: string;

  sessionId: string;

  sessionDate: string;

  mode: SessionMode;

  round: number;

  court: number;

  result: MemberMatchResult;

  scoreFor: number;

  scoreAgainst: number;

  teammateIds: string[];

  teammateNames: string[];

  opponentIds: string[];

  opponentNames: string[];
};

export type MemberInsights = {
  member: MemberInsightPerson;

  overall: {
    matches: number;

    wins: number;

    losses: number;

    winRate: number;

    pointsFor: number;

    pointsAgainst: number;

    pointDifference: number;

    rating: number;
  };

  normal: MemberModeStatistics;

  team: MemberModeStatistics;

  recentForm: MemberRecentFormItem[];

  currentWinStreak: number;

  longestWinStreak: number;

  currentLossStreak: number;

  longestLossStreak: number;

  favoritePartner:
    | MemberPartnershipInsight
    | null;

  bestPartner:
    | MemberPartnershipInsight
    | null;

  mostFrequentOpponent:
    | MemberOpponentInsight
    | null;

  hardestOpponent:
    | MemberOpponentInsight
    | null;

  matchHistory: MemberMatchHistoryItem[];
};

export type BuildMemberInsightsParams = {
  memberId: string;

  members: Member[];

  sessions: SessionRecord[];

  matches: MatchRecord[];

  /**
   * Số trận gần nhất dùng cho Recent Form.
   *
   * Mặc định 5.
   */
  recentFormLimit?: number;

  /**
   * Đồng đội phải có ít nhất bao nhiêu trận
   * để được xét danh hiệu Best Partner.
   *
   * Mặc định 2.
   */
  minimumPartnerMatches?: number;
};

type PairAccumulator = {
  personId: string;

  matches: number;

  wins: number;

  losses: number;

  pointsFor: number;

  pointsAgainst: number;
};

type MemberMatchContext = {
  match: MatchRecord;

  session: SessionRecord;

  result: MemberMatchResult;

  scoreFor: number;

  scoreAgainst: number;

  teammateIds: string[];

  opponentIds: string[];
};

const DEFAULT_RECENT_FORM_LIMIT =
  5;

const DEFAULT_MINIMUM_PARTNER_MATCHES =
  2;

export function buildMemberInsights({
  memberId,
  members,
  sessions,
  matches,
  recentFormLimit =
    DEFAULT_RECENT_FORM_LIMIT,
  minimumPartnerMatches =
    DEFAULT_MINIMUM_PARTNER_MATCHES,
}: BuildMemberInsightsParams): MemberInsights | null {
  const memberMap =
    buildMemberMap(members);

  const member =
    memberMap.get(memberId);

  if (!member) {
    return null;
  }

  const sessionMap =
    buildSessionMap(sessions);

  const matchContexts =
    buildMemberMatchContexts({
      memberId,

      matches,

      sessionMap,
    });

  const orderedContexts = [
    ...matchContexts,
  ].sort(
    compareContextsChronologically
  );

  const newestContexts = [
    ...orderedContexts,
  ].reverse();

  const normalContexts =
    orderedContexts.filter(
      (context) =>
        context.session.mode ===
        "normal"
    );

  const teamContexts =
    orderedContexts.filter(
      (context) =>
        context.session.mode ===
        "team"
    );

  const overallStatistics =
    buildStatisticsFromContexts(
      orderedContexts
    );

  const normalStatistics =
    buildStatisticsFromContexts(
      normalContexts
    );

  const teamStatistics =
    buildStatisticsFromContexts(
      teamContexts
    );

  const streaks =
    calculateStreaks(
      orderedContexts
    );

  const partnershipMap =
    buildPartnershipMap({
      contexts:
        orderedContexts,
    });

  const opponentMap =
    buildOpponentMap({
      contexts:
        orderedContexts,
    });

  const safeRecentFormLimit =
    normalizePositiveInteger(
      recentFormLimit,
      DEFAULT_RECENT_FORM_LIMIT
    );

  const safeMinimumPartnerMatches =
    normalizePositiveInteger(
      minimumPartnerMatches,
      DEFAULT_MINIMUM_PARTNER_MATCHES
    );

  return {
    member:
      createInsightPerson(
        member
      ),

    overall: {
      ...overallStatistics,

      rating:
        normalizeNumber(
          member.rating
        ),
    },

    normal: {
      mode:
        "normal",

      ...normalStatistics,

      rating:
        normalizeNumber(
          member.ratingNormal
        ),
    },

    team: {
      mode:
        "team",

      ...teamStatistics,

      rating:
        normalizeNumber(
          member.ratingTeam
        ),
    },

    recentForm:
      newestContexts
        .slice(
          0,
          safeRecentFormLimit
        )
        .map(
          createRecentFormItem
        ),

    currentWinStreak:
      streaks.currentWinStreak,

    longestWinStreak:
      streaks.longestWinStreak,

    currentLossStreak:
      streaks.currentLossStreak,

    longestLossStreak:
      streaks.longestLossStreak,

    favoritePartner:
      selectFavoritePartner({
        partnershipMap,

        memberMap,
      }),

    bestPartner:
      selectBestPartner({
        partnershipMap,

        memberMap,

        minimumMatches:
          safeMinimumPartnerMatches,
      }),

    mostFrequentOpponent:
      selectMostFrequentOpponent({
        opponentMap,

        memberMap,
      }),

    hardestOpponent:
      selectHardestOpponent({
        opponentMap,

        memberMap,
      }),

    matchHistory:
      newestContexts.map(
        (context) =>
          createMatchHistoryItem({
            context,

            memberMap,
          })
      ),
  };
}

function buildMemberMatchContexts({
  memberId,
  matches,
  sessionMap,
}: {
  memberId: string;

  matches: MatchRecord[];

  sessionMap: Map<
    string,
    SessionRecord
  >;
}): MemberMatchContext[] {
  const contexts:
    MemberMatchContext[] = [];

  for (const match of matches) {
    if (!isCompletedMatch(match)) {
      continue;
    }

    const session =
      sessionMap.get(
        match.sessionId
      );

    if (!session) {
      continue;
    }

    const teamAMemberIds =
      uniqueIds(
        match.teamA.memberIds
      );

    const teamBMemberIds =
      uniqueIds(
        match.teamB.memberIds
      );

    const isTeamA =
      teamAMemberIds.includes(
        memberId
      );

    const isTeamB =
      teamBMemberIds.includes(
        memberId
      );

    if (!isTeamA && !isTeamB) {
      continue;
    }

    const scoreFor =
      isTeamA
        ? match.scoreA
        : match.scoreB;

    const scoreAgainst =
      isTeamA
        ? match.scoreB
        : match.scoreA;

    const ownTeamMemberIds =
      isTeamA
        ? teamAMemberIds
        : teamBMemberIds;

    const opponentIds =
      isTeamA
        ? teamBMemberIds
        : teamAMemberIds;

    contexts.push({
      match,

      session,

      result:
        scoreFor >
        scoreAgainst
          ? "win"
          : "loss",

      scoreFor,

      scoreAgainst,

      teammateIds:
        ownTeamMemberIds.filter(
          (currentMemberId) =>
            currentMemberId !==
            memberId
        ),

      opponentIds,
    });
  }

  return contexts;
}

function buildStatisticsFromContexts(
  contexts: MemberMatchContext[]
): {
  matches: number;

  wins: number;

  losses: number;

  winRate: number;

  pointsFor: number;

  pointsAgainst: number;

  pointDifference: number;
} {
  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const context of contexts) {
    if (
      context.result ===
      "win"
    ) {
      wins += 1;
    } else {
      losses += 1;
    }

    pointsFor +=
      context.scoreFor;

    pointsAgainst +=
      context.scoreAgainst;
  }

  const matches =
    contexts.length;

  return {
    matches,

    wins,

    losses,

    winRate:
      calculateWinRate({
        wins,

        matches,
      }),

    pointsFor,

    pointsAgainst,

    pointDifference:
      pointsFor -
      pointsAgainst,
  };
}

function calculateStreaks(
  contexts: MemberMatchContext[]
): {
  currentWinStreak: number;

  longestWinStreak: number;

  currentLossStreak: number;

  longestLossStreak: number;
} {
  let currentWinStreak = 0;
  let longestWinStreak = 0;

  let currentLossStreak = 0;
  let longestLossStreak = 0;

  for (const context of contexts) {
    if (
      context.result ===
      "win"
    ) {
      currentWinStreak += 1;
      currentLossStreak = 0;

      longestWinStreak =
        Math.max(
          longestWinStreak,
          currentWinStreak
        );
    } else {
      currentLossStreak += 1;
      currentWinStreak = 0;

      longestLossStreak =
        Math.max(
          longestLossStreak,
          currentLossStreak
        );
    }
  }

  return {
    currentWinStreak,

    longestWinStreak,

    currentLossStreak,

    longestLossStreak,
  };
}

function buildPartnershipMap({
  contexts,
}: {
  contexts:
    MemberMatchContext[];
}): Map<
  string,
  PairAccumulator
> {
  const pairMap =
    new Map<
      string,
      PairAccumulator
    >();

  for (const context of contexts) {
    for (
      const teammateId of
      context.teammateIds
    ) {
      applyContextToPair({
        pairMap,

        personId:
          teammateId,

        context,
      });
    }
  }

  return pairMap;
}

function buildOpponentMap({
  contexts,
}: {
  contexts:
    MemberMatchContext[];
}): Map<
  string,
  PairAccumulator
> {
  const pairMap =
    new Map<
      string,
      PairAccumulator
    >();

  for (const context of contexts) {
    for (
      const opponentId of
      context.opponentIds
    ) {
      applyContextToPair({
        pairMap,

        personId:
          opponentId,

        context,
      });
    }
  }

  return pairMap;
}

function applyContextToPair({
  pairMap,
  personId,
  context,
}: {
  pairMap: Map<
    string,
    PairAccumulator
  >;

  personId: string;

  context:
    MemberMatchContext;
}): void {
  const existing =
    pairMap.get(personId) ?? {
      personId,

      matches:
        0,

      wins:
        0,

      losses:
        0,

      pointsFor:
        0,

      pointsAgainst:
        0,
    };

  existing.matches += 1;

  if (
    context.result ===
    "win"
  ) {
    existing.wins += 1;
  } else {
    existing.losses += 1;
  }

  existing.pointsFor +=
    context.scoreFor;

  existing.pointsAgainst +=
    context.scoreAgainst;

  pairMap.set(
    personId,
    existing
  );
}

function selectFavoritePartner({
  partnershipMap,
  memberMap,
}: {
  partnershipMap: Map<
    string,
    PairAccumulator
  >;

  memberMap: Map<
    string,
    Member
  >;
}): MemberPartnershipInsight | null {
  const candidates = [
    ...partnershipMap.values(),
  ].sort(
    (
      first,
      second
    ) => {
      if (
        second.matches !==
        first.matches
      ) {
        return (
          second.matches -
          first.matches
        );
      }

      if (
        second.wins !==
        first.wins
      ) {
        return (
          second.wins -
          first.wins
        );
      }

      return (
        calculatePairPointDifference(
          second
        ) -
        calculatePairPointDifference(
          first
        )
      );
    }
  );

  const bestCandidate =
    candidates[0];

  return bestCandidate
    ? createPartnershipInsight({
        accumulator:
          bestCandidate,

        memberMap,
      })
    : null;
}

function selectBestPartner({
  partnershipMap,
  memberMap,
  minimumMatches,
}: {
  partnershipMap: Map<
    string,
    PairAccumulator
  >;

  memberMap: Map<
    string,
    Member
  >;

  minimumMatches: number;
}): MemberPartnershipInsight | null {
  const candidates = [
    ...partnershipMap.values(),
  ]
    .filter(
      (candidate) =>
        candidate.matches >=
        minimumMatches
    )
    .sort(
      (
        first,
        second
      ) => {
        const firstWinRate =
          calculateWinRate({
            wins:
              first.wins,

            matches:
              first.matches,
          });

        const secondWinRate =
          calculateWinRate({
            wins:
              second.wins,

            matches:
              second.matches,
          });

        if (
          secondWinRate !==
          firstWinRate
        ) {
          return (
            secondWinRate -
            firstWinRate
          );
        }

        if (
          second.matches !==
          first.matches
        ) {
          return (
            second.matches -
            first.matches
          );
        }

        return (
          calculatePairPointDifference(
            second
          ) -
          calculatePairPointDifference(
            first
          )
        );
      }
    );

  const bestCandidate =
    candidates[0];

  return bestCandidate
    ? createPartnershipInsight({
        accumulator:
          bestCandidate,

        memberMap,
      })
    : null;
}

function selectMostFrequentOpponent({
  opponentMap,
  memberMap,
}: {
  opponentMap: Map<
    string,
    PairAccumulator
  >;

  memberMap: Map<
    string,
    Member
  >;
}): MemberOpponentInsight | null {
  const candidates = [
    ...opponentMap.values(),
  ].sort(
    (
      first,
      second
    ) => {
      if (
        second.matches !==
        first.matches
      ) {
        return (
          second.matches -
          first.matches
        );
      }

      if (
        second.losses !==
        first.losses
      ) {
        return (
          second.losses -
          first.losses
        );
      }

      return (
        first.wins -
        second.wins
      );
    }
  );

  const bestCandidate =
    candidates[0];

  return bestCandidate
    ? createOpponentInsight({
        accumulator:
          bestCandidate,

        memberMap,
      })
    : null;
}

function selectHardestOpponent({
  opponentMap,
  memberMap,
}: {
  opponentMap: Map<
    string,
    PairAccumulator
  >;

  memberMap: Map<
    string,
    Member
  >;
}): MemberOpponentInsight | null {
  const candidates = [
    ...opponentMap.values(),
  ]
    .filter(
      (candidate) =>
        candidate.matches > 0
    )
    .sort(
      (
        first,
        second
      ) => {
        const firstLossRate =
          first.losses /
          first.matches;

        const secondLossRate =
          second.losses /
          second.matches;

        if (
          secondLossRate !==
          firstLossRate
        ) {
          return (
            secondLossRate -
            firstLossRate
          );
        }

        if (
          second.losses !==
          first.losses
        ) {
          return (
            second.losses -
            first.losses
          );
        }

        return (
          second.matches -
          first.matches
        );
      }
    );

  const bestCandidate =
    candidates[0];

  return bestCandidate
    ? createOpponentInsight({
        accumulator:
          bestCandidate,

        memberMap,
      })
    : null;
}

function createPartnershipInsight({
  accumulator,
  memberMap,
}: {
  accumulator:
    PairAccumulator;

  memberMap: Map<
    string,
    Member
  >;
}): MemberPartnershipInsight {
  const member =
    memberMap.get(
      accumulator.personId
    );

  return {
    partner: {
      memberId:
        accumulator.personId,

      memberName:
        member?.name ??
        accumulator.personId,

      nickname:
        member?.nickname,
    },

    matches:
      accumulator.matches,

    wins:
      accumulator.wins,

    losses:
      accumulator.losses,

    winRate:
      calculateWinRate({
        wins:
          accumulator.wins,

        matches:
          accumulator.matches,
      }),

    pointsFor:
      accumulator.pointsFor,

    pointsAgainst:
      accumulator.pointsAgainst,

    pointDifference:
      calculatePairPointDifference(
        accumulator
      ),
  };
}

function createOpponentInsight({
  accumulator,
  memberMap,
}: {
  accumulator:
    PairAccumulator;

  memberMap: Map<
    string,
    Member
  >;
}): MemberOpponentInsight {
  const member =
    memberMap.get(
      accumulator.personId
    );

  return {
    opponent: {
      memberId:
        accumulator.personId,

      memberName:
        member?.name ??
        accumulator.personId,

      nickname:
        member?.nickname,
    },

    meetings:
      accumulator.matches,

    wins:
      accumulator.wins,

    losses:
      accumulator.losses,

    winRate:
      calculateWinRate({
        wins:
          accumulator.wins,

        matches:
          accumulator.matches,
      }),

    pointsFor:
      accumulator.pointsFor,

    pointsAgainst:
      accumulator.pointsAgainst,

    pointDifference:
      calculatePairPointDifference(
        accumulator
      ),
  };
}

function createRecentFormItem(
  context: MemberMatchContext
): MemberRecentFormItem {
  return {
    matchId:
      context.match.id,

    sessionId:
      context.session.id,

    sessionDate:
      context.session.date,

    mode:
      context.session.mode,

    round:
      context.match.round,

    court:
      context.match.court ??
      1,

    result:
      context.result,

    scoreFor:
      context.scoreFor,

    scoreAgainst:
      context.scoreAgainst,
  };
}

function createMatchHistoryItem({
  context,
  memberMap,
}: {
  context:
    MemberMatchContext;

  memberMap: Map<
    string,
    Member
  >;
}): MemberMatchHistoryItem {
  return {
    matchId:
      context.match.id,

    sessionId:
      context.session.id,

    sessionDate:
      context.session.date,

    mode:
      context.session.mode,

    round:
      context.match.round,

    court:
      context.match.court ??
      1,

    result:
      context.result,

    scoreFor:
      context.scoreFor,

    scoreAgainst:
      context.scoreAgainst,

    teammateIds: [
      ...context.teammateIds,
    ],

    teammateNames:
      context.teammateIds.map(
        (teammateId) =>
          memberMap.get(
            teammateId
          )?.name ??
          teammateId
      ),

    opponentIds: [
      ...context.opponentIds,
    ],

    opponentNames:
      context.opponentIds.map(
        (opponentId) =>
          memberMap.get(
            opponentId
          )?.name ??
          opponentId
      ),
  };
}

function buildMemberMap(
  members: Member[]
): Map<string, Member> {
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

  return memberMap;
}

function buildSessionMap(
  sessions: SessionRecord[]
): Map<
  string,
  SessionRecord
> {
  const sessionMap =
    new Map<
      string,
      SessionRecord
    >();

  for (const session of sessions) {
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

  return sessionMap;
}

function createInsightPerson(
  member: Member
): MemberInsightPerson {
  return {
    memberId:
      member.id,

    memberName:
      member.name,

    nickname:
      member.nickname,
  };
}

function compareContextsChronologically(
  first: MemberMatchContext,
  second: MemberMatchContext
): number {
  const dateCompare =
    first.session.date.localeCompare(
      second.session.date
    );

  if (dateCompare !== 0) {
    return dateCompare;
  }

  if (
    first.match.round !==
    second.match.round
  ) {
    return (
      first.match.round -
      second.match.round
    );
  }

  const firstCourt =
    first.match.court ?? 1;

  const secondCourt =
    second.match.court ?? 1;

  if (
    firstCourt !==
    secondCourt
  ) {
    return (
      firstCourt -
      secondCourt
    );
  }

  return first.match.id.localeCompare(
    second.match.id
  );
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

function calculatePairPointDifference(
  accumulator:
    PairAccumulator
): number {
  return (
    accumulator.pointsFor -
    accumulator.pointsAgainst
  );
}

function calculateWinRate({
  wins,
  matches,
}: {
  wins: number;

  matches: number;
}): number {
  if (matches <= 0) {
    return 0;
  }

  return roundToTwoDecimals(
    (
      wins /
      matches
    ) *
      100
  );
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

function normalizeNumber(
  value: number
): number {
  return Number.isFinite(value)
    ? value
    : 0;
}

function uniqueIds(
  memberIds: string[]
): string[] {
  if (!Array.isArray(memberIds)) {
    return [];
  }

  return [
    ...new Set(
      memberIds.filter(
        (memberId) =>
          typeof memberId ===
            "string" &&
          Boolean(
            memberId.trim()
          )
      )
    ),
  ];
}

function roundToTwoDecimals(
  value: number
): number {
  return (
    Math.round(value * 100) /
    100
  );
}
