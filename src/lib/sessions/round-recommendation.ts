import type {
  ScheduleQualityReport,
  SessionRecord,
} from "@/types";

import {
  analyzeSchedule,
  buildSessionSchedule,
} from "@/lib/scheduler";

export type RoundRecommendationLevel =
  | "excellent"
  | "very-good"
  | "good"
  | "acceptable";

export type RecommendationPlanningMode =
  | "round-based"
  | "time-based";

export type RecommendationTimeInput = {
  /**
   * Tổng thời lượng buổi chơi, tính bằng phút.
   *
   * Ví dụ:
   * - 90 phút
   * - 120 phút
   * - 150 phút
   */
  sessionDurationMinutes: number;

  /**
   * Thời gian trung bình của một round.
   *
   * Các sân trong cùng một round thi đấu đồng thời,
   * vì vậy đây là thời gian của một lượt thi đấu,
   * không phải tổng thời gian tất cả các trận.
   */
  averageRoundMinutes: number;

  /**
   * Tỷ lệ thời gian dành cho đổi sân, nghỉ uống nước,
   * ghi điểm và chuẩn bị trận.
   *
   * Ví dụ 15 nghĩa là 15%.
   */
  overheadPercent?: number;

  /**
   * Giờ bắt đầu theo định dạng HH:mm.
   *
   * Ví dụ:
   * - "19:00"
   * - "20:30"
   */
  startTime?: string;
};

export type RoundRecommendation = {
  roundCount: number;

  recommendationScore: number;

  qualityScore: number;
  participationScore: number;

  /**
   * Chỉ có khi đề xuất dựa trên thời gian.
   */
  timeFitScore: number | null;

  totalMatches: number;

  averageMatchesPerMember: number;

  averageRestRoundsPerMember: number;

  matchCountDifference: number;

  restCountDifference: number;

  maxConsecutiveRestCount: number;

  maxTeammateRepeatCount: number;

  maxOpponentRepeatCount: number;

  /**
   * Tổng thời gian dự kiến của phương án.
   * Bao gồm cả thời gian overhead.
   */
  estimatedDurationMinutes: number | null;

  /**
   * Giờ kết thúc dự kiến theo định dạng HH:mm.
   */
  estimatedEndTime: string | null;

  /**
   * Chênh lệch so với thời lượng người dùng nhập.
   * Số âm nghĩa là kết thúc sớm hơn.
   * Số dương nghĩa là vượt thời lượng.
   */
  durationDifferenceMinutes: number | null;

  level: RoundRecommendationLevel;

  label: string;

  description: string;

  isRecommended: boolean;
};

export type RoundRecommendationResult = {
  planningMode: RecommendationPlanningMode;

  automaticRoundCount: number;

  /**
   * Số round ước tính trực tiếp từ thời lượng.
   * Chỉ có trong chế độ time-based.
   */
  timeBasedRoundCount: number | null;

  recommendedRoundCount: number | null;

  sessionDurationMinutes: number | null;

  effectivePlayMinutes: number | null;

  averageRoundMinutes: number | null;

  overheadPercent: number | null;

  startTime: string | null;

  recommendations: RoundRecommendation[];
};

type BuildRoundRecommendationsParams = {
  session: SessionRecord;

  /**
   * Danh sách số round muốn kiểm tra thủ công.
   *
   * Nếu có timeInput nhưng không truyền danh sách này,
   * hệ thống sẽ tạo 5 phương án xoay quanh số round
   * tính từ thời lượng.
   */
  candidateRoundCounts?: number[];

  /**
   * Giới hạn số phương án.
   *
   * Theo yêu cầu hiện tại, mặc định là 5.
   */
  candidateLimit?: number;

  /**
   * Thông tin thời lượng buổi chơi.
   *
   * Không truyền trường này thì hệ thống hoạt động
   * theo chế độ round-based.
   */
  timeInput?: RecommendationTimeInput;
};

