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

 