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

export type RoundRecommendation = {
  roundCount: number;

  recommendationScore: number;

  qualityScore: number;
  participationScore: number;

  totalMatches: number;
  averageMatchesPerMember: number;

  matchCountDifference: number;
  restCountDifference: number;

  maxConsecutiveRestCount: number;
  maxTeammateRepeatCount: number;
  maxOpponentRepeatCount: number;

  level: RoundRecommendationLevel;
  label: string;
  description: string;

  isRecommended: boolean;
};

export type RoundRecommendationResult = {
  automaticRoundCount: number;

  recommendedRoundCount: number | null;

  recommendations: RoundRecommendation[];
};

type BuildRoundRecommendationsParams = {
  session: SessionRecord;

  /**
   * Danh sách số round muốn kiểm tra.
   *
   * Nếu không truyền, hệ thống sẽ tự tạo
   * một danh sách phương án phù hợp.
   */
  candidateRoundCounts?: number[];

  /**
   * Giới hạn số phương án để tránh làm
   * trình duyệt điện thoại bị chậm.
   */
  candidateLimit?: number;
};

const DEFAULT_CANDIDATE_LIMIT = 7;

/**
 * Số trận trung bình mỗi thành viên nên có
 * để một session mang lại trải nghiệm đủ tốt.
 *
 * Đây chỉ là mục tiêu dùng để tính điểm đề xuất,
 * không phải giới hạn bắt buộc.
 */
const TARGET_MATCHES_PER_MEMBER = 4;

export function buildRoundRecommendations({
  session,
  candidateRoundCounts,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
}: BuildRoundRecommendationsParams): RoundRecommendationResult {
  const automaticRoundCount =
    getAutomaticRoundCount(session);

  const safeCandidateLimit = Math.max(
    1,
    Math.floor(candidateLimit)
  );

  const roundCounts =
    candidateRoundCounts &&
    candidateRoundCounts.length > 0
      ? normalizeRoundCounts(
          candidateRoundCounts,
          safeCandidateLimit
        )
      : createDefaultRoundCounts({
          session,
          automaticRoundCount,
          candidateLimit: safeCandidateLimit,
        });

  const recommendations = roundCounts.map(
    (roundCount) =>
      evaluateRoundCount({
        session,
        roundCount,
      })
  );

  const sortedRecommendations = [
    ...recommendations,
  ].sort(compareRoundRecommendations);

  const recommendedRoundCount =
    sortedRecommendations[0]?.roundCount ?? null;

  return {
    automaticRoundCount,

    recommendedRoundCount,

    recommendations:
      sortedRecommendations.map(
        (recommendation, index) => ({
          ...recommendation,
          isRecommended: index === 0,
        })
      ),
  };
}