type NormalizedTimePlan = {
  sessionDurationMinutes: number;

  averageRoundMinutes: number;

  overheadPercent: number;

  effectivePlayMinutes: number;

  timeBasedRoundCount: number;

  startTime: string | null;
};

const DEFAULT_CANDIDATE_LIMIT = 5;

const MAX_CANDIDATE_LIMIT = 5;

/**
 * Mục tiêu số trận trung bình cho mỗi người.
 *
 * Đây là giá trị dùng để chấm điểm đề xuất,
 * không phải giới hạn bắt buộc.
 */
const TARGET_MATCHES_PER_MEMBER = 4;

const DEFAULT_OVERHEAD_PERCENT = 15;

const MINIMUM_ROUND_COUNT = 1;

const MAXIMUM_ROUND_COUNT = 100;

export function buildRoundRecommendations({
  session,
  candidateRoundCounts,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
  timeInput,
}: BuildRoundRecommendationsParams): RoundRecommendationResult {
  const automaticRoundCount =
    getAutomaticRoundCount(session);

  const safeCandidateLimit = clampInteger(
    candidateLimit,
    1,
    MAX_CANDIDATE_LIMIT
  );

  const normalizedTimePlan =
    normalizeTimePlan(timeInput);

  const planningMode: RecommendationPlanningMode =
    normalizedTimePlan
      ? "time-based"
      : "round-based";

  const referenceRoundCount =
    normalizedTimePlan?.timeBasedRoundCount ??
    automaticRoundCount;

  const roundCounts =
    candidateRoundCounts &&
    candidateRoundCounts.length > 0
      ? normalizeRoundCounts(
          candidateRoundCounts,
          safeCandidateLimit
        )
      : createDefaultRoundCounts({
          referenceRoundCount,
          automaticRoundCount,
          candidateLimit: safeCandidateLimit,
          planningMode,
        });

  const recommendations = roundCounts.map(
    (roundCount) =>
      evaluateRoundCount({
        session,
        roundCount,
        timePlan: normalizedTimePlan,
      })
  );

  const sortedRecommendations = [
    ...recommendations,
  ].sort(compareRoundRecommendations);

  const recommendedRoundCount =
    sortedRecommendations[0]?.roundCount ??
    null;

  return {
    planningMode,

    automaticRoundCount,

    timeBasedRoundCount:
      normalizedTimePlan?.timeBasedRoundCount ??
      null,

    recommendedRoundCount,

    sessionDurationMinutes:
      normalizedTimePlan?.sessionDurationMinutes ??
      null,

    effectivePlayMinutes:
      normalizedTimePlan?.effectivePlayMinutes ??
      null,

    averageRoundMinutes:
      normalizedTimePlan?.averageRoundMinutes ??
      null,

    overheadPercent:
      normalizedTimePlan?.overheadPercent ??
      null,

    startTime:
      normalizedTimePlan?.startTime ??
      null,

    recommendations:
      sortedRecommendations.map(
        (recommendation, index) => ({
          ...recommendation,

          isRecommended:
            index === 0,
        })
      ),
  };
}

export function getAutomaticRoundCount(
  session: SessionRecord
): number {
  if (session.mode === "team") {
    const teamACount =
      session.teamConfig?.teamAMemberIds
        .length ?? 0;

    const teamBCount =
      session.teamConfig?.teamBMemberIds
        .length ?? 0;

    return Math.max(
      1,
      teamACount,
      teamBCount
    );
  }

  return Math.max(
    1,
    session.memberIds.length - 1
  );
}

export function calculateTimeBasedRoundCount(
  timeInput: RecommendationTimeInput
): number {
  const normalizedTimePlan =
    normalizeTimePlan(timeInput);

  return (
    normalizedTimePlan?.timeBasedRoundCount ??
    1
  );
}

