import {
  DEFAULT_K_FACTOR,
  DEFAULT_RATING,
  ELO_RATING_SCALE,
  MAX_RATING,
  MIN_RATING,
} from "./constants";

export type EloMatchResult = 0 | 0.5 | 1;

export type CalculateEloDeltaParams = {
  /**
   * Rating hiện tại của người chơi hoặc đội.
   */
  rating: number;

  /**
   * Rating của đối thủ.
   */
  opponentRating: number;

  /**
   * Kết quả thực tế:
   *
   * 1   = thắng
   * 0.5 = hòa
   * 0   = thua
   */
  actualScore: EloMatchResult;

  /**
   * Hệ số K tùy chỉnh.
   *
   * Nếu không truyền sẽ dùng DEFAULT_K_FACTOR.
   */
  kFactor?: number;
};

export type CalculateNewRatingParams =
  CalculateEloDeltaParams & {
    /**
     * Có làm tròn rating hay không.
     *
     * Mặc định true.
     */
    roundResult?: boolean;
  };

/**
 * Chuẩn hóa rating về khoảng hợp lệ.
 */
export function clampRating(
  rating: number
): number {
  if (!Number.isFinite(rating)) {
    return DEFAULT_RATING;
  }

  return Math.min(
    MAX_RATING,
    Math.max(
      MIN_RATING,
      rating
    )
  );
}

/**
 * Tính rating trung bình của một đội.
 *
 * Nếu danh sách rỗng hoặc toàn giá trị không hợp lệ,
 * hàm sẽ trả về DEFAULT_RATING.
 */
export function calculateTeamAverageRating(
  ratings: number[]
): number {
  const validRatings = ratings
    .map((rating) =>
      Number(rating)
    )
    .filter((rating) =>
      Number.isFinite(rating)
    );

  if (validRatings.length === 0) {
    return DEFAULT_RATING;
  }

  const totalRating =
    validRatings.reduce(
      (sum, rating) =>
        sum + clampRating(rating),
      0
    );

  return (
    totalRating /
    validRatings.length
  );
}

/**
 * Tính xác suất thắng dự kiến theo Elo.
 *
 * Kết quả nằm trong khoảng 0–1.
 *
 * Ví dụ:
 * - 0.5 = hai bên ngang nhau;
 * - 0.75 = bên hiện tại có khoảng 75% khả năng thắng;
 * - 0.25 = bên hiện tại yếu hơn.
 */
export function calculateExpectedScore(
  rating: number,
  opponentRating: number
): number {
  const safeRating =
    clampRating(rating);

  const safeOpponentRating =
    clampRating(opponentRating);

  const exponent =
    (safeOpponentRating -
      safeRating) /
    ELO_RATING_SCALE;

  return (
    1 /
    (1 + Math.pow(10, exponent))
  );
}

/**
 * Tính phần rating thay đổi sau một trận.
 *
 * Công thức:
 *
 * delta =
 * K × (actualScore - expectedScore)
 *
 * Giá trị có thể là số dương hoặc âm.
 */
export function calculateEloDelta({
  rating,
  opponentRating,
  actualScore,
  kFactor = DEFAULT_K_FACTOR,
}: CalculateEloDeltaParams): number {
  const safeActualScore =
    normalizeActualScore(actualScore);

  const safeKFactor =
    normalizeKFactor(kFactor);

  const expectedScore =
    calculateExpectedScore(
      rating,
      opponentRating
    );

  return (
    safeKFactor *
    (safeActualScore -
      expectedScore)
  );
}

/**
 * Tính rating mới sau một trận.
 */
export function calculateNewRating({
  rating,
  opponentRating,
  actualScore,
  kFactor = DEFAULT_K_FACTOR,
  roundResult = true,
}: CalculateNewRatingParams): number {
  const safeCurrentRating =
    clampRating(rating);

  const delta =
    calculateEloDelta({
      rating: safeCurrentRating,
      opponentRating,
      actualScore,
      kFactor,
    });

  const nextRating =
    clampRating(
      safeCurrentRating +
        delta
    );

  return roundResult
    ? Math.round(nextRating)
    : nextRating;
}

/**
 * Tính rating mới cho cả hai bên trong cùng một trận.
 *
 * Hàm này đảm bảo:
 * - một bên thắng thì bên kia thua;
 * - tổng rating thay đổi gần như bằng 0
 *   nếu không bị chạm MIN_RATING hoặc MAX_RATING.
 */
export function calculateHeadToHeadRatings(params: {
  firstRating: number;

  secondRating: number;

  /**
   * Kết quả của bên thứ nhất.
   *
   * 1   = bên thứ nhất thắng
   * 0.5 = hòa
   * 0   = bên thứ nhất thua
   */
  firstActualScore: EloMatchResult;

  kFactor?: number;

  roundResult?: boolean;
}): {
  firstExpectedScore: number;
  secondExpectedScore: number;

  firstDelta: number;
  secondDelta: number;

  firstNewRating: number;
  secondNewRating: number;
} {
  const {
    firstRating,
    secondRating,
    firstActualScore,
    kFactor = DEFAULT_K_FACTOR,
    roundResult = true,
  } = params;

  const safeFirstScore =
    normalizeActualScore(
      firstActualScore
    );

  const secondActualScore =
    normalizeActualScore(
      1 - safeFirstScore
    );

  const firstExpectedScore =
    calculateExpectedScore(
      firstRating,
      secondRating
    );

  const secondExpectedScore =
    calculateExpectedScore(
      secondRating,
      firstRating
    );

  const firstDelta =
    calculateEloDelta({
      rating: firstRating,
      opponentRating:
        secondRating,
      actualScore:
        safeFirstScore,
      kFactor,
    });

  const secondDelta =
    calculateEloDelta({
      rating: secondRating,
      opponentRating:
        firstRating,
      actualScore:
        secondActualScore,
      kFactor,
    });

  const rawFirstNewRating =
    clampRating(
      clampRating(firstRating) +
        firstDelta
    );

  const rawSecondNewRating =
    clampRating(
      clampRating(secondRating) +
        secondDelta
    );

  return {
    firstExpectedScore,

    secondExpectedScore,

    firstDelta:
      roundResult
        ? Math.round(firstDelta)
        : firstDelta,

    secondDelta:
      roundResult
        ? Math.round(secondDelta)
        : secondDelta,

    firstNewRating:
      roundResult
        ? Math.round(
            rawFirstNewRating
          )
        : rawFirstNewRating,

    secondNewRating:
      roundResult
        ? Math.round(
            rawSecondNewRating
          )
        : rawSecondNewRating,
  };
}

/**
 * Chuyển xác suất từ 0–1 sang phần trăm 0–100.
 */
export function expectedScoreToPercent(
  expectedScore: number
): number {
  if (
    !Number.isFinite(
      expectedScore
    )
  ) {
    return 50;
  }

  return Math.min(
    100,
    Math.max(
      0,
      expectedScore * 100
    )
  );
}

function normalizeActualScore(
  actualScore: number
): EloMatchResult {
  if (actualScore >= 1) {
    return 1;
  }

  if (actualScore <= 0) {
    return 0;
  }

  return 0.5;
}

function normalizeKFactor(
  kFactor: number
): number {
  if (
    !Number.isFinite(kFactor) ||
    kFactor <= 0
  ) {
    return DEFAULT_K_FACTOR;
  }

  return kFactor;
}
