"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
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
   * Số round hiện đang được chọn
   * tại trang tạo session.
   */
  selectedRoundCount?: number;

  /**
   * Trả số round được chọn về form cha.
   */
  onSelectRound: (
    roundCount: number
  ) => void;
};

type RecommendationStatus =
  | "idle"
  | "ready"
  | "stale";

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

  const [
    recommendationStatus,
    setRecommendationStatus,
  ] =
    useState<RecommendationStatus>("idle");

  const [
    lastCalculatedSignature,
    setLastCalculatedSignature,
  ] = useState<string | null>(null);

  const [
    isCalculating,
    setIsCalculating,
  ] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const resultSectionRef =
    useRef<HTMLDivElement | null>(null);

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

  const normalizedTeamConfig =
    useMemo(() => {
      if (mode !== "team") {
        return undefined;
      }

      return {
        teamAMemberIds: [
          ...(teamConfig
            ?.teamAMemberIds ?? []),
        ].sort(),

        teamBMemberIds: [
          ...(teamConfig
            ?.teamBMemberIds ?? []),
        ].sort(),
      };
    }, [
      mode,
      teamConfig,
    ]);

  /**
   * Chữ ký của toàn bộ dữ liệu ảnh hưởng
   * đến kết quả Recommendation Engine.
   */
  const currentInputSignature =
    useMemo(() => {
      return JSON.stringify({
        memberIds: [...memberIds].sort(),

        mode,

        courtCount,

        pointToWin,

        teamConfig:
          normalizedTeamConfig,

        sessionHours,

        sessionExtraMinutes,

        averageRoundMinutes,

        overheadPercent,

        startTime,
      });
    }, [
      memberIds,
      mode,
      courtCount,
      pointToWin,
      normalizedTeamConfig,
      sessionHours,
      sessionExtraMinutes,
      averageRoundMinutes,
      overheadPercent,
      startTime,
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
          normalizedTeamConfig
            ?.teamAMemberIds.length ?? 0;

        const teamBCount =
          normalizedTeamConfig
            ?.teamBMemberIds.length ?? 0;

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
      normalizedTeamConfig,
    ]);

  /**
   * Khi selectedRoundCount thay đổi từ form cha,
   * cập nhật lại trạng thái lựa chọn trong panel.
   */
  useEffect(() => {
    setSelectedRecommendationRound(
      selectedRoundCount ?? null
    );
  }, [selectedRoundCount]);

  /**
   * Nếu bất kỳ dữ liệu đầu vào nào thay đổi sau khi
   * đã tính, đánh dấu kết quả hiện tại là hết hạn.
   *
   * Không tự chạy Scheduler ngay để tránh thiết bị
   * điện thoại bị nặng khi người dùng đang chọn người.
   */
  useEffect(() => {
    if (
      lastCalculatedSignature === null ||
      recommendationResult === null
    ) {
      return;
    }

    if (
      currentInputSignature !==
      lastCalculatedSignature
    ) {
      setRecommendationStatus("stale");
    }
  }, [
    currentInputSignature,
    lastCalculatedSignature,
    recommendationResult,
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
        normalizedTeamConfig
          ?.teamAMemberIds.length ?? 0;

      const teamBCount =
        normalizedTeamConfig
          ?.teamBMemberIds.length ?? 0;

      if (
        teamACount < 2 ||
        teamBCount < 2
      ) {
        setErrorMessage(
          "Team mode cần chia ít nhất 2 thành viên vào mỗi đội trước khi tạo đề xuất."
        );

        return false;
      }

      const teamMemberIds = [
        ...(normalizedTeamConfig
          ?.teamAMemberIds ?? []),

        ...(normalizedTeamConfig
          ?.teamBMemberIds ?? []),
      ];

      const uniqueTeamMemberIds =
        new Set(teamMemberIds);

      if (
        uniqueTeamMemberIds.size !==
        teamMemberIds.length
      ) {
        setErrorMessage(
          "Một thành viên không thể nằm trong cả Team A và Team B."
        );

        return false;
      }

      const allSelectedMembersAssigned =
        memberIds.every((memberId) =>
          uniqueTeamMemberIds.has(
            memberId
          )
        );

      if (
        !allSelectedMembersAssigned
      ) {
        setErrorMessage(
          "Hãy chia đội cho tất cả thành viên trước khi tạo đề xuất."
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
      const temporarySession:
        SessionRecord = {
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
            ? normalizedTeamConfig
            : undefined,

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

      setLastCalculatedSignature(
        currentInputSignature
      );

      setRecommendationStatus(
        "ready"
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

      window.setTimeout(() => {
        resultSectionRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    } catch (error) {
      console.error(
        "Build round recommendations failed:",
        error
      );

      setRecommendationStatus(
        "idle"
      );

      setErrorMessage(
        "Không thể tạo đề xuất số round. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsCalculating(false);
    }
  }

  function handleSelectRecommendation(
    recommendation:
      RoundRecommendation
  ): void {
    if (
      recommendationStatus === "stale"
    ) {
      setErrorMessage(
        "Thông tin session đã thay đổi. Hãy tính lại đề xuất trước khi chọn phương án."
      );

      return;
    }

    setSelectedRecommendationRound(
      recommendation.roundCount
    );

    setErrorMessage("");

    onSelectRound(
      recommendation.roundCount
    );
  }

  function handleUseBestRecommendation(): void {
    if (
      recommendationStatus === "stale"
    ) {
      setErrorMessage(
        "Thông tin session đã thay đổi. Hãy tính lại đề xuất trước khi áp dụng."
      );

      return;
    }

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

    setErrorMessage("");

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

    setLastCalculatedSignature(null);

    setRecommendationStatus("idle");

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
              Hệ thống thử tối đa 5 phương án,
              tạo lịch cho từng phương án và
              đánh giá độ cân bằng, số trận mỗi
              người cùng mức phù hợp với thời
              lượng buổi chơi.
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
            value={
              sessionExtraMinutes
            }
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
            value={
              averageRoundMinutes
            }
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
            Đã bao gồm thời gian nghỉ và
            đổi sân.
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
              Thời gian thi đấu thực tế dự
              kiến sau khi trừ overhead:{" "}
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

      {recommendationStatus ===
      "stale" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-amber-900">
                Kết quả đề xuất đã hết hạn
              </div>

              <div className="mt-1 text-sm leading-6 text-amber-800">
                Thông tin session hoặc thời
                lượng đã thay đổi. Các phương
                án bên dưới chỉ dùng để tham
                khảo và không thể chọn cho tới
                khi tính lại.
              </div>

              <button
                type="button"
                onClick={
                  handleGenerateRecommendations
                }
                disabled={
                  !canGenerateRecommendation ||
                  isCalculating
                }
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Calculator size={17} />
                Tính lại đề xuất
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {recommendationStatus ===
      "ready" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} />
            Kết quả đang phù hợp với thông
            tin session hiện tại.
          </div>
        </div>
      ) : null}

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

            {recommendationStatus ===
            "stale"
              ? "Tính lại 5 phương án"
              : "Tạo 5 phương án đề xuất"}
          </>
        )}
      </button>

      {memberIds.length < 4 ? (
        <div className="mt-3 text-center text-sm text-slate-500">
          Hãy chọn ít nhất 4 thành viên trước
          khi tạo đề xuất.
        </div>
      ) : null}

      {mode === "team" &&
      !canGenerateRecommendation &&
      memberIds.length >= 4 ? (
        <div className="mt-3 text-center text-sm text-slate-500">
          Hãy chia tất cả thành viên vào Team
          A và Team B trước khi tạo đề xuất.
        </div>
      ) : null}

      {recommendationResult ? (
        <div
          ref={resultSectionRef}
          className={`mt-6 scroll-mt-6 ${
            recommendationStatus ===
            "stale"
              ? "opacity-60"
              : ""
          }`}
        >
          <RecommendationSummary
            result={
              recommendationResult
            }
            disabled={
              recommendationStatus ===
              "stale"
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
                <div
                  key={
                    recommendation.roundCount
                  }
                  className={
                    recommendationStatus ===
                    "stale"
                      ? "pointer-events-none"
                      : ""
                  }
                >
                  <RoundRecommendationCard
                    recommendation={
                      recommendation
                    }
                    rank={index + 1}
                    selected={
                      recommendationStatus ===
                        "ready" &&
                      selectedRecommendationRound ===
                        recommendation.roundCount
                    }
                    onSelect={
                      handleSelectRecommendation
                    }
                  />
                </div>
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
  disabled,
  onUseBest,
}: {
  result: RoundRecommendationResult;

  disabled: boolean;

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
            {bestRecommendation.roundCount}{" "}
            round
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
          disabled={disabled}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dùng đề xuất{" "}
          {bestRecommendation.roundCount}{" "}
          round
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

  if (!Number.isFinite(parsedValue)) {
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

  if (!Number.isFinite(parsedValue)) {
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
