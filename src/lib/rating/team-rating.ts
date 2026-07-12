import {
  calculateExpectedScore,
  calculateHeadToHeadRatings,
  calculateTeamAverageRating,
  clampRating,
  type EloMatchResult,
} from "./elo";

import {
  DEFAULT_K_FACTOR,
} from "./constants";

export type TeamRatingMemberInput = {
  memberId: string;
  rating: number;
};

export type TeamRatingMemberResult = {
  memberId: string;

  oldRating: number;

  newRating: number;

  delta: number;
};

export type CalculateTeamRatingResultParams = {
  teamA: TeamRatingMemberInput[];

  teamB: TeamRatingMemberInput[];

  /**
   * Kết quả thực tế của Team A:
   *
   * 1   = Team A thắng
   * 0.5 = hòa
   * 0   = Team A thua
   */
  teamAActualScore: EloMatchResult;

  /**
   * Hệ số K.
   *
   * Nếu không truyền sẽ dùng DEFAULT_K_FACTOR.
   */
  kFactor?: number;

  /**
   * Có làm tròn delta và rating mới hay không.
   *
   * Mặc định true.
   */
  roundResult?: boolean;
};

export type TeamRatingResult = {
  teamAAverageRating: number;

  teamBAverageRating: number;

  teamAExpectedScore: number;

  teamBExpectedScore: number;

  teamAExpectedPercent: number;

  teamBExpectedPercent: number;

  teamADelta: number;

  teamBDelta: number;

  teamAMembers: TeamRatingMemberResult[];

  teamBMembers: TeamRatingMemberResult[];

  members: TeamRatingMemberResult[];
};

/**
 * Tính rating cho trận đánh đội.
 *
 * Cách hoạt động:
 *
 * 1. Tính rating trung bình của Team A.
 * 2. Tính rating trung bình của Team B.
 * 3. Dùng Elo để tính delta của hai đội.
 * 4. Áp dụng cùng một delta cho từng thành viên
 *    trong đội.
 *
 * Hàm chỉ trả về kết quả, chưa ghi vào storage.
 */
export function calculateTeamRatingResult({
  teamA,
  teamB,
  teamAActualScore,
  kFactor = DEFAULT_K_FACTOR,
  roundResult = true,
}: CalculateTeamRatingResultParams): TeamRatingResult {
  const normalizedTeamA =
    normalizeTeamMembers(teamA);

  const normalizedTeamB =
    normalizeTeamMembers(teamB);

  const teamAAverageRating =
    calculateTeamAverageRating(
      normalizedTeamA.map(
        (member) => member.rating
      )
    );

  const teamBAverageRating =
    calculateTeamAverageRating(
      normalizedTeamB.map(
        (member) => member.rating
      )
    );

  const headToHeadResult =
    calculateHeadToHeadRatings({
      firstRating:
        teamAAverageRating,

      secondRating:
        teamBAverageRating,

      firstActualScore:
        teamAActualScore,

      kFactor,

      roundResult,
    });

  const teamAExpectedScore =
    calculateExpectedScore(
      teamAAverageRating,
      teamBAverageRating
    );

  const teamBExpectedScore =
    calculateExpectedScore(
      teamBAverageRating,
      teamAAverageRating
    );

  const teamADelta =
    headToHeadResult.firstDelta;

  const teamBDelta =
    headToHeadResult.secondDelta;

  const teamAMembers =
    normalizedTeamA.map((member) =>
      buildMemberResult({
        member,
        delta: teamADelta,
        roundResult,
      })
    );

  const teamBMembers =
    normalizedTeamB.map((member) =>
      buildMemberResult({
        member,
        delta: teamBDelta,
        roundResult,
      })
    );

  return {
    teamAAverageRating,

    teamBAverageRating,

    teamAExpectedScore,

    teamBExpectedScore,

    teamAExpectedPercent:
      roundToTwoDecimals(
        teamAExpectedScore * 100
      ),

    teamBExpectedPercent:
      roundToTwoDecimals(
        teamBExpectedScore * 100
      ),

    teamADelta,

    teamBDelta,

    teamAMembers,

    teamBMembers,

    members: [
      ...teamAMembers,
      ...teamBMembers,
    ],
  };
}

function normalizeTeamMembers(
  members: TeamRatingMemberInput[]
): TeamRatingMemberInput[] {
  const uniqueMembers =
    new Map<
      string,
      TeamRatingMemberInput
    >();

  for (const member of members) {
    if (
      !member ||
      typeof member.memberId !== "string"
    ) {
      continue;
    }

    const memberId =
      member.memberId.trim();

    if (!memberId) {
      continue;
    }

    uniqueMembers.set(
      memberId,
      {
        memberId,

        rating:
          clampRating(
            Number(member.rating)
          ),
      }
    );
  }

  return [
    ...uniqueMembers.values(),
  ];
}

function buildMemberResult({
  member,
  delta,
  roundResult,
}: {
  member: TeamRatingMemberInput;

  delta: number;

  roundResult: boolean;
}): TeamRatingMemberResult {
  const oldRating =
    clampRating(member.rating);

  const rawNewRating =
    clampRating(
      oldRating + delta
    );

  const newRating =
    roundResult
      ? Math.round(rawNewRating)
      : rawNewRating;

  const normalizedDelta =
    roundResult
      ? newRating -
        Math.round(oldRating)
      : rawNewRating -
        oldRating;

  return {
    memberId: member.memberId,

    oldRating:
      roundResult
        ? Math.round(oldRating)
        : oldRating,

    newRating,

    delta:
      roundResult
        ? Math.round(
            normalizedDelta
          )
        : normalizedDelta,
  };
}

function roundToTwoDecimals(
  value: number
): number {
  return (
    Math.round(value * 100) /
    100
  );
}