function evaluateRoundCount({
  session,
  roundCount,
  timePlan,
}: {
  session: SessionRecord;

  roundCount: number;

  timePlan: NormalizedTimePlan | null;
}): RoundRecommendation {
  const evaluationSession: SessionRecord = {
    ...session,

    targetRounds: roundCount,

    /**
     * Không sử dụng snapshot cũ.
     *
     * Mỗi phương án phải được Scheduler sinh lại
     * theo đúng số round đang đánh giá.
     */
    scheduleSnapshot: undefined,

    schedulerVersion: undefined,

    scheduleCreatedAt: undefined,
  };

  const schedule =
    buildSessionSchedule(
      evaluationSession
    );

  const qualityReport =
    analyzeSchedule({
      schedule,

      memberIds:
        evaluationSession.memberIds,
    });

  const memberCount = Math.max(
    1,
    evaluationSession.memberIds.length
  );

  const averageMatchesPerMember =
    roundToTwoDecimals(
      (qualityReport.totalMatches * 4) /
        memberCount
    );

  const totalRestSlots =
    schedule.rounds.reduce(
      (sum, round) =>
        sum +
        round.restingMemberIds.length,
      0
    );

  const averageRestRoundsPerMember =
    roundToTwoDecimals(
      totalRestSlots / memberCount
    );

  const participationScore =
    calculateParticipationScore(
      averageMatchesPerMember
    );

  const timingEvaluation =
    calculateTimingEvaluation({
      roundCount,
      timePlan,
    });

  const repeatPenalty =
    calculateRepeatPenalty(
      qualityReport
    );

  const recommendationScore =
    timePlan
      ? clampScore(
          qualityReport.qualityScore *
            0.65 +
            participationScore * 0.2 +
            timingEvaluation.timeFitScore *
              0.15 -
            repeatPenalty
        )
      : clampScore(
          qualityReport.qualityScore *
            0.75 +
            participationScore * 0.25 -
            repeatPenalty
        );

  const presentation =
    getRecommendationPresentation(
      recommendationScore
    );

  return {
    roundCount,

    recommendationScore:
      roundToTwoDecimals(
        recommendationScore
      ),

    qualityScore:
      roundToTwoDecimals(
        qualityReport.qualityScore
      ),

    participationScore:
      roundToTwoDecimals(
        participationScore
      ),

    timeFitScore:
      timePlan
        ? roundToTwoDecimals(
            timingEvaluation.timeFitScore
          )
        : null,

    totalMatches:
      qualityReport.totalMatches,

    averageMatchesPerMember,

    averageRestRoundsPerMember,

    matchCountDifference:
      qualityReport.matchCountDifference,

    restCountDifference:
      qualityReport.restCountDifference,

    maxConsecutiveRestCount:
      qualityReport.maxConsecutiveRestCount,

    maxTeammateRepeatCount:
      qualityReport.maxTeammateRepeatCount,

    maxOpponentRepeatCount:
      qualityReport.maxOpponentRepeatCount,

    estimatedDurationMinutes:
      timingEvaluation
        .estimatedDurationMinutes,

    estimatedEndTime:
      timingEvaluation.estimatedEndTime,

    durationDifferenceMinutes:
      timingEvaluation
        .durationDifferenceMinutes,

    level: presentation.level,

    label: presentation.label,

    description:
      createRecommendationDescription({
        baseDescription:
          presentation.description,

        timePlan,

        timingEvaluation,
      }),

    isRecommended: false,
  };
}

function normalizeTimePlan(
  timeInput:
    | RecommendationTimeInput
    | undefined
): NormalizedTimePlan | null {
  if (!timeInput) {
    return null;
  }

  const sessionDurationMinutes =
    normalizePositiveInteger(
      timeInput.sessionDurationMinutes
    );

  const averageRoundMinutes =
    normalizePositiveInteger(
      timeInput.averageRoundMinutes
    );

  if (
    sessionDurationMinutes === null ||
    averageRoundMinutes === null
  ) {
    return null;
  }

  const overheadPercent =
    clampNumber(
      Number(
        timeInput.overheadPercent ??
          DEFAULT_OVERHEAD_PERCENT
      ),
      0,
      60
    );

  const effectivePlayMinutes =
    roundToTwoDecimals(
      sessionDurationMinutes *
        (1 - overheadPercent / 100)
    );

  const timeBasedRoundCount =
    clampInteger(
      Math.floor(
        effectivePlayMinutes /
          averageRoundMinutes
      ),
      MINIMUM_ROUND_COUNT,
      MAXIMUM_ROUND_COUNT
    );

  const startTime =
    normalizeStartTime(
      timeInput.startTime
    );

  return {
    sessionDurationMinutes,

    averageRoundMinutes,

    overheadPercent,

    effectivePlayMinutes,

    timeBasedRoundCount,

    startTime,
  };
}

