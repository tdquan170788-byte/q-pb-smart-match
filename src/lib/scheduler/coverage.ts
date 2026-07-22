type RecommendedRoundCountParams = {
  memberCount: number;
  courtCount: number;
};

/**
 * Tính số round tối thiểu được khuyến nghị để mọi thành viên
 * có cơ hội đánh cặp với tất cả thành viên còn lại ít nhất một lần.
 *
 * Mỗi trận đánh đôi:
 * - sử dụng 4 thành viên;
 * - tạo ra 2 cặp đồng đội.
 *
 * Số round phải đồng thời đáp ứng:
 *
 * 1. Đủ số vị trí cặp đồng đội:
 *
 *    totalPairs / pairsPerRound
 *
 * 2. Đủ số round để mỗi thành viên chỉ xuất hiện tối đa
 *    trong một cặp đồng đội ở mỗi round:
 *
 *    - số thành viên chẵn: memberCount - 1;
 *    - số thành viên lẻ: memberCount.
 */
export function getRecommendedRoundCount({
  memberCount,
  courtCount,
}: RecommendedRoundCountParams): number {
  const normalizedMemberCount = Math.max(
    0,
    Math.floor(memberCount)
  );

  const normalizedCourtCount = Math.max(
    1,
    Math.floor(courtCount)
  );

  if (normalizedMemberCount < 4) {
    return 0;
  }

  const usableCourtCount = Math.min(
    normalizedCourtCount,
    Math.floor(normalizedMemberCount / 4)
  );

  if (usableCourtCount < 1) {
    return 0;
  }

  const totalPartnershipPairs =
    (normalizedMemberCount *
      (normalizedMemberCount - 1)) /
    2;

  const partnershipPairsPerRound =
    usableCourtCount * 2;

  const roundsRequiredByPairCapacity = Math.ceil(
    totalPartnershipPairs /
      partnershipPairsPerRound
  );

  const roundsRequiredPerMember =
    normalizedMemberCount % 2 === 0
      ? normalizedMemberCount - 1
      : normalizedMemberCount;

  return Math.max(
    roundsRequiredByPairCapacity,
    roundsRequiredPerMember
  );
}
