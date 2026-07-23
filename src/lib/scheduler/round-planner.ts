import type {
  RoundPlanningConfig,
  SessionRecord,
} from "@/types";

import { getRecommendedRoundCount }
  from "./coverage";

/**
 * Thuật toán mặc định của Scheduler 2.1.
 *
 * Được giữ nguyên để đảm bảo tương thích với
 * các session cũ.
 */
function getLegacyRoundCount(
  memberCount: number
): number {
  return Math.max(
    1,
    memberCount - 1
  );
}

function resolveManualRoundCount(
  config: RoundPlanningConfig,
  memberCount: number
): number {
  return Math.max(
    1,
    Math.floor(
      config.manualRoundCount ??
        getLegacyRoundCount(memberCount)
    )
  );
}

function resolveTimeRoundCount(
  session: SessionRecord
): number {
  /**
   * TODO Sprint 18.5C
   *
   * Tính số round theo:
   *
   * - thời lượng session
   * - số sân
   * - số người
   * - thời gian trung bình / round
   */

  return getLegacyRoundCount(
    session.memberIds.length
  );
}

function resolveCoverageRoundCount(
  memberCount: number,
  courtCount: number
): number {
  return getRecommendedRoundCount({
    memberCount,
    courtCount,
  });
}

function resolveSmartRoundCount(
  session: SessionRecord
): number {
  /**
   * TODO Sprint 18.5E
   *
   * Smart Recommendation
   */

  return getLegacyRoundCount(
    session.memberIds.length
  );
}

/**
 * Round Planner
 *
 * Chịu trách nhiệm xác định tổng số round.
 *
 * Scheduler Engine chỉ sinh lịch dựa trên
 * kết quả của Planner.
 */
type ResolveRoundCountParams = {
  memberCount: number;

  courtCount: number;
};

export function resolveRoundCount(
  session: SessionRecord,
  params: ResolveRoundCountParams
): number {
  const {
  memberCount,
  courtCount,
} = params;

  const config =
    session.roundPlanning;

  const automaticRounds =
  getRecommendedRoundCount({
    memberCount,
    courtCount,
  });

if (!config) {
  return session.targetRounds &&
    session.targetRounds > 0
    ? session.targetRounds
    : automaticRounds;
}
  switch (config.mode) {
    case "manual":
      return resolveManualRoundCount(
        config,
        memberCount
      );

    case "time":
      return resolveTimeRoundCount(
        session
      );

    case "coverage":
  return resolveCoverageRoundCount(
    memberCount,
    courtCount
  );

    case "smart":
      return resolveSmartRoundCount(
        session
      );

    default:
      return getLegacyRoundCount(
        memberCount
      );
  }
}