function createDefaultRoundCounts({
  referenceRoundCount,
  automaticRoundCount,
  candidateLimit,
  planningMode,
}: {
  referenceRoundCount: number;

  automaticRoundCount: number;

  candidateLimit: number;

  planningMode:
    RecommendationPlanningMode;
}): number[] {
  const candidateSet =
    new Set<number>();

  if (planningMode === "time-based") {
    /**
     * Đúng 5 phương án xoay quanh số round
     * tính từ thời lượng:
     *
     * target - 2
     * target - 1
     * target
     * target + 1
     * target + 2
     */
    for (
      let offset = -2;
      offset <= 2;
      offset += 1
    ) {
      candidateSet.add(
        referenceRoundCount + offset
      );
    }
  } else {
    /**
     * Chế độ không nhập thời gian.
     *
     * Tạo tối đa 5 phương án quanh số round tự động.
     */
    candidateSet.add(
      automaticRoundCount - 4
    );

    candidateSet.add(
      automaticRoundCount - 2
    );

    candidateSet.add(
      automaticRoundCount
    );

    candidateSet.add(
      automaticRoundCount + 2
    );

    candidateSet.add(
      automaticRoundCount + 4
    );
  }

  const validRoundCounts = [
    ...candidateSet,
  ]
    .filter(
      (roundCount) =>
        Number.isInteger(roundCount) &&
        roundCount >=
          MINIMUM_ROUND_COUNT &&
        roundCount <=
          MAXIMUM_ROUND_COUNT
    )
    .sort(
      (
        firstRoundCount,
        secondRoundCount
      ) =>
        firstRoundCount -
        secondRoundCount
    );

  /**
   * Khi target quá thấp, ví dụ target = 1,
   * các giá trị âm bị loại bỏ khiến danh sách
   * còn ít hơn 5 phương án.
   *
   * Bổ sung dần các round lớn hơn.
   */
  let nextRoundCount =
    Math.max(
      MINIMUM_ROUND_COUNT,
      referenceRoundCount + 3
    );

  while (
    validRoundCounts.length <
      candidateLimit &&
    nextRoundCount <=
      MAXIMUM_ROUND_COUNT
  ) {
    if (
      !validRoundCounts.includes(
        nextRoundCount
      )
    ) {
      validRoundCounts.push(
        nextRoundCount
      );
    }

    nextRoundCount += 1;
  }

  return validRoundCounts
    .sort(
      (
        firstRoundCount,
        secondRoundCount
      ) =>
        firstRoundCount -
        secondRoundCount
    )
    .slice(0, candidateLimit);
}

function normalizeRoundCounts(
  roundCounts: number[],
  candidateLimit: number
): number[] {
  return [
    ...new Set(
      roundCounts
        .map((roundCount) =>
          Math.floor(
            Number(roundCount)
          )
        )
        .filter(
          (roundCount) =>
            Number.isFinite(
              roundCount
            ) &&
            roundCount >=
              MINIMUM_ROUND_COUNT &&
            roundCount <=
              MAXIMUM_ROUND_COUNT
        )
    ),
  ]
    .sort(
      (
        firstRoundCount,
        secondRoundCount
      ) =>
        firstRoundCount -
        secondRoundCount
    )
    .slice(0, candidateLimit);
}

