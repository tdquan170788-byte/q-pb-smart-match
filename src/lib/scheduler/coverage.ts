export type CoveragePlan = {
  recommendedRounds: number;

  totalPartnershipPairs: number;

  partnershipPairsPerRound: number;

  expectedRepeatedPairs: number;

  averageRestRoundsPerMember: number;
};

type BuildCoveragePlanParams = {
  memberCount: number;

  courtCount: number;
};

export function buildCoveragePlan({
  memberCount,
  courtCount,
}: BuildCoveragePlanParams): CoveragePlan {
  const normalizedMemberCount = Math.max(
    0,
    Math.floor(memberCount)
  );

  const normalizedCourtCount = Math.max(
    1,
    Math.floor(courtCount)
  );

  if (normalizedMemberCount < 4) {
    return {
      recommendedRounds: 0,
      totalPartnershipPairs: 0,
      partnershipPairsPerRound: 0,
      expectedRepeatedPairs: 0,
      averageRestRoundsPerMember: 0,
    };
  }

  const usableCourtCount = Math.min(
    normalizedCourtCount,
    Math.floor(normalizedMemberCount / 4)
  );

  if (usableCourtCount < 1) {
    return {
      recommendedRounds: 0,
      totalPartnershipPairs: 0,
      partnershipPairsPerRound: 0,
      expectedRepeatedPairs: 0,
      averageRestRoundsPerMember: 0,
    };
  }

  const totalPartnershipPairs =
    (normalizedMemberCount *
      (normalizedMemberCount - 1)) /
    2;

  const partnershipPairsPerRound =
    usableCourtCount * 2;

  const roundsRequiredByPairCoverage =
    Math.ceil(
      totalPartnershipPairs /
        partnershipPairsPerRound
    );

  const roundsRequiredPerMember =
    normalizedMemberCount % 2 === 0
      ? normalizedMemberCount - 1
      : normalizedMemberCount;

  const recommendedRounds = Math.max(
    roundsRequiredByPairCoverage,
    roundsRequiredPerMember
  );

  const generatedPairs =
    recommendedRounds *
    partnershipPairsPerRound;

  const expectedRepeatedPairs = Math.max(
    0,
    generatedPairs -
      totalPartnershipPairs
  );

  const playersPerRound =
    usableCourtCount * 4;

  const totalPlayerSlots =
    recommendedRounds *
    playersPerRound;

  const averageMatchesPerMember =
    totalPlayerSlots /
    normalizedMemberCount;

  const averageRestRoundsPerMember =
    Math.max(
      0,
      recommendedRounds -
        averageMatchesPerMember
    );

  return {
    recommendedRounds,
    totalPartnershipPairs,
    partnershipPairsPerRound,
    expectedRepeatedPairs,
    averageRestRoundsPerMember,
  };
}

export function getRecommendedRoundCount(
  params: BuildCoveragePlanParams
): number {
  return buildCoveragePlan(params)
    .recommendedRounds;
}