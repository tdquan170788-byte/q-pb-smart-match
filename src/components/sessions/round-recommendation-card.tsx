import {
  CheckCircle2,
  Clock3,
  Coffee,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import type {
  RoundRecommendation,
  RoundRecommendationLevel,
} from "@/lib/sessions/round-recommendation";

type RoundRecommendationCardProps = {
  recommendation: RoundRecommendation;

  rank: number;

  selected: boolean;

  onSelect: (
    recommendation: RoundRecommendation
  ) => void;
};

export default function RoundRecommendationCard({
  recommendation,
  rank,
  selected,
  onSelect,
}: RoundRecommendationCardProps) {
  const presentation =
    getLevelPresentation(
      recommendation.level
    );

  const starCount =
    getRecommendationStarCount(
      recommendation.recommendationScore
    );

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border bg-white p-5 transition ${
        selected
          ? "border-brand-500 ring-2 ring-brand-100"
          : recommendation.isRecommended
            ? "border-emerald-300"
            : "border-slate-200"
      }`}
    >
      {recommendation.isRecommended ? (
        <div className="absolute right-0 top-0 rounded-bl-2xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white">
          Đề xuất tốt nhất
        </div>
      ) : null}

      <div className="flex items-start gap-4">
        <RankBadge
          rank={rank}
          isRecommended={
            recommendation.isRecommended
          }
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 pr-20">
            <div className="text-2xl font-bold text-slate-900">
              {recommendation.roundCount} round
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${presentation.badgeClassName}`}
            >
              {recommendation.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <Star
                  key={index}
                  size={17}
                  className={
                    index < starCount
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }
                />
              ))}
            </div>

            <div className="text-sm text-slate-500">
              Điểm đề xuất:
              <span className="ml-1 font-bold text-slate-900">
                {recommendation.recommendationScore.toFixed(
                  1
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <RecommendationMetric
              icon={
                <Trophy size={16} />
              }
              label="Chất lượng"
              value={`${recommendation.qualityScore.toFixed(
                1
              )}/100`}
            />

            <RecommendationMetric
              icon={
                <Users size={16} />
              }
              label="TB trận/người"
              value={recommendation.averageMatchesPerMember.toFixed(
                1
              )}
            />

            <RecommendationMetric
              icon={
                <Coffee size={16} />
              }
              label="TB round nghỉ"
              value={recommendation.averageRestRoundsPerMember.toFixed(
                1
              )}
            />

            <RecommendationMetric
              icon={
                <Clock3 size={16} />
              }
              label="Thời lượng"
              value={
                recommendation.estimatedDurationMinutes !==
                null
                  ? formatDuration(
                      recommendation.estimatedDurationMinutes
                    )
                  : "Không tính"
              }
            />
          </div>

          {recommendation.estimatedEndTime ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Giờ kết thúc dự kiến:
              <span className="ml-1 font-bold text-slate-900">
                {
                  recommendation.estimatedEndTime
                }
              </span>

              {recommendation.durationDifferenceMinutes !==
              null ? (
                <span
                  className={`ml-2 font-medium ${
                    recommendation.durationDifferenceMinutes >
                    5
                      ? "text-amber-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatDurationDifference(
                    recommendation.durationDifferenceMinutes
                  )}
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 text-sm leading-6 text-slate-600">
            {recommendation.description}
          </div>

          <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
            <SmallStat
              label="Lệch số trận"
              value={
                recommendation.matchCountDifference
              }
            />

            <SmallStat
              label="Lặp đồng đội tối đa"
              value={
                recommendation.maxTeammateRepeatCount
              }
            />

            <SmallStat
              label="Nghỉ liên tiếp tối đa"
              value={
                recommendation.maxConsecutiveRestCount
              }
            />
          </div>

          <button
            type="button"
            onClick={() =>
              onSelect(recommendation)
            }
            className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition ${
              selected
                ? "bg-emerald-600 text-white"
                : recommendation.isRecommended
                  ? "bg-brand-600 text-white hover:opacity-90"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {selected ? (
              <>
                <CheckCircle2 size={18} />
                Đã chọn phương án này
              </>
            ) : (
              <>
                Dùng phương án{" "}
                {recommendation.roundCount} round
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RankBadge({
  rank,
  isRecommended,
}: {
  rank: number;
  isRecommended: boolean;
}) {
  const rankLabel =
    rank === 1
      ? "🥇"
      : rank === 2
        ? "🥈"
        : rank === 3
          ? "🥉"
          : `#${rank}`;

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
        isRecommended
          ? "bg-emerald-100 text-emerald-800"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {rankLabel}
    </div>
  );
}

function RecommendationMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>

      <div className="mt-2 text-base font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span>{label}: </span>

      <span className="font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function getLevelPresentation(
  level: RoundRecommendationLevel
): {
  badgeClassName: string;
} {
  if (level === "excellent") {
    return {
      badgeClassName:
        "bg-emerald-100 text-emerald-800",
    };
  }

  if (level === "very-good") {
    return {
      badgeClassName:
        "bg-blue-100 text-blue-800",
    };
  }

  if (level === "good") {
    return {
      badgeClassName:
        "bg-amber-100 text-amber-800",
    };
  }

  return {
    badgeClassName:
      "bg-slate-100 text-slate-700",
  };
}

function getRecommendationStarCount(
  score: number
): number {
  if (score >= 90) {
    return 5;
  }

  if (score >= 80) {
    return 4;
  }

  if (score >= 68) {
    return 3;
  }

  if (score >= 50) {
    return 2;
  }

  return 1;
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

function formatDurationDifference(
  differenceMinutes: number
): string {
  const roundedDifference = Math.round(
    differenceMinutes
  );

  if (
    Math.abs(roundedDifference) <= 5
  ) {
    return "• Sát thời lượng";
  }

  if (roundedDifference < 0) {
    return `• Sớm ${Math.abs(
      roundedDifference
    )} phút`;
  }

  return `• Vượt ${roundedDifference} phút`;
}
