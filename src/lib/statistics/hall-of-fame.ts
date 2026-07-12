import type {
  Member,
} from "@/types";

export type HallOfFameMode =
  | "overall"
  | "normal"
  | "team";

export type HallOfFameEntry = {
  memberId: string;

  memberName: string;

  nickname?: string;

  mode: HallOfFameMode;

  rating: number;

  wins: number;

  losses: number;

  matches: number;

  winRate: number;
};

export type HallOfFameStatistics = {
  normalRatingLeader:
    | HallOfFameEntry
    | null;

  teamRatingLeader:
    | HallOfFameEntry
    | null;

  mostWins:
    | HallOfFameEntry
    | null;

  bestWinRate:
    | HallOfFameEntry
    | null;

  normalRatingTop: HallOfFameEntry[];

  teamRatingTop: HallOfFameEntry[];

  winsTop: HallOfFameEntry[];

  winRateTop: HallOfFameEntry[];

  minimumMatchesForWinRate: number;
};

export type BuildHallOfFameStatisticsParams = {
  members: Member[];

  /**
   * Số trận tối thiểu để được xét
   * danh hiệu tỷ lệ thắng cao nhất.
   *
   * Mặc định 5 trận để phù hợp khi
   * dữ liệu ứng dụng chưa quá nhiều.
   */
  minimumMatchesForWinRate?: number;

  /**
   * Số người tối đa trong mỗi bảng xếp hạng.
   *
   * Mặc định 5.
   */
  topLimit?: number;
};

const DEFAULT_MINIMUM_MATCHES_FOR_WIN_RATE =
  5;

const DEFAULT_TOP_LIMIT = 5;

export function buildHallOfFameStatistics({
  members,
  minimumMatchesForWinRate =
    DEFAULT_MINIMUM_MATCHES_FOR_WIN_RATE,
  topLimit = DEFAULT_TOP_LIMIT,
}: BuildHallOfFameStatisticsParams): HallOfFameStatistics {
  const normalizedMembers =
    normalizeMembers(members);

  const safeMinimumMatches =
    normalizePositiveInteger(
      minimumMatchesForWinRate,
      DEFAULT_MINIMUM_MATCHES_FOR_WIN_RATE
    );

  const safeTopLimit =
    normalizePositiveInteger(
      topLimit,
      DEFAULT_TOP_LIMIT
    );

  const normalEntries =
    normalizedMembers.map(
      (member) =>
        createEntry({
          member,
          mode: "normal",
        })
    );

  const teamEntries =
    normalizedMembers.map(
      (member) =>
        createEntry({
          member,
          mode: "team",
        })
    );

  const overallEntries =
    normalizedMembers.map(
      (member) =>
        createEntry({
          member,
          mode: "overall",
        })
    );

  const normalRatingTop = [
    ...normalEntries,
  ]
    .sort(compareRatingEntries)
    .slice(0, safeTopLimit);

  const teamRatingTop = [
    ...teamEntries,
  ]
    .sort(compareRatingEntries)
    .slice(0, safeTopLimit);

  const winsTop = [
    ...overallEntries,
  ]
    .sort(compareWinsEntries)
    .slice(0, safeTopLimit);

  const winRateTop = overallEntries
    .filter(
      (entry) =>
        entry.matches >=
        safeMinimumMatches
    )
    .sort(compareWinRateEntries)
    .slice(0, safeTopLimit);

  return {
    normalRatingLeader:
      normalRatingTop[0] ??
      null,

    teamRatingLeader:
      teamRatingTop[0] ??
      null,

    mostWins:
      winsTop[0] ??
      null,

    bestWinRate:
      winRateTop[0] ??
      null,

    normalRatingTop,

    teamRatingTop,

    winsTop,

    winRateTop,

    minimumMatchesForWinRate:
      safeMinimumMatches,
  };
}

