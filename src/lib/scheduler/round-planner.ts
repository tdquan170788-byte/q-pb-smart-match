import type {
  RoundPlanningConfig,
  SessionRecord,
} from "@/types";

import { getRecommendedRoundCount }
  from "./coverage";

const DEFAULT_MINUTES_PER_ROUND = 15;

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
  config: RoundPlanningConfig,
  memberCount: number
): number {
  const sessionMinutes =
    config.sessionMinutes;

  if (
    sessionMinutes === undefined ||
    !Number.isFinite(sessionMinutes) ||
    sessionMinutes <= 0
  ) {
    return getLegacyRoundCount(
      memberCount
    );
  }

  return Math.max(
    1,
    Math.floor(
      sessionMinutes /
        DEFAULT_MINUTES_PER_ROUND
    )
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
  session: SessionRecord,
  config: RoundPlanningConfig,
  memberCount: number,
  courtCount: number
): number {
  if (
    config.sessionMinutes !== undefined &&
    Number.isFinite(config.sessionMinutes) &&
    config.sessionMinutes > 0
  ) {
    return resolveTimeRoundCount(
      config,
      memberCount
    );
  }

  return resolveCoverageRoundCount(
    memberCount,
    courtCount
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
    config,
    memberCount
  );

    case "coverage":
  return resolveCoverageRoundCount(
    memberCount,
    courtCount
  );

    case "smart":
  return resolveSmartRoundCount(
    session,
    config,
    memberCount,
    courtCount
  );

    default:
      return getLegacyRoundCount(
        memberCount
      );
  }
}
