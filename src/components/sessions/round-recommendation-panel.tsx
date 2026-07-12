"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Clock3,
  Info,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import SectionCard from "@/components/section-card";
import RoundRecommendationCard from "@/components/sessions/round-recommendation-card";

import type {
  SessionMode,
  SessionRecord,
} from "@/types";

import {
  buildRoundRecommendations,
  type RoundRecommendation,
  type RoundRecommendationResult,
} from "@/lib/sessions/round-recommendation";

type RoundRecommendationPanelProps = {
  memberIds: string[];

  mode: SessionMode;

  courtCount: number;

  pointToWin: number;

  teamConfig?: SessionRecord["teamConfig"];

  /**
   * Số round hiện đang được chọn ở trang tạo session.
   */
  selectedRoundCount?: number;

  /**
   * Trả số round được chọn về trang tạo session.
   */
  onSelectRound: (
    roundCount: number
  ) => void;
};

const DEFAULT_SESSION_HOURS = 2;
const DEFAULT_SESSION_EXTRA_MINUTES = 0;
const DEFAULT_AVERAGE_ROUND_MINUTES = 12;
const DEFAULT_OVERHEAD_PERCENT = 15;
const DEFAULT_START_TIME = "19:00";

export default function RoundRecommendationPanel({
  memberIds,
  mode,
  courtCount,
  pointToWin,
  teamConfig,
  selectedRoundCount,
  onSelectRound,
}: RoundRecommendationPanelProps) {
  const [sessionHours, setSessionHours] =
    useState(DEFAULT_SESSION_HOURS);

  const [
    sessionExtraMinutes,
    setSessionExtraMinutes,
  ] = useState(
    DEFAULT_SESSION_EXTRA_MINUTES
  );

  const [
    averageRoundMinutes,
    setAverageRoundMinutes,
  ] = useState(
    DEFAULT_AVERAGE_ROUND_MINUTES
  );

  const [
    overheadPercent,
    setOverheadPercent,
  ] = useState(
    DEFAULT_OVERHEAD_PERCENT
  );

  const [startTime, setStartTime] =
    useState(DEFAULT_START_TIME);

  const [
    recommendationResult,
    setRecommendationResult,
  ] =
    useState<RoundRecommendationResult | null>(
      null
    );

  const [
    selectedRecommendationRound,
    setSelectedRecommendationRound,
  ] = useState<number | null>(
    selectedRoundCount ?? null
  );

  const [isCalculating, setIsCalculating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const sessionDurationMinutes =
    useMemo(() => {
      return (
        sessionHours * 60 +
        sessionExtraMinutes
      );
    }, [
      sessionHours,
      sessionExtraMinutes,
    ]);

  const canGenerateRecommendation =
    useMemo(() => {
      if (memberIds.length < 4) {
        return false;
      }

      if (
        !Number.isInteger(courtCount) ||
        courtCount <= 0
      ) {
        return false;
      }

      if (
        sessionDurationMinutes <= 0 ||
        averageRoundMinutes <= 0
      ) {
        return false;
      }

      if (mode === "team") {
        const teamACount =
          teamConfig?.teamAMemberIds
            .length ?? 0;

        const teamBCount =
          teamConfig?.teamBMemberIds
            .length ?? 0;

        return (
          teamACount >= 2 &&
          teamBCount >= 2
        );
      }

      return true;
    }, [
      memberIds.length,
      courtCount,
      sessionDurationMinutes,
      averageRoundMinutes,
      mode,
      teamConfig,
    ]);

  function validateInputs(): boolean {
    if (memberIds.length < 4) {
      setErrorMessage(
        "Cần chọn ít nhất 4 thành viên trước khi tạo đề xuất."
      );

      return false;
    }

    if (
      !Number.isInteger(courtCount) ||
      courtCount <= 0
    ) {
      setErrorMessage(
        "Số sân phải là số nguyên lớn hơn 0."
      );

      return false;
    }

    if (
      !Number.isInteger(sessionHours) ||
      sessionHours < 0
    ) {
      setErrorMessage(
        "Số giờ phải là số nguyên từ 0 trở lên."
      );

      return false;
    }

    if (
      !Number.isInteger(
        sessionExtraMinutes
      ) ||
      sessionExtraMinutes < 0 ||
      sessionExtraMinutes > 59
    ) {
      setErrorMessage(
        "Số phút bổ sung phải nằm trong khoảng 0–59."
      );

      return false;
    }

    if (sessionDurationMinutes <= 0) {
      setErrorMessage(
        "Tổng thời lượng buổi chơi phải lớn hơn 0 phút."
      );

      return false;
    }

    if (
      !Number.isInteger(
        averageRoundMinutes
      ) ||
      averageRoundMinutes <= 0
    ) {
      setErrorMessage(
        "Thời gian trung bình mỗi round phải là số nguyên lớn hơn 0."
      );

      return false;
    }

    if (
      !Number.isFinite(
        overheadPercent
      ) ||
      overheadPercent < 0 ||
      overheadPercent > 60
    ) {
      setErrorMessage(
        "Tỷ lệ nghỉ và đổi sân phải nằm trong khoảng 0–60%."
      );

      return false;
    }

    if (mode === "team") {
      const teamACount =
        teamConfig?.teamAMemberIds
          .length ?? 0;

      const teamBCount =
        teamConfig?.teamBMemberIds
          .length ?? 0;

      if (
        teamACount < 2 ||
        teamBCount < 2
      ) {
        setErrorMessage(
          "Team mode cần chia ít nhất 2 thành viên vào mỗi đội trước khi tạo đề xuất."
        );

        return false;
      }
    }

    setErrorMessage("");

    return true;
  }

  function handleGenerateRecommendations(): void {
    if (!validateInputs()) {
      return;
    }

    setIsCalculating(true);
    setErrorMessage("");

    try {
      const temporarySession: SessionRecord =
        {
          id: "__round_recommendation__",

          date: new Date()
            .toISOString()
            .slice(0, 10),

          pointToWin,

          memberIds: [
            ...memberIds,
          ],

          createdAt:
            new Date().toISOString(),

          mode,

          courtCount,

          teamConfig:
            mode === "team"
              ? teamConfig
              : undefined,

          /**
           * Không truyền targetRounds.
           *
           * Recommendation Engine sẽ tự thử
           * tối đa 5 phương án khác nhau.
           */
          targetRounds: undefined,

          scheduleSnapshot: undefined,

          schedulerVersion: undefined,

          scheduleCreatedAt: undefined,
        };

      const result =
        buildRoundRecommendations({
          session:
            temporarySession,

          candidateLimit: 5,

          timeInput: {
            sessionDurationMinutes,

            averageRoundMinutes,

            overheadPercent,

            startTime,
          },
        });

      setRecommendationResult(
        result
      );

      const recommendedRoundCount =
        result.recommendedRoundCount;

      if (
        recommendedRoundCount !== null
      ) {
        setSelectedRecommendationRound(
          recommendedRoundCount
        );
      }
    } catch (error) {
      console.error(
        "Build round recommendations failed:",
        error
      );

      setErrorMessage(
        "Không thể tạo đề xuất số round. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsCalculating(false);
    }
  }

  function handleSelectRecommendation(
    recommendation: RoundRecommendation
  ): void {
    setSelectedRecommendationRound(
      recommendation.roundCount
    );

    onSelectRound(
      recommendation.roundCount
    );
  }

  function handleUseBestRecommendation(): void {
    const recommendedRoundCount =
      recommendationResult
        ?.recommendedRoundCount;

    if (
      recommendedRoundCount === null ||
      recommendedRoundCount ===
        undefined
    ) {
      return;
    }

    setSelectedRecommendationRound(
      recommendedRoundCount
    );

    onSelectRound(
      recommendedRoundCount
    );
  }

  function handleReset(): void {
    setSessionHours(
      DEFAULT_SESSION_HOURS
    );

    setSessionExtraMinutes(
      DEFAULT_SESSION_EXTRA_MINUTES
    );

    setAverageRoundMinutes(
      DEFAULT_AVERAGE_ROUND_MINUTES
    );

    setOverheadPercent(
      DEFAULT_OVERHEAD_PERCENT
    );

    setStartTime(
      DEFAULT_START_TIME
    );

    setRecommendationResult(null);

    setSelectedRecommendationRound(
      selectedRoundCount ?? null
    );

    setErrorMessage("");
  }

  return (
    <SectionCard
      title="Đề xuất số round theo thời gian"
      action={
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw size={16} />
          Đặt lại
        </button>
      }
    >
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-600">
            <Sparkles size={20} />
          </div>

          <div>
            <div className="font-semibold text-slate-900">
              Session Recommendation Engine
            </div>

            <div className="mt-1 text-sm leading-6 text-slate-600">
              Hệ thống sẽ thử tối đa 5 phương án số
              round, tạo lịch cho từng phương án rồi
              đánh giá độ cân bằng, số trận mỗi người
              và mức phù hợp với thời lượng buổi chơi.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InputBlock label="Số giờ chơi">
          <input
            type="number"
            min={0}
            max={12}
            step={1}
            value={sessionHours}
            onChange={(event) =>
              setSessionHours(
                normalizeIntegerInput(
                  event.target.value,
                  0
                )
              )
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
        </InputBlock>

        <InputBlock label="Phút bổ sung">
          <input
            type="number"
            min={0}
            max={59}
            step={5}
            value={sessionExtraMinutes}
            onChange={(event) =>
              setSessionExtraMinutes(
                normalizeIntegerInput(
                  event.target.value,
                  0
                )
              )
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
        </InputBlock>

        <InputBlock label="Phút trung bình / round">
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            value={averageRoundMinutes}
            onChange={(event) =>
              setAverageRoundMinutes(
                normalizeIntegerInput(
                  event.target.value,
                  1
                )
              )
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
        </InputBlock>

        <InputBlock label="Nghỉ và đổi sân (%)">
          <input
            type="number"
            min={0}
            max={60}
            step={5}
            value={overheadPercent}
            onChange={(event) =>
              setOverheadPercent(
                normalizeNumberInput(
                  event.target.value,
                  0
                )
              )
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
        </InputBlock>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InputBlock label="Giờ bắt đầu">
          <input
            type="time"
            value={startTime}
            onChange={(event) =>
              setStartTime(
                event.target.value
              )
            }
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500"
          />
        </InputBlock>

        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Clock3 size={17} />
            Tổng thời lượng
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatDuration(
              sessionDurationMinutes
            )}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Đã bao gồm thời gian nghỉ và đổi sân.
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <Info
            size={18}
            className="mt-0.5 shrink-0 text-slate-500"
          />

          <div className="text-sm leading-6 text-slate-600">
            <div>
              Thành viên:{" "}
              <strong className="text-slate-900">
                {memberIds.length}
              </strong>
              {" • "}
              Số sân:{" "}
              <strong className="text-slate-900">
                {courtCount}
              </strong>
              {" • "}
              Mode:{" "}
              <strong className="text-slate-900">
                {mode === "team"
                  ? "Team"
                  : "Normal"}
              </strong>
            </div>

            <div className="mt-1">
              Thời gian thi đấu thực tế dự kiến sau
              khi trừ overhead:{" "}
              <strong className="text-slate-900">
                {formatDuration(
                  calculateEffectivePlayMinutes({
                    sessionDurationMinutes,
                    overheadPercent,
                  })
                )}
              </strong>
              .
            </div>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={
          handleGenerateRecommendations
        }
        disabled={
          !canGenerateRecommendation ||
          isCalculating
        }
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCalculating ? (
          <>
            <Loader2
              size={19}
              className="animate-spin"
            />
            Đang phân tích lịch...
          </>
        ) : (
          <>
            <Calculator size={19} />
            Tạo 5 phương án đề xuất
          </>
        )}
      </button>

      {memberIds.length < 4 ? (
        <div className="mt-3 text-center text-sm text-slate-500">
          Hãy chọn ít nhất 4 thành viên trước khi
          tạo đề xuất.
        </div>
      ) : null}

      {recommendationResult ? (
        <div className="mt-6">
          <RecommendationSummary
            result={
              recommendationResult
            }
            onUseBest={
              handleUseBestRecommendation
            }
          />

          <div className="mt-5 space-y-4">
            {recommendationResult.recommendations.map(
              (
                recommendation,
                index
              ) => (
                <RoundRecommendationCard
                  key={
                    recommendation.roundCount
                  }
                  recommendation={
                    recommendation
                  }
                  rank={index + 1}
                  selected={
                    selectedRecommendationRound ===
                    recommendation.roundCount
                  }
                  onSelect={
                    handleSelectRecommendation
                  }
                />
              )
            )}
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}

function RecommendationSummary({
  result,
  onUseBest,
}: {
  result: RoundRecommendationResult;

  onUseBest: () => void;
}) {
  const bestRecommendation =
    result.recommendations[0];

  if (!bestRecommendation) {
    return null;
  }

  return (
    <div className="rounded-3xl bg-slate-900 p-5 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles size={17} />
            Phương án được đề xuất
          </div>

          <div className="mt-2 text-3xl font-bold">
            {bestRecommendation.roundCount} round
          </div>

          <div className="mt-2 text-sm leading-6 text-slate-300">
            Điểm đề xuất{" "}
            <strong className="text-white">
              {bestRecommendation.recommendationScore.toFixed(
                1
              )}
            </strong>
            {" • "}
            Chất lượng lịch{" "}
            <strong className="text-white">
              {bestRecommendation.qualityScore.toFixed(
                1
              )}
            </strong>
          </div>
        </div>

        <button
          type="button"
          onClick={onUseBest}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
        >
          Dùng đề xuất{" "}
          {bestRecommendation.roundCount} round
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryMetric
          label="Thời lượng"
          value={
            bestRecommendation.estimatedDurationMinutes !==
            null
              ? formatDuration(
                  bestRecommendation.estimatedDurationMinutes
                )
              : "-"
          }
        />

        <SummaryMetric
          label="Kết thúc"
          value={
            bestRecommendation.estimatedEndTime ??
            "-"
          }
        />

        <SummaryMetric
          label="TB trận/người"
          value={bestRecommendation.averageMatchesPerMember.toFixed(
            1
          )}
        />

        <SummaryMetric
          label="TB round nghỉ"
          value={bestRecommendation.averageRestRoundsPerMember.toFixed(
            1
          )}
        />
      </div>
    </div>
  );
}

function InputBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-700">
        {label}
      </div>

      {children}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <div className="text-xs text-slate-400">
        {label}
      </div>

      <div className="mt-2 text-lg font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function normalizeIntegerInput(
  value: string,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.floor(parsedValue)
  );
}

function normalizeNumberInput(
  value: string,
  fallback: number
): number {
  const parsedValue = Number(value);

  if (
    !Number.isFinite(parsedValue)
  ) {
    return fallback;
  }

  return parsedValue;
}

function calculateEffectivePlayMinutes({
  sessionDurationMinutes,
  overheadPercent,
}: {
  sessionDurationMinutes: number;
  overheadPercent: number;
}): number {
  const safeOverheadPercent =
    Math.min(
      60,
      Math.max(
        0,
        overheadPercent
      )
    );

  return Math.max(
    0,
    Math.round(
      sessionDurationMinutes *
        (1 -
          safeOverheadPercent /
            100)
    )
  );
}

function formatDuration(
  minutes: number
): string {
  const safeMinutes = Math.max(
    0,
    Math.round(minutes)
  );

  const hours = Math.floor(
    safeMinutes / 60
  );

  const remainingMinutes =
    safeMinutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes} phút`;
  }

  if (remainingMinutes === 0) {
    return `${hours} giờ`;
  }

  return `${hours} giờ ${remainingMinutes} phút`;
}