function createEntry({
  member,
  mode,
}: {
  member: Member;

  mode: HallOfFameMode;
}): HallOfFameEntry {
  if (mode === "normal") {
    return {
      memberId: member.id,

      memberName: member.name,

      nickname:
        member.nickname,

      mode,

      rating:
        normalizeNumber(
          member.ratingNormal
        ),

      wins:
        normalizeNonNegativeInteger(
          member.winsNormal
        ),

      losses:
        normalizeNonNegativeInteger(
          member.lossesNormal
        ),

      matches:
        normalizeNonNegativeInteger(
          member.matchesNormal
        ),

      winRate:
        calculateWinRate({
          wins:
            member.winsNormal,

          matches:
            member.matchesNormal,
        }),
    };
  }

  if (mode === "team") {
    return {
      memberId: member.id,

      memberName: member.name,

      nickname:
        member.nickname,

      mode,

      rating:
        normalizeNumber(
          member.ratingTeam
        ),

      wins:
        normalizeNonNegativeInteger(
          member.winsTeam
        ),

      losses:
        normalizeNonNegativeInteger(
          member.lossesTeam
        ),

      matches:
        normalizeNonNegativeInteger(
          member.matchesTeam
        ),

      winRate:
        calculateWinRate({
          wins:
            member.winsTeam,

          matches:
            member.matchesTeam,
        }),
    };
  }

  return {
    memberId: member.id,

    memberName: member.name,

    nickname:
      member.nickname,

    mode,

    rating:
      normalizeNumber(
        member.rating
      ),

    wins:
      normalizeNonNegativeInteger(
        member.wins
      ),

    losses:
      normalizeNonNegativeInteger(
        member.losses
      ),

    matches:
      normalizeNonNegativeInteger(
        member.matches
      ),

    winRate:
      calculateWinRate({
        wins:
          member.wins,

        matches:
          member.matches,
      }),
  };
}

function compareRatingEntries(
  firstEntry: HallOfFameEntry,
  secondEntry: HallOfFameEntry
): number {
  if (
    secondEntry.rating !==
    firstEntry.rating
  ) {
    return (
      secondEntry.rating -
      firstEntry.rating
    );
  }

  if (
    secondEntry.matches !==
    firstEntry.matches
  ) {
    return (
      secondEntry.matches -
      firstEntry.matches
    );
  }

  if (
    secondEntry.winRate !==
    firstEntry.winRate
  ) {
    return (
      secondEntry.winRate -
      firstEntry.winRate
    );
  }

  return compareNames(
    firstEntry.memberName,
    secondEntry.memberName
  );
}

function compareWinsEntries(
  firstEntry: HallOfFameEntry,
  secondEntry: HallOfFameEntry
): number {
  if (
    secondEntry.wins !==
    firstEntry.wins
  ) {
    return (
      secondEntry.wins -
      firstEntry.wins
    );
  }

  if (
    secondEntry.winRate !==
    firstEntry.winRate
  ) {
    return (
      secondEntry.winRate -
      firstEntry.winRate
    );
  }

  if (
    secondEntry.rating !==
    firstEntry.rating
  ) {
    return (
      secondEntry.rating -
      firstEntry.rating
    );
  }

  return compareNames(
    firstEntry.memberName,
    secondEntry.memberName
  );
}

function compareWinRateEntries(
  firstEntry: HallOfFameEntry,
  secondEntry: HallOfFameEntry
): number {
  if (
    secondEntry.winRate !==
    firstEntry.winRate
  ) {
    return (
      secondEntry.winRate -
      firstEntry.winRate
    );
  }

  if (
    secondEntry.matches !==
    firstEntry.matches
  ) {
    return (
      secondEntry.matches -
      firstEntry.matches
    );
  }

  if (
    secondEntry.wins !==
    firstEntry.wins
  ) {
    return (
      secondEntry.wins -
      firstEntry.wins
    );
  }

  return compareNames(
    firstEntry.memberName,
    secondEntry.memberName
  );
}

function calculateWinRate({
  wins,
  matches,
}: {
  wins: number;

  matches: number;
}): number {
  const safeWins =
    normalizeNonNegativeInteger(
      wins
    );

  const safeMatches =
    normalizeNonNegativeInteger(
      matches
    );

  if (safeMatches <= 0) {
    return 0;
  }

  return roundToTwoDecimals(
    (safeWins /
      safeMatches) *
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
      typeof member.id !==
        "string" ||
      !member.id.trim()
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

function normalizeNonNegativeInteger(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return 0;
  }

  return Math.floor(value);
}

function normalizeNumber(
  value: number
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return value;
}

function compareNames(
  firstName: string,
  secondName: string
): number {
  return firstName.localeCompare(
    secondName,
    "vi"
  );
}

function roundToTwoDecimals(
  value: number
): number {
  return (
    Math.round(value * 100) /
    100
  );
}