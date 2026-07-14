import type {
  GeneratedSchedule,
  ScheduleQualityReport,
} from "@/types";

import {
  analyzeSchedule,
} from "./analytics";

export type ScheduleScoreComponentId =
  | "match-balance"
  | "rest-balance"
  | "consecutive-rest"
  | "teammate-diversity"
  | "opponent-diversity";

export type ScheduleScoreComponent = {
  id: ScheduleScoreComponentId;

  label: string;

  description: string;

  /**
   * Điểm thành phần trong khoảng 0–100.
   */
  score: number;

  /**
   * Trọng số dùng để tính điểm tổng.
   */
  weight: number;

  /**
   * Mức đóng góp thực tế vào điểm tổng.
   *
   * weightedScore = score × weight
   */
  weightedScore: number;

  /**
   * Giá trị thô dùng để giải thích kết quả.
   *
   * Ví dụ:
   * - lệch số trận;
   * - lệch lượt nghỉ;
   * - số lần lặp đồng đội tối đa.
   */
  rawValue: number;

  /**
   * Giá trị lý tưởng của tiêu chí.
   */
  idealValue: number;

  status:
    | "excellent"
    | "good"
    | "fair"
    | "poor";
};

export type ScheduleScoreWeights = {
  matchBalance: number;

  restBalance: number;

  consecutiveRest: number;

  teammateDiversity: number;

  opponentDiversity: number;
};

export type ScheduleComponentScoreResult = {
  score: number;

  components: ScheduleScoreComponent[];

  weights: ScheduleScoreWeights;

  qualityReport: ScheduleQualityReport;
};

export type EvaluateScheduleComponentsParams = {
  schedule: GeneratedSchedule;

  memberIds: string[];

  /**
   * Có thể ghi đè trọng số mặc định.
   *
   * Không cần tổng trọng số bằng 1.
   * Engine sẽ tự chuẩn hóa.
   */
  weights?: Partial<ScheduleScoreWeights>;
};

const DEFAULT_SCORE_WEIGHTS: ScheduleScoreWeights = {
  matchBalance: 25,

  restBalance: 20,

  consecutiveRest: 15,

  teammateDiversity: 22,

  opponentDiversity: 18,
};

/**
 * Score Component Engine 1.0
 *
 * Mục tiêu:
 *
 * - Tách điểm chất lượng lịch thành các thành phần riêng.
 * - Mỗi thành phần có điểm, trọng số và giải thích.
 * - Không thay đổi Scheduler hiện tại.
 * - Chuẩn bị cho Weighted Score và Local Optimizer.
 */
export function evaluateScheduleComponents({
  schedule,
  memberIds,
  weights,
}: EvaluateScheduleComponentsParams): ScheduleComponentScoreResult {
  const safeMemberIds =
    uniqueIds(memberIds);

  const qualityReport =
    analyzeSchedule({
      schedule,

      memberIds:
        safeMemberIds,
    });

  const normalizedWeights =
    normalizeWeights({
      ...DEFAULT_SCORE_WEIGHTS,
      ...weights,
    });

  const components: ScheduleScoreComponent[] = [
    createMatchBalanceComponent({
      qualityReport,

      weight:
        normalizedWeights.matchBalance,
    }),

    createRestBalanceComponent({
      qualityReport,

      weight:
        normalizedWeights.restBalance,
    }),

    createConsecutiveRestComponent({
      qualityReport,

      weight:
        normalizedWeights.consecutiveRest,
    }),

    createTeammateDiversityComponent({
      qualityReport,

      weight:
        normalizedWeights.teammateDiversity,
    }),

    createOpponentDiversityComponent({
      qualityReport,

      weight:
        normalizedWeights.opponentDiversity,
    }),
  ];

  const score =
    roundToTwoDecimals(
      components.reduce(
        (
          total,
          component
        ) =>
          total +
          component.weightedScore,
        0
      )
    );

  return {
    score,

    components,

    weights:
      normalizedWeights,

    qualityReport,
  };
}