function calculateParticipationScore(
  averageMatchesPerMember: number
): number {
  if (
    averageMatchesPerMember <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,

    (averageMatchesPerMember /
      TARGET_MATCHES_PER_MEMBER) *
      100
  );
}

function calculateTimingEvaluation({
  roundCount,
  timePlan,
}: {
  roundCount: number;

  timePlan: NormalizedTimePlan | null;
}): {
  timeFitScore: number;

  estimatedDurationMinutes: number | null;

  estimatedEndTime: string | null;

  durationDifferenceMinutes: number | null;
} {
  if (!timePlan) {
    return {
      timeFitScore: 0,

      estimatedDurationMinutes: null,

      estimatedEndTime: null,

      durationDifferenceMinutes: null,
    };
  }

  const activePlayMinutes =
    roundCount *
    timePlan.averageRoundMinutes;

  const playableRatio =
    1 -
    timePlan.overheadPercent / 100;

  const estimatedDurationMinutes =
    playableRatio > 0
      ? Math.ceil(
          activePlayMinutes /
            playableRatio
        )
      : activePlayMinutes;

  const durationDifferenceMinutes =
    estimatedDurationMinutes -
    timePlan.sessionDurationMinutes;

  const roundDifference =
    Math.abs(
      roundCount -
        timePlan.timeBasedRoundCount
    );

  /**
   * Mỗi round chênh lệch làm giảm 18 điểm.
   *
   * Target chính xác: 100 điểm
   * Lệch 1 round: 82 điểm
   * Lệch 2 round: 64 điểm
   */
  const timeFitScore =
    clampScore(
      100 - roundDifference * 18
    );

  return {
    timeFitScore,

    estimatedDurationMinutes,

    estimatedEndTime:
      timePlan.startTime
        ? addMinutesToTime(
            timePlan.startTime,
            estimatedDurationMinutes
          )
        : null,

    durationDifferenceMinutes,
  };
}

function calculateRepeatPenalty(
  report: ScheduleQualityReport
): number {
  const teammateRepeatPenalty =
    Math.max(
      0,
      report.maxTeammateRepeatCount -
        2
    ) * 3;

  const opponentRepeatPenalty =
    Math.max(
      0,
      report.maxOpponentRepeatCount -
        4
    ) * 1.5;

  const consecutiveRestPenalty =
    Math.max(
      0,
      report.maxConsecutiveRestCount -
        1
    ) * 2;

  return (
    teammateRepeatPenalty +
    opponentRepeatPenalty +
    consecutiveRestPenalty
  );
}

function compareRoundRecommendations(
  firstRecommendation:
    RoundRecommendation,

  secondRecommendation:
    RoundRecommendation
): number {
  if (
    secondRecommendation
      .recommendationScore !==
    firstRecommendation
      .recommendationScore
  ) {
    return (
      secondRecommendation
        .recommendationScore -
      firstRecommendation
        .recommendationScore
    );
  }

  if (
    secondRecommendation.qualityScore !==
    firstRecommendation.qualityScore
  ) {
    return (
      secondRecommendation.qualityScore -
      firstRecommendation.qualityScore
    );
  }

  if (
    firstRecommendation
      .matchCountDifference !==
    secondRecommendation
      .matchCountDifference
  ) {
    return (
      firstRecommendation
        .matchCountDifference -
      secondRecommendation
        .matchCountDifference
    );
  }

  if (
    firstRecommendation
      .restCountDifference !==
    secondRecommendation
      .restCountDifference
  ) {
    return (
      firstRecommendation
        .restCountDifference -
      secondRecommendation
        .restCountDifference
    );
  }

  if (
    firstRecommendation
      .maxConsecutiveRestCount !==
    secondRecommendation
      .maxConsecutiveRestCount
  ) {
    return (
      firstRecommendation
        .maxConsecutiveRestCount -
      secondRecommendation
        .maxConsecutiveRestCount
    );
  }

  /**
   * Nếu mọi chỉ số bằng nhau,
   * ưu tiên phương án ít round hơn.
   */
  return (
    firstRecommendation.roundCount -
    secondRecommendation.roundCount
  );
}