export function getAutomaticRoundCount(
  session: SessionRecord
): number {
  if (session.mode === "team") {
    const teamACount =
      session.teamConfig?.teamAMemberIds.length ??
      0;

    const teamBCount =
      session.teamConfig?.teamBMemberIds.length ??
      0;

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

function evaluateRoundCount({
  session,
  roundCount,
}: {
  session: SessionRecord;
  roundCount: number;
}): RoundRecommendation {
  const evaluationSession: SessionRecord = {
    ...session,

    targetRounds: roundCount,

    /**
     * Bắt buộc bỏ snapshot cũ để Scheduler
     * sinh lịch mới cho đúng số round cần đánh giá.
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

  const participationScore =
    calculateParticipationScore(
      averageMatchesPerMember
    );

  const repeatPenalty =
    calculateRepeatPenalty(
      qualityReport
    );

  const recommendationScore =
    clampScore(
      qualityReport.qualityScore * 0.75 +
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

    totalMatches:
      qualityReport.totalMatches,

    averageMatchesPerMember,

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

    level: presentation.level,

    label: presentation.label,

    description:
      presentation.description,

    isRecommended: false,
  };
}

function createDefaultRoundCounts({
  session,
  automaticRoundCount,
  candidateLimit,
}: {
  session: SessionRecord;
  automaticRoundCount: number;
  candidateLimit: number;
}): number[] {
  const memberCount =
    session.memberIds.length;

  const minimumRoundCount =
    memberCount <= 5 ? 3 : 4;

  const maximumRoundCount = Math.min(
    16,
    Math.max(
      minimumRoundCount,
      automaticRoundCount + 4
    )
  );

  const candidateSet = new Set<number>();

  candidateSet.add(minimumRoundCount);
  candidateSet.add(automaticRoundCount);

  candidateSet.add(
    automaticRoundCount - 4
  );

  candidateSet.add(
    automaticRoundCount - 2
  );

  candidateSet.add(
    automaticRoundCount + 2
  );

  candidateSet.add(
    automaticRoundCount + 4
  );

  /**
   * Các mốc phổ biến khi chơi thực tế.
   */
  candidateSet.add(4);
  candidateSet.add(6);
  candidateSet.add(8);
  candidateSet.add(10);
  candidateSet.add(12);

  const normalizedRoundCounts = [
    ...candidateSet,
  ]
    .filter(
      (roundCount) =>
        Number.isInteger(roundCount) &&
        roundCount >= minimumRoundCount &&
        roundCount <= maximumRoundCount
    )
    .sort(
      (firstRoundCount, secondRoundCount) => {
        const firstDistance = Math.abs(
          firstRoundCount -
            automaticRoundCount
        );

        const secondDistance = Math.abs(
          secondRoundCount -
            automaticRoundCount
        );

        if (
          firstDistance !== secondDistance
        ) {
          return (
            firstDistance -
            secondDistance
          );
        }

        return (
          firstRoundCount -
          secondRoundCount
        );
      }
    )
    .slice(0, candidateLimit)
    .sort(
      (firstRoundCount, secondRoundCount) =>
        firstRoundCount -
        secondRoundCount
    );

  if (
    normalizedRoundCounts.length > 0
  ) {
    return normalizedRoundCounts;
  }

  return [
    Math.max(
      1,
      automaticRoundCount
    ),
  ];
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
            roundCount > 0
        )
    ),
  ]
    .sort(
      (firstRoundCount, secondRoundCount) =>
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

function calculateRepeatPenalty(
  report: ScheduleQualityReport
): number {
  const teammateRepeatPenalty =
    Math.max(
      0,
      report.maxTeammateRepeatCount - 2
    ) * 3;

  const opponentRepeatPenalty =
    Math.max(
      0,
      report.maxOpponentRepeatCount - 4
    ) * 1.5;

  const consecutiveRestPenalty =
    Math.max(
      0,
      report.maxConsecutiveRestCount - 1
    ) * 2;

  return (
    teammateRepeatPenalty +
    opponentRepeatPenalty +
    consecutiveRestPenalty
  );
}

function compareRoundRecommendations(
  firstRecommendation: RoundRecommendation,
  secondRecommendation: RoundRecommendation
): number {
  if (
    secondRecommendation.recommendationScore !==
    firstRecommendation.recommendationScore
  ) {
    return (
      secondRecommendation.recommendationScore -
      firstRecommendation.recommendationScore
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
    firstRecommendation.matchCountDifference !==
    secondRecommendation.matchCountDifference
  ) {
    return (
      firstRecommendation.matchCountDifference -
      secondRecommendation.matchCountDifference
    );
  }

  if (
    firstRecommendation.restCountDifference !==
    secondRecommendation.restCountDifference
  ) {
    return (
      firstRecommendation.restCountDifference -
      secondRecommendation.restCountDifference
    );
  }

  if (
    firstRecommendation.maxConsecutiveRestCount !==
    secondRecommendation.maxConsecutiveRestCount
  ) {
    return (
      firstRecommendation.maxConsecutiveRestCount -
      secondRecommendation.maxConsecutiveRestCount
    );
  }

  /**
   * Nếu mọi chỉ số bằng nhau,
   * ưu tiên phương án ít round hơn
   * để buổi chơi không kéo dài không cần thiết.
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
      "Số round này vẫn tạo được lịch nhưng độ cân bằng hoặc số trận chưa tối ưu.",
  };
}

function clampScore(
  score: number
): number {
  return Math.min(
    100,
    Math.max(0, score)
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