function createMatchBalanceComponent({
  qualityReport,
  weight,
}: {
  qualityReport: ScheduleQualityReport;

  weight: number;
}): ScheduleScoreComponent {
  const rawValue =
    normalizeNonNegativeNumber(
      qualityReport.matchCountDifference
    );

  /**
   * Lệch số trận:
   *
   * 0 → 100 điểm
   * 1 → 88 điểm
   * 2 → 72 điểm
   * 3 → 52 điểm
   * 4 → 28 điểm
   * 5+ → 0 điểm
   */
  const score =
    clampNumber(
      100 -
        rawValue *
          12 -
        Math.max(
          0,
          rawValue - 1
        ) *
          4,
      0,
      100
    );

  return createComponent({
    id:
      "match-balance",

    label:
      "Cân bằng số trận",

    description:
      rawValue === 0
        ? "Mọi thành viên có số trận bằng nhau."
        : `Số trận giữa các thành viên đang lệch tối đa ${formatNumber(
            rawValue
          )} trận.`,

    score,

    weight,

    rawValue,

    idealValue:
      0,
  });
}

function createRestBalanceComponent({
  qualityReport,
  weight,
}: {
  qualityReport: ScheduleQualityReport;

  weight: number;
}): ScheduleScoreComponent {
  const rawValue =
    normalizeNonNegativeNumber(
      qualityReport.restCountDifference
    );

  /**
   * Lệch lượt nghỉ được phạt mạnh hơn
   * vì ảnh hưởng trực tiếp trải nghiệm người chơi.
   */
  const score =
    clampNumber(
      100 -
        rawValue *
          18,
      0,
      100
    );

  return createComponent({
    id:
      "rest-balance",

    label:
      "Cân bằng lượt nghỉ",

    description:
      rawValue === 0
        ? "Lượt nghỉ được phân bổ đồng đều."
        : `Lượt nghỉ giữa các thành viên đang lệch tối đa ${formatNumber(
            rawValue
          )} round.`,

    score,

    weight,

    rawValue,

    idealValue:
      0,
  });
}

function createConsecutiveRestComponent({
  qualityReport,
  weight,
}: {
  qualityReport: ScheduleQualityReport;

  weight: number;
}): ScheduleScoreComponent {
  const rawValue =
    normalizeNonNegativeNumber(
      qualityReport.maxConsecutiveRestCount
    );

  /**
   * Một lượt nghỉ liên tiếp là bình thường.
   *
   * 0–1 → 100 điểm
   * 2   → 75 điểm
   * 3   → 45 điểm
   * 4   → 15 điểm
   * 5+  → 0 điểm
   */
  const score =
    rawValue <= 1
      ? 100
      : clampNumber(
          100 -
            (
              rawValue - 1
            ) *
              27,
          0,
          100
        );

  return createComponent({
    id:
      "consecutive-rest",

    label:
      "Hạn chế nghỉ liên tiếp",

    description:
      rawValue <= 1
        ? "Không có thành viên phải nghỉ nhiều round liên tiếp."
        : `Có thành viên phải nghỉ tối đa ${formatNumber(
            rawValue
          )} round liên tiếp.`,

    score,

    weight,

    rawValue,

    idealValue:
      1,
  });
}

function createTeammateDiversityComponent({
  qualityReport,
  weight,
}: {
  qualityReport: ScheduleQualityReport;

  weight: number;
}): ScheduleScoreComponent {
  const rawValue =
    normalizeNonNegativeNumber(
      qualityReport.maxTeammateRepeatCount
    );

  /**
   * Một cặp đánh cùng một lần là lý tưởng.
   *
   * 0–1 → 100 điểm
   * 2   → 82 điểm
   * 3   → 58 điểm
   * 4   → 30 điểm
   * 5+  → giảm nhanh về 0
   */
  const score =
    rawValue <= 1
      ? 100
      : clampNumber(
          100 -
            (
              rawValue - 1
            ) *
              22 -
            Math.max(
              0,
              rawValue - 3
            ) *
              6,
          0,
          100
        );

  return createComponent({
    id:
      "teammate-diversity",

    label:
      "Đa dạng đồng đội",

    description:
      rawValue <= 1
        ? "Các cặp đồng đội gần như không bị lặp."
        : `Một cặp đồng đội xuất hiện tối đa ${formatNumber(
            rawValue
          )} lần.`,

    score,

    weight,

    rawValue,

    idealValue:
      1,
  });
}