function getRecommendationPresentation(
  score: number
): {
  level: RoundRecommendationLevel;

  label: string;

  description: string;
} {
  if (score >= 90) {
    return {
      level: "excellent",

      label: "Rất phù hợp",

      description:
        "Số round này mang lại mức cân bằng và thời lượng thi đấu rất tốt.",
    };
  }

  if (score >= 80) {
    return {
      level: "very-good",

      label: "Phù hợp",

      description:
        "Lịch đấu có độ cân bằng tốt và số trận trung bình hợp lý.",
    };
  }

  if (score >= 68) {
    return {
      level: "good",

      label: "Khá phù hợp",

      description:
        "Có thể sử dụng, nhưng vẫn có một số lượt nghỉ hoặc cặp đấu bị lặp.",
    };
  }

  return {
    level: "acceptable",

    label: "Có thể dùng",

    description:
      "Số round này vẫn tạo được lịch nhưng độ cân bằng hoặc thời lượng chưa tối ưu.",
  };
}

function createRecommendationDescription({
  baseDescription,
  timePlan,
  timingEvaluation,
}: {
  baseDescription: string;

  timePlan: NormalizedTimePlan | null;

  timingEvaluation: {
    estimatedDurationMinutes:
      | number
      | null;

    durationDifferenceMinutes:
      | number
      | null;
  };
}): string {
  if (
    !timePlan ||
    timingEvaluation
      .estimatedDurationMinutes === null ||
    timingEvaluation
      .durationDifferenceMinutes === null
  ) {
    return baseDescription;
  }

  const difference =
    timingEvaluation.durationDifferenceMinutes;

  if (Math.abs(difference) <= 5) {
    return `${baseDescription} Thời lượng dự kiến rất sát với thời gian buổi chơi.`;
  }

  if (difference < 0) {
    return `${baseDescription} Dự kiến kết thúc sớm khoảng ${Math.abs(
      difference
    )} phút.`;
  }

  return `${baseDescription} Dự kiến vượt thời lượng khoảng ${difference} phút.`;
}

function normalizePositiveInteger(
  value: unknown
): number | null {
  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(parsedValue) ||
    parsedValue <= 0
  ) {
    return null;
  }

  return Math.max(
    1,
    Math.floor(parsedValue)
  );
}

function normalizeStartTime(
  value: string | undefined
): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue =
    value.trim();

  const matchedValue =
    /^(\d{1,2}):(\d{2})$/.exec(
      trimmedValue
    );

  if (!matchedValue) {
    return null;
  }

  const hour =
    Number(matchedValue[1]);

  const minute =
    Number(matchedValue[2]);

  if (
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
}

function addMinutesToTime(
  startTime: string,
  minutesToAdd: number
): string {
  const [hourText, minuteText] =
    startTime.split(":");

  const startHour =
    Number(hourText);

  const startMinute =
    Number(minuteText);

  const totalMinutes =
    startHour * 60 +
    startMinute +
    minutesToAdd;

  const minutesInDay =
    24 * 60;

  const normalizedMinutes =
    ((totalMinutes % minutesInDay) +
      minutesInDay) %
    minutesInDay;

  const endHour =
    Math.floor(
      normalizedMinutes / 60
    );

  const endMinute =
    normalizedMinutes % 60;

  return `${String(endHour).padStart(
    2,
    "0"
  )}:${String(endMinute).padStart(
    2,
    "0"
  )}`;
}

function clampInteger(
  value: number,
  minimum: number,
  maximum: number
): number {
  const parsedValue =
    Number(value);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return minimum;
  }

  return Math.min(
    maximum,

    Math.max(
      minimum,
      Math.floor(parsedValue)
    )
  );
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  if (
    !Number.isFinite(value)
  ) {
    return minimum;
  }

  return Math.min(
    maximum,
    Math.max(minimum, value)
  );
}

function clampScore(
  score: number
): number {
  return clampNumber(
    score,
    0,
    100
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