function createOpponentDiversityComponent({
  qualityReport,
  weight,
}: {
  qualityReport: ScheduleQualityReport;

  weight: number;
}): ScheduleScoreComponent {
  const rawValue =
    normalizeNonNegativeNumber(
      qualityReport.maxOpponentRepeatCount
    );

  /**
   * Đối thủ thường có thể gặp lại nhiều hơn đồng đội,
   * nên mức phạt nhẹ hơn teammate diversity.
   */
  const score =
    rawValue <= 2
      ? 100
      : clampNumber(
          100 -
            (
              rawValue - 2
            ) *
              16,
          0,
          100
        );

  return createComponent({
    id:
      "opponent-diversity",

    label:
      "Đa dạng đối thủ",

    description:
      rawValue <= 2
        ? "Đối thủ được phân bổ đa dạng."
        : `Một cặp đối thủ gặp nhau tối đa ${formatNumber(
            rawValue
          )} lần.`,

    score,

    weight,

    rawValue,

    idealValue:
      2,
  });
}

function createComponent({
  id,
  label,
  description,
  score,
  weight,
  rawValue,
  idealValue,
}: {
  id: ScheduleScoreComponentId;

  label: string;

  description: string;

  score: number;

  weight: number;

  rawValue: number;

  idealValue: number;
}): ScheduleScoreComponent {
  const safeScore =
    roundToTwoDecimals(
      clampNumber(
        score,
        0,
        100
      )
    );

  const safeWeight =
    clampNumber(
      weight,
      0,
      1
    );

  return {
    id,

    label,

    description,

    score:
      safeScore,

    weight:
      safeWeight,

    weightedScore:
      roundToTwoDecimals(
        safeScore *
          safeWeight
      ),

    rawValue:
      roundToTwoDecimals(
        rawValue
      ),

    idealValue:
      roundToTwoDecimals(
        idealValue
      ),

    status:
      getComponentStatus(
        safeScore
      ),
  };
}

function normalizeWeights(
  weights: ScheduleScoreWeights
): ScheduleScoreWeights {
  const safeWeights: ScheduleScoreWeights = {
    matchBalance:
      normalizeWeight(
        weights.matchBalance
      ),

    restBalance:
      normalizeWeight(
        weights.restBalance
      ),

    consecutiveRest:
      normalizeWeight(
        weights.consecutiveRest
      ),

    teammateDiversity:
      normalizeWeight(
        weights.teammateDiversity
      ),

    opponentDiversity:
      normalizeWeight(
        weights.opponentDiversity
      ),
  };

  const totalWeight =
    safeWeights.matchBalance +
    safeWeights.restBalance +
    safeWeights.consecutiveRest +
    safeWeights.teammateDiversity +
    safeWeights.opponentDiversity;

  if (totalWeight <= 0) {
    return normalizeWeights(
      DEFAULT_SCORE_WEIGHTS
    );
  }

  return {
    matchBalance:
      safeWeights.matchBalance /
      totalWeight,

    restBalance:
      safeWeights.restBalance /
      totalWeight,

    consecutiveRest:
      safeWeights.consecutiveRest /
      totalWeight,

    teammateDiversity:
      safeWeights.teammateDiversity /
      totalWeight,

    opponentDiversity:
      safeWeights.opponentDiversity /
      totalWeight,
  };
}

function normalizeWeight(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function normalizeNonNegativeNumber(
  value: number
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function getComponentStatus(
  score: number
): ScheduleScoreComponent["status"] {
  if (score >= 90) {
    return "excellent";
  }

  if (score >= 75) {
    return "good";
  }

  if (score >= 55) {
    return "fair";
  }

  return "poor";
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

function formatNumber(
  value: number
): string {
  if (
    Number.isInteger(value)
  ) {
    return String(value);
  }

  return value.toFixed(1);
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

function roundToTwoDecimals(
  value: number
): number {
  return (
    Math.round(
      value * 100
    ) /
    100
  );
}
